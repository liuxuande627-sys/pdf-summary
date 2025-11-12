const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Stripe = require('stripe');
const net = require('net');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// 初始化Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo_key');

// 中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://cdn.tailwindcss.com",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// 添加缓存控制中间件，防止样式缓存问题
app.use((req, res, next) => {
  // 对HTML文件禁用缓存
  if (req.url === '/' || req.url.endsWith('.html')) {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// 加载关键词数据
let keywordsData = {};
try {
  keywordsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'keywords.json'), 'utf8'));
  console.log(`✅ 成功加载 ${Object.keys(keywordsData).length} 个行业的关键词数据`);
} catch (error) {
  console.error('❌ 加载关键词数据失败:', error.message);
  process.exit(1);
}

// 用户计数存储 (生产环境用Redis)
const userCounters = new Map();

// 关键词评分算法
function calculateKeywordScore(keyword) {
  return Math.round((keyword.volume * 0.7 + keyword.cpc * 100) / (keyword.difficulty + 1));
}

// 生成关键词推荐
function generateKeywords(industry, count = 10) {
  const industryKeywords = keywordsData[industry] || [];
  const filteredKeywords = industryKeywords
    .filter(k => k.difficulty < 30 && k.volume > 100)
    .sort((a, b) => calculateKeywordScore(b) - calculateKeywordScore(a))
    .slice(0, count);
  
  return filteredKeywords.map(k => ({
    keyword: k.keyword,
    volume: k.volume,
    difficulty: k.difficulty,
    cpc: k.cpc,
    score: calculateKeywordScore(k)
  }));
}

// 获取用户IP - 支持代理和本地开发
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         '127.0.0.1';
}

// 检查用户剩余次数
function getUserRemaining(ip) {
  const user = userCounters.get(ip) || { used: 0, paid: 0 };
  return Math.max(0, 3 + user.paid - user.used);
}

// 使用一次次数
function useKeywordGeneration(ip) {
  const user = userCounters.get(ip) || { used: 0, paid: 0 };
  user.used += 1;
  userCounters.set(ip, user);
  return getUserRemaining(ip);
}

// 增加付费次数
function addPaidCredits(ip, credits) {
  const user = userCounters.get(ip) || { used: 0, paid: 0 };
  user.paid += credits;
  userCounters.set(ip, user);
  return getUserRemaining(ip);
}

// API路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// 获取行业列表
app.get('/api/industries', (req, res) => {
  const industries = Object.keys(keywordsData);
  res.json({ industries });
});

// 获取用户状态
app.get('/api/status', (req, res) => {
  const ip = getClientIP(req);
  const remaining = getUserRemaining(ip);
  res.json({ 
    remaining, 
    max: 3 + (userCounters.get(ip)?.paid || 0),
    totalPaid: userCounters.get(ip)?.paid || 0
  });
});

// 生成关键词
app.post('/api/keywords', (req, res) => {
  try {
    const { industry } = req.body;
    const ip = getClientIP(req);
    
    if (!industry || !keywordsData[industry]) {
      return res.status(400).json({ error: '请选择有效的行业' });
    }
    
    const remaining = getUserRemaining(ip);
    if (remaining <= 0) {
      return res.status(429).json({ 
        error: '免费次数已用完，请升级获得更多关键词',
        remaining: 0,
        upgradeUrl: '/api/payment/create-checkout'
      });
    }
    
    const keywords = generateKeywords(industry);
    const newRemaining = useKeywordGeneration(ip);
    
    res.json({
      keywords,
      remaining: newRemaining,
      totalGenerated: keywords.length,
      industry: industry
    });
    
  } catch (error) {
    console.error('关键词生成错误:', error);
    res.status(500).json({ error: '关键词生成失败，请重试' });
  }
});

// 创建Stripe Checkout会话
app.post('/api/payment/create-checkout', async (req, res) => {
  try {
    const { ip } = req.body;
    const clientIP = ip || getClientIP(req);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'KWZero - 30次关键词生成',
              description: '一次性付费，永久有效',
            },
            unit_amount: 490, // $4.90
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}?payment=success`,
      cancel_url: `${req.headers.origin}?payment=cancel`,
      metadata: {
        ip: clientIP,
        credits: '30'
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('创建支付会话失败:', error);
    res.status(500).json({ error: '创建支付会话失败' });
  }
});

// Stripe Webhook处理
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook签名验证失败:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const ip = session.metadata.ip;
    const credits = parseInt(session.metadata.credits);
    
    if (ip && credits) {
      addPaidCredits(ip, credits);
      console.log(`为用户 ${ip} 添加了 ${credits} 次生成机会`);
    }
  }

  res.json({ received: true });
});

// 支付状态检查
app.get('/api/payment/status', (req, res) => {
  const ip = getClientIP(req);
  const remaining = getUserRemaining(ip);
  
  res.json({
    remaining,
    totalCredits: 3 + (userCounters.get(ip)?.paid || 0),
    paidCredits: userCounters.get(ip)?.paid || 0
  });
});

// 为根路径提供index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 端口可用性检测函数
function checkPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(port, (err) => {
      if (err) {
        resolve(false);
      } else {
        server.close(() => {
          resolve(true);
        });
      }
    });
    
    server.on('error', (err) => {
      resolve(false);
    });
  });
}

// 查找可用端口函数
async function findAvailablePort(startPort, maxAttempts = 10) {
  let port = startPort;
  
  for (let i = 0; i < maxAttempts; i++) {
    const isAvailable = await checkPortAvailable(port);
    if (isAvailable) {
      return port;
    }
    console.log(`⚠️  端口 ${port} 被占用，尝试下一个端口...`);
    port++;
  }
  
  throw new Error(`无法在 ${startPort}-${startPort + maxAttempts - 1} 范围内找到可用端口`);
}

// 智能服务器启动函数
async function startServer() {
  try {
    const availablePort = await findAvailablePort(PORT);
    
    if (availablePort !== PORT) {
      console.log(`🔄 原端口 ${PORT} 不可用，自动切换到端口 ${availablePort}`);
    }
    
    const server = app.listen(availablePort, () => {
      console.log('🚀 KWZero MVP服务器启动成功！');
      console.log(`📍 服务器地址: http://localhost:${availablePort}`);
      console.log(`📊 健康检查: http://localhost:${availablePort}/api/health`);
      console.log(`🎯 关键词API: http://localhost:${availablePort}/api/keywords`);
      console.log(`💳 支付API: http://localhost:${availablePort}/api/payment/create-checkout`);
      console.log(`📱 前端地址: http://localhost:${availablePort}`);
      console.log(`🔧 行业列表: http://localhost:${availablePort}/api/industries`);
      console.log('\n服务器已就绪，等待请求...');
    });
    
    // 服务器启动错误处理
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${availablePort} 被占用，这不应该发生！`);
        console.error('请检查是否有其他进程在启动过程中占用了该端口');
      } else {
        console.error('❌ 服务器启动失败:', err.message);
      }
      process.exit(1);
    });
    
    // 优雅关闭处理
    const gracefulShutdown = (signal) => {
      console.log(`\n收到 ${signal} 信号，开始优雅关闭...`);
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
    
  } catch (error) {
    console.error('❌ 无法启动服务器:', error.message);
    console.error('💡 建议：请检查是否有太多服务正在运行，或手动指定端口');
    process.exit(1);
  }
}

// 启动服务器
startServer();

module.exports = app;