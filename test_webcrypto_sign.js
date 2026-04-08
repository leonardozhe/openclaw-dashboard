const nacl = require('tweetnacl');

const privateKeyPem = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIGoGF71Fw3B2clWTTucF9IB1YnmcXdlNUpC1DWSUaO17
-----END PRIVATE KEY-----`;

const nonce = "b42f6e9f-dfe3-44cb-a982-d4f20bd8c10d";

// 从 PEM 提取私钥
const privateKeyBase64 = privateKeyPem
  .replace('-----BEGIN PRIVATE KEY-----', '')
  .replace('-----END PRIVATE KEY-----', '')
  .replace(/\s/g, '');
const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');

console.log('Private key bytes (hex):', privateKeyBytes.toString('hex'));
console.log('Private key length:', privateKeyBytes.length);

// 提取 32 字节种子
const seed = privateKeyBytes.slice(16);
console.log('\nSeed (32 bytes):', seed.toString('hex'));
const keyPair = nacl.sign.keyPair.fromSeed(seed);

console.log('\n=== 测试不同的签名数据格式 ===\n');

// 格式 1: UTF-8 字符串（当前实现）
const msg1 = Buffer.from(nonce, 'utf8');
const sig1 = nacl.sign.detached(msg1, keyPair.secretKey);
console.log('1. UTF-8 string:', Buffer.from(sig1).toString('base64'));

// 格式 2: nonce + sid（如果 sid 存在）
const testSid = "test-session-id-12345";
const msg2 = Buffer.from(nonce + testSid, 'utf8');
const sig2 = nacl.sign.detached(msg2, keyPair.secretKey);
console.log('2. nonce + sid:', Buffer.from(sig2).toString('base64'));

// 格式 3: JSON 字符串化的 nonce
const msg3 = Buffer.from(JSON.stringify(nonce), 'utf8');
const sig3 = nacl.sign.detached(msg3, keyPair.secretKey);
console.log('3. JSON.stringify(nonce):', Buffer.from(sig3).toString('base64'));

// 格式 4: 带引号的 nonce
const msg4 = Buffer.from('"' + nonce + '"', 'utf8');
const sig4 = nacl.sign.detached(msg4, keyPair.secretKey);
console.log('4. Quoted nonce:', Buffer.from(sig4).toString('base64'));

// 格式 5: 原始字节（UUID 去掉连字符后的 hex）
const msg5 = Buffer.from(nonce.replace(/-/g, ''), 'hex');
const sig5 = nacl.sign.detached(msg5, keyPair.secretKey);
console.log('5. Raw UUID bytes (hex decoded):', Buffer.from(sig5).toString('base64'));

// 格式 6: UUID 字符串去掉连字符
const msg6 = Buffer.from(nonce.replace(/-/g, ''), 'utf8');
const sig6 = nacl.sign.detached(msg6, keyPair.secretKey);
console.log('6. UUID without dashes (UTF-8):', Buffer.from(sig6).toString('base64'));

// 格式 7: timestamp + nonce
const timestamp = Date.now();
const msg7 = Buffer.from(timestamp.toString() + nonce, 'utf8');
const sig7 = nacl.sign.detached(msg7, keyPair.secretKey);
console.log('7. timestamp + nonce:', Buffer.from(sig7).toString('base64'));

// 格式 8: nonce + timestamp
const msg8 = Buffer.from(nonce + timestamp.toString(), 'utf8');
const sig8 = nacl.sign.detached(msg8, keyPair.secretKey);
console.log('8. nonce + timestamp:', Buffer.from(sig8).toString('base64'));

console.log('\n=== 浏览器参考签名 ===');
console.log('Browser signature: bY7b1EkGkH5bpKahb1czBntrauH964YdLgncwGwqPps9SzhNhWK1yKB9RRLxi+dk0kBslWnM3EIZOS4THjjHCg==');
console.log('Match format 1 (UTF-8):', Buffer.from(sig1).toString('base64') === 'bY7b1EkGkH5bpKahb1czBntrauH964YdLgncwGwqPps9SzhNhWK1yKB9RRLxi+dk0kBslWnM3EIZOS4THjjHCg==');
