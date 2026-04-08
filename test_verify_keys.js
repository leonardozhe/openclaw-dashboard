/**
 * 验证公钥和私钥是否匹配
 */

const nacl = require('tweetnacl');
const crypto = require('crypto');

// 从 device.json 读取密钥
const deviceJson = {
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAzGcaFELXFhCIhDkBrXO2q024iG+BRdhnHe9XJzJSV/A=\n-----END PUBLIC KEY-----\n",
  "privateKeyPem": "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIGoGF71Fw3B2clWTTucF9IB1YnmcXdlNUpC1DWSUaO17\n-----END PRIVATE KEY-----\n"
};

// 从 paired.json 读取公钥
const pairedJsonPublicKey = "zGcaFELXFhCIhDkBrXO2q024iG-BRdhnHe9XJzJSV_A";

console.log('=== 密钥验证 ===\n');

// 从 PEM 提取私钥种子
const privateKeyBase64 = deviceJson.privateKeyPem
  .replace('-----BEGIN PRIVATE KEY-----', '')
  .replace('-----END PRIVATE KEY-----', '')
  .replace(/\s/g, '');
const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
const seed = privateKeyBytes.slice(16); // 32 字节种子

// 从 PEM 提取公钥
const publicKeyPemBase64 = deviceJson.publicKeyPem
  .replace('-----BEGIN PUBLIC KEY-----', '')
  .replace('-----END PUBLIC KEY-----', '')
  .replace(/\s/g, '');
const publicKeyPemBytes = Buffer.from(publicKeyPemBase64, 'base64');
const rawPublicKeyFromPem = publicKeyPemBytes.slice(12); // 去掉 12 字节 ASN.1 头部

console.log('Private key (48 bytes):', privateKeyBytes.toString('hex'));
console.log('Seed (32 bytes):', seed.toString('hex'));
console.log('Public key from PEM (32 bytes):', rawPublicKeyFromPem.toString('hex'));
console.log('');

// 生成密钥对
const keyPair = nacl.sign.keyPair.fromSeed(seed);
const generatedPublicKey = Buffer.from(keyPair.publicKey);

console.log('Generated public key (32 bytes):', generatedPublicKey.toString('hex'));
console.log('Public keys match:', generatedPublicKey.toString('hex') === rawPublicKeyFromPem.toString('hex'));
console.log('');

// 转换为 URL-safe base64
const rawPublicKeyBase64 = rawPublicKeyFromPem.toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

console.log('Raw public key (URL-safe base64):', rawPublicKeyBase64);
console.log('paired.json public key:', pairedJsonPublicKey);
console.log('Public key match paired.json:', rawPublicKeyBase64 === pairedJsonPublicKey);
console.log('');

// 测试签名
const testNonce = "524f4cdd-c92b-40db-bdae-e85694a2deac";
const message = Buffer.from(testNonce, 'utf8');
const signature = nacl.sign.detached(message, keyPair.secretKey);
const signatureBase64 = Buffer.from(signature).toString('base64');

console.log('=== 签名测试 ===\n');
console.log('Nonce:', testNonce);
console.log('Message bytes:', message.toString('hex'));
console.log('Signature:', signatureBase64);
console.log('');

// 验证签名
const isValid = nacl.sign.detached.verify(message, signature, keyPair.publicKey);
console.log('Signature verification (local):', isValid);

// 使用公钥验证
const verifyWithPublicKey = nacl.sign.detached.verify(message, signature, generatedPublicKey);
console.log('Signature verification (with public key):', verifyWithPublicKey);

// 尝试不同的签名格式
console.log('\n=== 不同签名格式测试 ===\n');

// 格式 1: UTF-8 字符串
const sig1 = nacl.sign.detached(Buffer.from(testNonce, 'utf8'), keyPair.secretKey);
console.log('1. UTF-8 string:', Buffer.from(sig1).toString('base64'));

// 格式 2: 原始字节（UUID 去掉连字符）
const nonceWithoutDashes = testNonce.replace(/-/g, '');
const sig2 = nacl.sign.detached(Buffer.from(nonceWithoutDashes, 'hex'), keyPair.secretKey);
console.log('2. Raw UUID bytes:', Buffer.from(sig2).toString('base64'));

// 格式 3: JSON 字符串
const sig3 = nacl.sign.detached(Buffer.from(JSON.stringify(testNonce), 'utf8'), keyPair.secretKey);
console.log('3. JSON stringified:', Buffer.from(sig3).toString('base64'));

// 格式 4: 带引号的字符串
const sig4 = nacl.sign.detached(Buffer.from('"' + testNonce + '"', 'utf8'), keyPair.secretKey);
console.log('4. Quoted string:', Buffer.from(sig4).toString('base64'));
