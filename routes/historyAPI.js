// routes/historyAPI.js
const express = require('express');
const router = express.Router();
const { loadHistory } = require('../services/historyService');

// 當前端透過 GET /historyAPI 請求時，回傳解析後的 JSON 陣列
router.get('/historyAPI', async (req, res) => {
  try {
    const history = await loadHistory();
    res.json(history);
  } catch (err) {
    console.error("讀取監控歷史紀錄失敗：", err);
    res.status(500).json({ message: "讀取監控歷史紀錄失敗，請稍後再試。" });
  }
});

module.exports = router;