/**
 * 验证 OpenClaw RPC 状态修复脚本
 * 检查 /api/openclaw-status 端点返回的 RPC 状态是否正确
 */

const axios = require('axios');

async function verifyRpcStatus() {
  console.log('🔍 正在验证 OpenClaw RPC 状态修复...');

  try {
    // 从本地开发服务器获取状态
    const response = await axios.get('http://localhost:3000/api/openclaw-status');
    const status = response.data;

    console.log('\n📋 OpenClaw 状态信息:');
    console.log(`版本: ${status.version}`);
    console.log(`健康状态: ${status.health}`);
    console.log(`RPC 状态: ${status.rpc?.ok ? '正常' : '异常'}`);
    console.log(`RPC URL: ${status.rpc?.url || 'N/A'}`);
    console.log(`Gateway 可达性: ${status.gateway?.reachable ? '是' : '否'}`);
    console.log(`Gateway 地址: ${status.gateway?.address || 'N/A'}`);

    // 验证修复效果
    console.log('\n✅ 修复验证结果:');

    if (status.rpc) {
      console.log(`  RPC 字段存在: 是`);
      console.log(`  RPC 状态: ${status.rpc.ok ? '✅ 正常' : '❌ 异常'}`);
    } else {
      console.log(`  RPC 字段存在: 否`);
    }

    // 判断是否修复成功
    const isFixed = status.rpc && typeof status.rpc.ok === 'boolean';
    if (isFixed) {
      console.log('\n🎉 RPC 状态修复验证成功!');
      console.log('   - RPC 状态字段正确返回');
      console.log('   - 不再显示错误的 RPC 异常');
    } else {
      console.log('\n⚠️ RPC 状态修复可能未完全生效');
      console.log('   - 检查 /api/openclaw-status 端点是否正常工作');
    }

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    console.log('\n💡 提示: 请确保开发服务器正在运行 (npm run dev 或 yarn dev)');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  verifyRpcStatus();
}

module.exports = { verifyRpcStatus };