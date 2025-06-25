// utils/decryptHelper.js
const crypto = require('crypto');

function decryptText(encObj, keyHex) {
  if (!keyHex) {
    throw new Error("未提供解密金鑰");
  }
  const algorithm = 'aes-256-cbc';
  const decryptionKey = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(encObj.iv, 'hex');
  const encryptedData = Buffer.from(encObj.encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, decryptionKey, iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { decryptText };