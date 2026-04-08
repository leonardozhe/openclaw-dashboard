const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAzGcaFELXFhCIhDkBrXO2q024iG+BRdhnHe9XJzJSV/A=
-----END PUBLIC KEY-----`;

const pemBase64 = publicKeyPem
  .replace('-----BEGIN PUBLIC KEY-----', '')
  .replace('-----END PUBLIC KEY-----', '')
  .replace(/\s/g, '');

const pemBytes = Buffer.from(pemBase64, 'base64');
console.log('PEM bytes length:', pemBytes.length);
console.log('PEM bytes (hex):', pemBytes.toString('hex'));

// 提取 32 字节公钥
const rawPublicKey = pemBytes.slice(12);
console.log('Raw public key (hex):', rawPublicKey.toString('hex'));

// 转换为 URL-safe base64
const urlSafeBase64 = rawPublicKey.toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

console.log('URL-safe base64:', urlSafeBase64);
console.log('paired.json publicKey: zGcaFELXFhCIhDkBrXO2q024iG-BRdhnHe9XJzJSV_A');
console.log('Match:', urlSafeBase64 === 'zGcaFELXFhCIhDkBrXO2q024iG-BRdhnHe9XJzJSV_A');
