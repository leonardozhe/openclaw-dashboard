const nacl = require('tweetnacl');

const privateKeyPem = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIGoGF71Fw3B2clWTTucF9IB1YnmcXdlNUpC1DWSUaO17
-----END PRIVATE KEY-----`;

const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAzGcaFELXFhCIhDkBrXO2q024iG+BRdhnHe9XJzJSV/A=
-----END PUBLIC KEY-----`;

const nonce = "de342cec-ff22-4623-8422-d118522a6b57";

// 从 PEM 提取私钥种子（32 字节）
const privateKeyBase64 = privateKeyPem
  .replace('-----BEGIN PRIVATE KEY-----', '')
  .replace('-----END PRIVATE KEY-----', '')
  .replace(/\s/g, '');

const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
console.log('Private key bytes length:', privateKeyBytes.length);

// PKCS8 Ed25519 私钥结构：302e020100300506032b657004220420 + 32 字节种子
const seed = privateKeyBytes.slice(16);
console.log('Seed length:', seed.length);
console.log('Seed (hex):', seed.toString('hex'));

// 从公钥 PEM 提取原始公钥
const publicKeyBase64 = publicKeyPem
  .replace('-----BEGIN PUBLIC KEY-----', '')
  .replace('-----END PUBLIC KEY-----', '')
  .replace(/\s/g, '');

const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64');
const rawPublicKey = publicKeyBytes.slice(12);
console.log('Raw public key (hex):', rawPublicKey.toString('hex'));

// tweetnacl 需要 64 字节的秘密密钥（种子 + 公钥）
// 使用种子生成密钥对
const keyPair = nacl.sign.keyPair.fromSeed(seed);
console.log('Generated public key (hex):', Buffer.from(keyPair.publicKey).toString('hex'));
console.log('Public keys match:', Buffer.from(keyPair.publicKey).toString('hex') === rawPublicKey.toString('hex'));

// 使用 tweetnacl 签名
const message = Buffer.from(nonce, 'utf8');
const signature = nacl.sign.detached(message, keyPair.secretKey);

console.log('\nSignature (base64):', Buffer.from(signature).toString('base64'));
console.log('Signature length:', signature.length);

// 验证签名
const isValid = nacl.sign.detached.verify(message, signature, keyPair.publicKey);
console.log('Verification result:', isValid);
