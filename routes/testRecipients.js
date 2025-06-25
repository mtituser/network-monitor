// routes/testRecipients.js
const express = require('express');
const router = express.Router();
const { initTransporter, sendAlertEmail } = require('../services/emailService');

router.post('/api/testRecipients', async (req, res) => {
  try {
    // 確保 transporter 已初始化
    await initTransporter();

    // 呼叫 emailService
    await sendAlertEmail(
      '【測試】Recipients 測試郵件',
      '這是一封來自網絡監控系統的測試郵件。',
      {
        to:  Array.isArray(req.body.to)  ? req.body.to  : [req.body.to],
        // 不帶 cc/bcc 就走預設 recipients.json
        // 如果 body 有 cc/bcc，也可擴充這裡：
        cc:  Array.isArray(req.body.cc)  ? req.body.cc  : (req.body.cc  ? [req.body.cc]  : []),
        bcc: Array.isArray(req.body.bcc) ? req.body.bcc : (req.body.bcc ? [req.body.bcc] : [])
      }
    );

    res.json({ message: "測試郵件已傳送" });
  } catch (err) {
    console.error("傳送測試郵件失敗：", err);
    res.status(500).json({ message: "測試郵件傳送失敗" });
  }
});

module.exports = router;