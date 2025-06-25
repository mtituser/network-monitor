// services/logService.js
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

// 定義配置資料夾路徑，若不存在自動建立
const cfgDir = path.join(__dirname, '..', 'cfg');
if (!fs.existsSync(cfgDir)) {
  fs.mkdirSync(cfgDir, { recursive: true });
}

// 定義日誌檔案位置與檔案大小閾值（1MB）
const logFile = path.join(cfgDir, 'system.log');
const LOG_SIZE_THRESHOLD = 1 * 1024 * 1024; // 1MB

/**
 * 檢查日誌檔案大小如超過設定閾值就進行輪替，
 * 輪替的檔案會以原檔名加上 ISO 格式的時間戳命名。
 */
async function rotateLogFileIfNeeded() {
  try {
    let stat;
    try {
      stat = await fsp.stat(logFile);
    } catch (e) {
      // 若檔案不存在，直接返回
      return;
    }
    if (stat && stat.size > LOG_SIZE_THRESHOLD) {
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
      const archiveName = `${logFile}.${timestamp}`;
      await fsp.rename(logFile, archiveName);
      console.log(`日誌檔案輪替成功，新檔案：${archiveName}`);
    }
  } catch (err) {
    console.error("Log 文件輪替錯誤：", err);
  }
}

/**
 * 寫入日誌資訊到 system.log 檔案。
 * 寫入前會檢查並執行輪替動作，確保檔案不會過大。
 * 日誌格式為：[時間] - 訊息
 * @param {string} msg 要寫入的日誌訊息
 */
async function logMessage(msg) {
  try {
    await rotateLogFileIfNeeded();
    const currentTime = new Date().toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" });
    const logEntry = `${currentTime} - ${msg}\n`;
    console.log("正在寫入日誌:", logEntry);  // 除錯輸出，可根據需要移除
    await fsp.appendFile(logFile, logEntry, 'utf8');
  } catch (err) {
    console.error("寫入系統日誌失敗：", err);
  }
}

module.exports = { logMessage, rotateLogFileIfNeeded };