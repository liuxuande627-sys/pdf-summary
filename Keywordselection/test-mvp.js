const request = require('supertest');
const app = require('./server-mvp');

// 测试基本功能
async function runTests() {
    console.log('🧪 开始测试KWZero MVP...\n');

    // 测试健康检查
    console.log('1. 测试健康检查API...');
    const healthRes = await request(app).get('/api/health');
    console.log(`   ✅ 状态: ${healthRes.status}, 响应: ${JSON.stringify(healthRes.body)}\n`);

    // 测试获取行业列表
    console.log('2. 测试行业列表API...');
    const industriesRes = await request(app).get('/api/industries');
    console.log(`   ✅ 状态: ${industriesRes.status}, 行业数量: ${industriesRes.body.industries.length}\n`);

    // 测试关键词生成
    console.log('3. 测试关键词生成API...');
    const keywordsRes = await request(app)
        .post('/api/keywords')
        .send({ industry: 'SaaS' })
        .set('X-Forwarded-For', '192.168.1.100');

    if (keywordsRes.status === 200) {
        console.log(`   ✅ 状态: ${keywordsRes.status}, 生成关键词数量: ${keywordsRes.body.keywords.length}`);
        console.log(`   ✅ 剩余次数: ${keywordsRes.body.remaining}\n`);
        
        // 显示前3个关键词
        keywordsRes.body.keywords.slice(0, 3).forEach((kw, index) => {
            console.log(`   ${index + 1}. ${kw.keyword} (搜索量: ${kw.volume}, 难度: ${kw.difficulty})`);
        });
    } else {
        console.log(`   ❌ 状态: ${keywordsRes.status}, 错误: ${keywordsRes.body.error}\n`);
    }

    // 测试用户状态
    console.log('4. 测试用户状态API...');
    const statusRes = await request(app)
        .get('/api/status')
        .set('X-Forwarded-For', '192.168.1.100');
    console.log(`   ✅ 状态: ${statusRes.status}, 剩余次数: ${statusRes.body.remaining}\n`);

    // 测试支付会话创建
    console.log('5. 测试支付会话创建...');
    const paymentRes = await request(app)
        .post('/api/payment/create-checkout')
        .send({ ip: '192.168.1.100' });
    
    if (paymentRes.status === 200) {
        console.log(`   ✅ 状态: ${paymentRes.status}, 会话ID: ${paymentRes.body.sessionId.substring(0, 10)}...\n`);
    } else {
        console.log(`   ❌ 状态: ${paymentRes.status}, 错误: ${paymentRes.body.error}\n`);
    }

    console.log('🎉 所有测试完成！');
    process.exit(0);
}

// 运行测试
if (require.main === module) {
    runTests().catch(console.error);
}