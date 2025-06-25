// routes/status.js
const express = require('express');
const router = express.Router();
const ping = require('ping');
const { loadJSON } = require('../utils/jsonHelper');
const { addHistoryEntry } = require('../services/historyService');
const { sendAlertEmail } = require('../services/emailService');
const { logMessage } = require('../services/logService');

let previousStatus = {};
let lastAlertSentTime = 0;  // 初始化上次發送警報的時間為 0
const alertCooldown = 5 * 60 * 1000; // 5 分鐘

router.get('/status', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 22 || currentHour < 7) {
      return res.json({
        status: "暫停監察",
        message: "每日晚上10:00至早上07:00期間暫停監察與警報功能。",
        lastUpdate: now.toLocaleString("zh-HK", { timeZone:"Asia/Hong_Kong" }),
        branches: []
      });
    }

    const branchesData = await loadJSON('branches.json');
    const pingOptions = { timeout: 2, extra: ['-n', '5'] };
    const branchEntries = Object.entries(branchesData);

    const pingPromises = branchEntries.map(async ([branch, ip]) => {
      try {
        const probeResult = await ping.promise.probe(ip, pingOptions);
        return { branch, ip, probeResult };
      } catch (error) {
        console.error(`Ping ${ip} 時出錯：`, error);
        return { branch, ip, probeResult: { alive: false, avg: null, packetLoss: "100%" } };
      }
    });
    const pingResults = await Promise.all(pingPromises);
    const results = [];
    let alerts = [];

    pingResults.forEach(({ branch, ip, probeResult }) => {
      const avg = probeResult.avg ? parseFloat(probeResult.avg).toFixed(1) : "N/A";
      const avgVal = avg !== "N/A" ? parseFloat(avg) : null;
      const lossStr = probeResult.packetLoss
        ? parseFloat(probeResult.packetLoss.replace("%", "")).toFixed(1) + "%"
        : "N/A";
      const lossVal = lossStr !== "N/A" ? parseFloat(lossStr.replace("%", "")) : null;
      let evaluation = "❓ 未知";
      if (avgVal !== null) {
        if (avgVal < 100) evaluation = "🟢 優秀";
        else if (avgVal < 200) evaluation = "🔵 良好";
        else if (avgVal < 300) evaluation = "🟡 普通";
        else if (avgVal < 500) evaluation = "🟠 稍差";
        else evaluation = "🔴 差";
      }
      
      const currentAlive = probeResult.alive;
      if (previousStatus.hasOwnProperty(branch)) {
        if (!previousStatus[branch] && currentAlive) {
          const recoverySubject = `【已恢復】${branch} 已恢復正常`;
          const recoveryMsg = `${branch} 的網絡狀態已恢復，平均延遲：${avg} ms，丟包率：${lossStr}`;
          sendAlertEmail(recoverySubject, recoveryMsg);
          logMessage(`[RECOVERY] ${branch} 已恢復正常`);
        }
      }
      previousStatus[branch] = currentAlive;
      
      let alertLevel = null;
      if (!probeResult.alive) {
        alertLevel = "🔴 高級警報";
        alerts.push(`[${branch}] 🔴 完全斷線 (IP: ${ip})`);
      } else if (avgVal && lossVal && (avgVal > 500 && lossVal > 10)) {
        alertLevel = "🚨 中級警報";
        alerts.push(`[${branch}] 🚨 平均 ${avg} ms, 丟包 ${lossStr} (IP: ${ip})`);
      } else if (avgVal && lossVal && (avgVal > 300 || lossVal > 5)) {
        alertLevel = "⚠️ 低級警報";
      }
      
      results.push({
        branch,
        ip,
        alive: probeResult.alive,
        avg,
        packetLoss: lossStr,
        evaluation,
        alertLevel
      });
    });
    
    if (alerts.length > 0 && (Date.now() - lastAlertSentTime >= alertCooldown)) {
      sendAlertEmail(`【警報】網絡異常`, alerts.join("\n"));
      lastAlertSentTime = Date.now();
    }
    
    const historyEntry = {
      timestamp: now.toISOString(),
      results: results
    };
    await addHistoryEntry(historyEntry);
    
    res.json({
      branches: results,
      lastUpdate: now.toLocaleString("zh-HK", { timeZone:"Asia/Hong_Kong" })
    });
  } catch (err) {
    console.error("Status API error:", err);
    res.status(500).json({ message: "狀態檢查失敗" });
  }
});

module.exports = router;