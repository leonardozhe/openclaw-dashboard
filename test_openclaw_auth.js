/**
 * OpenClaw 设备认证测试脚本 v2
 * 使用正确的请求格式
 */

const nacl = require('tweetnacl');
const WebSocket = require('ws');

// 从 device.json 读取私钥
const deviceJson = {
  "privateKeyPem": "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIGoGF71Fw3B2clWTTucF9IB1YnmcXdlNUpC1DWSUaO17\n-----END PRIVATE KEY-----\n"
};

// 从 paired.json 读取公钥
const pairedJson = {
  "publicKey": "zGcaFELXFhCIhDkBrXO2q024iG-BRdhnHe9XJzJSV_A",
  "deviceId": "00f5e342c5cb4e53449a4e4d1560c25695c997fb40f3e81079115300c111454f",
  "clientId": "cli",
  "clientMode": "probe"
};

// Gateway token
const gatewayToken = "80e499eb83c19deb34388f1222c5f1a62ff37ba9a9f3f106";

// 从 PEM 提取私钥种子
const privateKeyBase64 = deviceJson.privateKeyPem
  .replace('-----BEGIN PRIVATE KEY-----', '')
  .replace('-----END PRIVATE KEY-----', '')
  .replace(/\s/g, '');
const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
const seed = privateKeyBytes.slice(16); // 32 字节种子

// 生成密钥对
const keyPair = nacl.sign.keyPair.fromSeed(seed);

// 测试连接
console.log('=== OpenClaw 认证测试 v2 ===\n');

const ws = new WebSocket('ws://127.0.0.1:18789');

ws.on('open', () => {
  console.log('✓ WebSocket 连接成功');
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('收到消息:', JSON.stringify(message, null, 2));
  
  if (message.event === 'connect.challenge' || message.type === 'connect.challenge') {
    const nonce = message.payload?.nonce;
    console.log('\n收到挑战 nonce:', nonce);
    
    // 签名 nonce
    const challengeMessage = Buffer.from(nonce, 'utf8');
    const challengeSignature = nacl.sign.detached(challengeMessage, keyPair.secretKey);
    const challengeSignatureBase64 = Buffer.from(challengeSignature).toString('base64');
    
    console.log('生成签名:', challengeSignatureBase64);
    
    // 发送 connect 请求 - 使用正确的帧格式
    // OpenClaw 使用 { type: "req", id: "...", method: "connect", params: {...} }
    const requestId = `conn-${Date.now()}`;
    const connectMsg = {
      type: 'req',
      id: requestId,
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: pairedJson.clientId,
          displayName: 'Test Client',
          version: '1.0.0',
          platform: 'darwin',
          mode: pairedJson.clientMode,
          instanceId: pairedJson.deviceId
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write', 'operator.admin'],
        userAgent: 'TestClient/1.0',
        locale: 'zh-CN',
        device: {
          id: pairedJson.deviceId,
          publicKey: pairedJson.publicKey,
          signature: challengeSignatureBase64,
          signedAt: Date.now(),
          nonce: nonce
        },
        auth: {
          token: gatewayToken
        }
      }
    };
    
    console.log('\n发送 connect 请求:', JSON.stringify(connectMsg, null, 2));
    ws.send(JSON.stringify(connectMsg));
  }
  
  // 处理响应
  if (message.type === 'res' && message.id === `conn-${Date.now().toString().substring(0, 10)}`) {
    console.log('\n=== 认证响应 ===');
    if (message.result) {
      console.log('✓ 认证成功！');
      console.log('Result:', JSON.stringify(message.result, null, 2));
    } else if (message.error) {
      console.log('❌ 认证失败:', message.error);
    }
  }
});

ws.on('close', (code, reason) => {
  console.log(`\n连接关闭：code=${code}, reason=${reason}`);
});

ws.on('error', (err) => {
  console.error('WebSocket 错误:', err.message);
});

// 10 秒后关闭
setTimeout(() => {
  console.log('\n测试超时，关闭连接');
  ws.close();
  process.exit(0);
}, 10000);
