// routes/exportHistory.js
const express = require('express');
const router = express.Router();
const { loadHistory } = require('../services/historyService');

router.get('/exportHistoryCSV', async (req, res) => {
  try {
    const history = await loadHistory();
    if (!Array.isArray(history) || history.length === 0) {
      return res.status(404).send("目前沒有歷史紀錄資料");
    }
    // CSV 表頭（與 historyService.js 格式保持一致）
    const header = ["timestamp", "branch", "ip", "alive", "avg", "packetLoss", "evaluation", "alertLevel"].join(",");
    let rows = [header];

    // 從解析好的 history 陣列產生 CSV 每一行
    history.forEach(entry => {
      let row = [
        entry.timestamp || "",
        entry.branch || "",
        entry.ip || "",
        entry.alive || "",
        entry.avg || "",
        entry.packetLoss || "",
        entry.evaluation || "",
        entry.alertLevel || ""
      ];
      rows.push(row.join(","));
    });
    
    // 加入 UTF-8 BOM，以防 Excel 顯示亂碼
    const bom = "\uFEFF";
    const csvContent = bom + rows.join("\n");
    
    res.setHeader("Content-Disposition", "attachment; filename=history.csv");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send(csvContent);
  } catch (err) {
    console.error("導出歷史紀錄 CSV 失敗：", err);
    res.status(500).send("導出 CSV 失敗");
  }
});

module.exports = router;