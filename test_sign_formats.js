const nacl = require('tweetnacl');

const privateKeyPem = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIGoGF71Fw3B2clWTTucF9IB1YnmcXdlNUpC1DWSUaO17
-----END PRIVATE KEY-----`;

const nonce = "b42f6e9f-dfe3-44cb-a982-d4f20bd8c10d";

// 从 PEM 提取私钥种子
const privateKeyBase64 = privateKeyPem
  .replace('-----BEGIN PRIVATE KEY-----', '')
  .replace('-----END PRIVATE KEY-----', '')
  .replace(/\s/g, '');
const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
const seed = privateKeyBytes.slice(16);
const keyPair = nacl.sign.keyPair.fromSeed(seed);

console.log('Testing different signature formats for nonce:', nonce);
console.log('');

// 格式 1: UTF-8 字符串（当前实现）
const msg1 = Buffer.from(nonce, 'utf8');
const sig1 = nacl.sign.detached(msg1, keyPair.secretKey);
console.log('1. UTF-8 string:', Buffer.from(sig1).toString('base64'));

// 格式 2: Hex 编码的字符串
const msg2 = Buffer.from(nonce.replace(/-/g, ''), 'hex');
const sig2 = nacl.sign.detached(msg2, keyPair.secretKey);
console.log('2. Hex bytes:', Buffer.from(sig2).toString('base64'));

// 格式 3: 原始字节（去掉连字符）
const msg3 = Buffer.from(nonce.replace(/-/g, ''), 'utf8');
const sig3 = nacl.sign.detached(msg3, keyPair.secretKey);
console.log('3. UTF-8 without dashes:', Buffer.from(sig3).toString('base64'));

// 格式 4: 大写 hex 字符串
const msg4 = Buffer.from(nonce.replace(/-/g, '').toUpperCase(), 'utf8');
const sig4 = nacl.sign.detached(msg4, keyPair.secretKey);
console.log('4. Uppercase hex string:', Buffer.from(sig4).toString('base64'));

// 格式 5: 小写 hex 字符串
const msg5 = Buffer.from(nonce.replace(/-/g, '').toLowerCase(), 'utf8');
const sig5 = nacl.sign.detached(msg5, keyPair.secretKey);
console.log('5. Lowercase hex string:', Buffer.from(sig5).toString('base64'));

console.log('');
console.log('Browser signature: bY7b1EkGkH5bpKahb1czBntrauH964YdLgncwGwqPps9SzhNhWK1yKB9RRLxi+dk0kBslWnM3EIZOS4THjjHCg==');
