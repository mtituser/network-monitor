// routes/logs.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

// 設定 cfg 資料夾路徑，以及 system.log 檔案位於該資料夾中
const cfgDir = path.join(__dirname, '..', 'cfg');
const logFile = path.join(cfgDir, 'system.log');

router.get('/logs', async (req, res) => {
  // 設定不快取內容，確保每次都讀取最新日誌
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  try {
    // 檢查日誌檔案是否存在
    if (fs.existsSync(logFile)) {
      // 讀取完整檔案內容
      const logs = await fsp.readFile(logFile, 'utf8');
      // 設定輸出的 MIME 型別為純文字
      res.type('text/plain').send(logs);
    } else {
      // 當日誌檔案不存在時回應提示訊息
      res.status(404).send("無日誌記錄");
    }
  } catch (err) {
    console.error("讀取日誌失敗：", err);
    res.status(500).json({ message: "讀取日誌失敗" });
  }
});

module.exports = router;