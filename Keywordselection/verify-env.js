#!/usr/bin/env node

/**
 * KWZero 环境变量验证脚本
 * 使用：node verify-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证KWZero环境变量...\n');

// 检查.env文件是否存在
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env 文件不存在');
  console.log('📋 请复制 .env.example 为 .env 并填入实际值');
  process.exit(1);
}

// 读取并验证.env文件
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

const requiredVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY'
];

const optionalVars = [
  'STRIPE_WEBHOOK_SECRET'
];

let hasErrors = false;

console.log('📋 必需的环境变量检查：');
requiredVars.forEach(key => {
  const line = lines.find(l => l.startsWith(key));
  if (!line) {
    console.error(`❌ 缺少 ${key}`);
    hasErrors = true;
  } else if (line.includes('your_actual_key') || line.includes('your_stripe_key')) {
    console.error(`❌ ${key} 需要填入实际值`);
    hasErrors = true;
  } else {
    console.log(`✅ ${key} 已配置`);
  }
});

console.log('\n📋 可选的环境变量检查：');
optionalVars.forEach(key => {
  const line = lines.find(l => l.startsWith(key));
  if (line && !line.includes('your_actual_key')) {
    console.log(`✅ ${key} 已配置`);
  } else {
    console.log(`⚠️  ${key} 未配置（可选）`);
  }
});

// 验证密钥格式
const secretKey = lines.find(l => l.startsWith('STRIPE_SECRET_KEY'));
const publishableKey = lines.find(l => l.startsWith('STRIPE_PUBLISHABLE_KEY'));

if (secretKey) {
  const value = secretKey.split('=')[1]?.trim();
  if (!value || !value.startsWith('sk_test_')) {
    console.error('❌ STRIPE_SECRET_KEY 格式错误，应以 sk_test_ 开头');
    hasErrors = true;
  }
}

if (publishableKey) {
  const value = publishableKey.split('=')[1]?.trim();
  if (!value || !value.startsWith('pk_test_')) {
    console.error('❌ STRIPE_PUBLISHABLE_KEY 格式错误，应以 pk_test_ 开头');
    hasErrors = true;
  }
}

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ 环境变量配置有误，请按以下格式修改 .env 文件：');
  console.log('\n示例格式：');
  console.log('STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890');
  console.log('STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890');
  console.log('STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here');
} else {
  console.log('✅ 环境变量配置正确，可以开始部署！');
}

// 显示当前配置摘要
console.log('\n📊 当前配置摘要：');
console.log('项目路径：', __dirname);
console.log('关键词数量：', Object.keys(require('./data/keywords.json')).length, '个行业');
console.log('总计关键词：', Object.values(require('./data/keywords.json')).reduce((sum, arr) => sum + arr.length, 0), '个');