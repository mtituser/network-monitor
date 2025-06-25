// services/emailService.js
const nodemailer = require('nodemailer');
const { loadJSON, saveJSON } = require('../utils/jsonHelper');
const { decryptText } = require('../utils/decryptHelper');
const { logMessage } = require('./logService');

let transporter = null;

async function initTransporter() {
  // 1. 檢查是否有提供解密金鑰
  if (!process.env.DECRYPTION_KEY) {
    const msg = '未提供解密金鑰 (DECRYPTION_KEY)';
    console.error(msg);
    await logMessage(msg);
    throw new Error(msg);
  }

  // 2. load 設定檔
  const config    = await loadJSON('emailConfig.json');
  const encrypted = await loadJSON('email.pass.json');

  // 3. 嘗試解密
  let password;
  try {
    password = decryptText(encrypted, process.env.DECRYPTION_KEY);
  } catch (err) {
    const msg = `解密密碼失敗：${err.message}`;
    console.error(msg);
    await logMessage(msg);
    throw err;
  }

  // 4. 建立 transporter
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false,
    requireTLS: false,
    auth: {
      user: config.auth.user,
      pass: password
    },
    tls: { rejectUnauthorized: false }
  });

  // 5. 初始化完成也做一筆 log（可選）
  await logMessage('Email 傳送器已初始化');

  return transporter;
}

async function sendAlertEmail(subject, body, overrideRecipients) {
  if (!transporter) {
    await initTransporter();
  }

  await logMessage(`Email 警報，主旨：${subject}`);

  const defaults = await loadJSON('recipients.json');
  const rec = overrideRecipients
    ? { ...defaults, ...overrideRecipients }
    : defaults;

  const config   = await loadJSON('emailConfig.json');
  const fromAddr = config.auth.user;

  const mailOptions = {
    from:    `"網絡監控系統" <${fromAddr}>`,
    to:      Array.isArray(rec.to)  ? rec.to.join(',')  : rec.to,
    subject,
    text:    body,
    ...(rec.cc  && rec.cc.length  && { cc:  rec.cc.join(',')  }),
    ...(rec.bcc && rec.bcc.length && { bcc: rec.bcc.join(',') })
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.messageId);
    return info;
  } catch (err) {
    await logMessage(`Email 警報錯誤：${err.message}`);
    throw err;
  }
}

function getTransporter() {
  return transporter;
}

module.exports = {
  initTransporter,
  sendAlertEmail,
  getTransporter
};