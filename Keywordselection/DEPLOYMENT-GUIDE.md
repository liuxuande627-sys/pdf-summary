# 🚀 KWZero MVP 部署指南

## 第一阶段：我已为您完成的工作 ✅

### 已完成的优化：
- ✅ **清理多余文件** - 删除了所有未使用的文件和目录
- ✅ **补全关键词数据** - 80个高质量关键词覆盖8个行业
- ✅ **创建环境模板** - 提供.env.example和.gitignore
- ✅ **优化服务器代码** - 增强错误处理和日志记录
- ✅ **完善API响应** - 添加详细的健康检查信息

## 第二阶段：需要您完成的步骤 📋

### 步骤1：Stripe账户设置（5分钟）

#### 🎯 创建Stripe账户
1. 访问 [stripe.com](https://stripe.com) 注册账户
2. 完成邮箱验证
3. 进入 **Test Mode**（测试模式）

#### 🏗️ 创建产品
```
产品名称：KWZero - 30次关键词生成
价格：$4.90 USD
类型：One-time（一次性付款）
```

#### 🔑 获取API密钥
1. 进入 Dashboard → Developers → API keys
2. 复制以下密钥：
   - **Secret key** (以 `sk_test_` 开头)
   - **Publishable key** (以 `pk_test_` 开头)

#### 🎯 配置Webhook（可选）
1. 进入 Developers → Webhooks
2. 添加端点：
   - URL: `https://your-domain.com/api/webhook`
   - 事件：`checkout.session.completed`
3. 复制 **Webhook secret** (以 `whsec_` 开头)

### 步骤2：环境变量配置（2分钟）

#### 📝 创建生产环境文件
```bash
# 复制模板
cp .env.example .env

# 编辑.env文件，填入您的密钥
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
```

### 步骤3：Vercel一键部署（3分钟）

#### 🚀 一键部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/kwzero-mvp)

#### 📋 手动部署步骤
1. 访问 [vercel.com](https://vercel.com)
2. 点击 **New Project**
3. 导入您的GitHub仓库
4. 设置环境变量：
   ```
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_key
   ```
5. 点击 **Deploy**

### 步骤4：域名配置（可选，2分钟）

#### 🌐 使用默认域名
- Vercel会自动提供 `https://your-project.vercel.app`

#### 🔗 自定义域名
1. 在Vercel项目设置中添加域名
2. 配置DNS指向Vercel
3. 等待SSL证书自动配置

## 第三阶段：测试验证 ✅

### 本地测试
```bash
# 1. 安装依赖
npm install

# 2. 设置环境变量
cp .env.local .env
# 编辑.env文件填入测试密钥

# 3. 启动服务器
npm run dev

# 4. 测试API
curl http://localhost:3001/api/health
```

### 生产测试
1. 访问部署的域名
2. 测试关键词生成功能
3. 测试支付流程（使用Stripe测试卡：4242 4242 4242 4242）

## 🔍 监控和日志

### 健康检查端点
```
GET /api/health
```

### 生产监控建议
- 使用 UptimeRobot 监控可用性
- 设置 Stripe 支付通知
- 监控关键词使用统计

## 📞 故障排除

### 常见问题
1. **端口占用**：使用 `PORT=3002 npm start`
2. **CORS错误**：检查环境变量配置
3. **Stripe错误**：确认密钥和webhook配置
4. **关键词不显示**：检查data/keywords.json文件

### 获取帮助
- 查看控制台日志
- 测试健康检查端点
- 检查Stripe Dashboard

## 🎯 成功标准

部署成功后，您应该能够：
- ✅ 访问网站首页
- ✅ 选择行业并生成关键词
- ✅ 使用3次免费试用
- ✅ 完成Stripe支付
- ✅ 获得30次额外生成机会

## 📊 项目统计
- **关键词总数**：80个高质量关键词
- **行业覆盖**：8个热门行业
- **预计部署时间**：10分钟
- **运营成本**：$0（Vercel免费层）

---

**🎉 完成以上步骤后，您的KWZero MVP将正式上线！**