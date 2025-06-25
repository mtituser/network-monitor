// encryptPassword.js
const fs = require('fs');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';

// 從環境變數獲取 32 字節的加密金鑰（十六進制格式，例如：64 字元的字符串）
const encryptionKeyHex = process.env.ENCRYPTION_KEY;
if (!encryptionKeyHex) {
  console.error("請設定 ENCRYPTION_KEY 環境變數！");
  process.exit(1);
}
const encryptionKey = Buffer.from(encryptionKeyHex, 'hex');

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex')
  };
}

const passwordToEncrypt = "ituser@mt"; // 將此處替換為你原始的密碼
const encryptedOutput = encrypt(passwordToEncrypt);
fs.writeFileSync('email.pass.json', JSON.stringify(encryptedOutput, null, 2));
console.log("Email 密碼已加密並存入 email.pass.json");