# KWZero MVP 部署指南

## 部署选项

### 1. Vercel 一键部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/kwzero-mvp)

**步骤：**
1. 点击上面的按钮
2. 登录Vercel账号
3. 设置环境变量：
   - `STRIPE_SECRET_KEY` - Stripe私钥
   - `STRIPE_PUBLISHABLE_KEY` - Stripe公钥
   - `STRIPE_WEBHOOK_SECRET` - Webhook密钥（可选）
4. 点击"Deploy"

### 2. Railway 部署

**步骤：**
1. 访问 [railway.app](https://railway.app)
2. 创建新项目
3. 连接GitHub仓库
4. 设置环境变量
5. 点击"Deploy"

### 3. 本地生产部署

**使用PM2：**
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server-mvp.js --name kwzero-mvp

# 保存配置
pm2 save
pm2 startup
```

### 4. Docker 部署

**创建Dockerfile：**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server-mvp.js"]
```

**构建并运行：**
```bash
docker build -t kwzero-mvp .
docker run -p 3000:3000 -e STRIPE_SECRET_KEY=your_key kwzero-mvp
```

## Stripe 配置

### 测试环境
1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/test)
2. 创建产品：
   - 名称：KWZero - 30次关键词生成
   - 价格：$4.90 USD
   - 类型：One-time
3. 获取API密钥
4. 配置Webhook：
   - 端点：`https://your-domain.com/api/webhook`
   - 事件：`checkout.session.completed`

### 生产环境
1. 激活Stripe账户
2. 重复测试环境步骤
3. 更新所有密钥为生产环境密钥

## 域名配置

### 自定义域名
在Vercel/Railway中配置自定义域名：
1. 添加域名
2. 配置DNS记录
3. 等待SSL证书生效

### CDN配置（可选）
对于全球访问，可以配置：
- Cloudflare CDN
- AWS CloudFront
- Vercel Edge Network（自动）

## 监控配置

### 基本监控
```javascript
// 添加健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Uptime监控
- 使用 [UptimeRobot](https://uptimerobot.com)
- 配置HTTP监控每5分钟检查一次

## 备份策略

### 关键词数据备份
- 每周更新keywords.json文件
- 使用Git进行版本控制
- 上传到云存储（AWS S3/Google Cloud Storage）

## 性能优化

### CDN加速
- 静态文件使用CDN
- 图片压缩和优化
- 启用Gzip压缩

### 缓存策略
```javascript
// 启用缓存
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));
```

## 安全配置

### 生产环境检查清单
- [ ] 使用HTTPS
- [ ] 配置CORS正确域名
- [ ] 设置安全头部（Helmet.js已配置）
- [ ] 更新所有API密钥
- [ ] 配置日志监控
- [ ] 设置错误追踪

### 环境变量
```bash
# 生产环境必需
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=production
PORT=3000
```

## 故障排查

### 常见问题
1. **端口占用**：使用 `PORT=3001 node server-mvp.js`
2. **依赖缺失**：运行 `npm install --production`
3. **CORS错误**：检查环境变量配置
4. **Stripe错误**：确认密钥和webhook配置

### 调试技巧
```bash
# 查看日志
pm2 logs kwzero-mvp

# 测试API
curl -X POST http://localhost:3000/api/keywords \
  -H "Content-Type: application/json" \
  -d '{"industry": "SaaS"}'
```

## 更新部署

### 零停机更新
```bash
# 使用PM2
pm2 reload kwzero-mvp

# 使用Docker
docker-compose up -d --build
```

### 版本管理
- 使用语义化版本号
- 创建Git标签
- 维护CHANGELOG.md

## 支持

遇到问题？请联系：
- 邮箱：support@kwzero.com
- GitHub Issues: [创建新问题](https://github.com/your-username/kwzero-mvp/issues)