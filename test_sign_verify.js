const nacl = require('tweetnacl');

const privateKeyPem = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIGoGF71Fw3B2clWTTucF9IB1YnmcXdlNUpC1DWSUaO17
-----END PRIVATE KEY-----`;

const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAzGcaFELXFhCIhDkBrXO2q024iG+BRdhnHe9XJzJSV/A=
-----END PUBLIC KEY-----`;

// 使用浏览器日志中的 nonce
const nonce = "b42f6e9f-dfe3-44cb-a982-d4f20bd8c10d";

// 从 PEM 提取私钥种子
const privateKeyBase64 = privateKeyPem
  .replace('-----BEGIN PRIVATE KEY-----', '')
  .replace('-----END PRIVATE KEY-----', '')
  .replace(/\s/g, '');
const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
const seed = privateKeyBytes.slice(16);

// 从公钥 PEM 提取原始公钥
const publicKeyBase64 = publicKeyPem
  .replace('-----BEGIN PUBLIC KEY-----', '')
  .replace('-----END PUBLIC KEY-----', '')
  .replace(/\s/g, '');
const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64');
const rawPublicKey = publicKeyBytes.slice(12);

// 生成密钥对
const keyPair = nacl.sign.keyPair.fromSeed(seed);

// 验证公钥匹配
console.log('Public keys match:', Buffer.from(keyPair.publicKey).toString('hex') === rawPublicKey.toString('hex'));

// 使用 tweetnacl 签名 nonce
const message = Buffer.from(nonce, 'utf8');
const signature = nacl.sign.detached(message, keyPair.secretKey);
const signatureBase64 = Buffer.from(signature).toString('base64');

console.log('Nonce:', nonce);
console.log('Generated signature:', signatureBase64);
console.log('Browser signature:  bY7b1EkGkH5bpKahb1czBntrauH964YdLgncwGwqPps9SzhNhWK1yKB9RRLxi+dk0kBslWnM3EIZOS4THjjHCg==');
console.log('Signatures match:', signatureBase64 === 'bY7b1EkGkH5bpKahb1czBntrauH964YdLgncwGwqPps9SzhNhWK1yKB9RRLxi+dk0kBslWnM3EIZOS4THjjHCg==');

// 验证签名
const isValid = nacl.sign.detached.verify(message, signature, keyPair.publicKey);
console.log('Signature verification:', isValid);
