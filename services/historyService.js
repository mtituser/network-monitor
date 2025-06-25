// services/historyService.js
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

// 設定 cfg 資料夾（若不存在自動建立）
const cfgDir = path.join(__dirname, '..', 'cfg');
if (!fs.existsSync(cfgDir)) {
  fs.mkdirSync(cfgDir, { recursive: true });
}

// 儲存檔案名稱維持為 history.json，但內容為 CSV 格式
const historyFile = path.join(cfgDir, 'history.json');

// 固定 CSV 表頭
const CSV_HEADER = 'timestamp,branch,ip,alive,avg,packetLoss,evaluation,alertLevel';

/**
 * 讀取 CSV 格式的歷史紀錄並解析成物件陣列。
 * ※ 此解析方法較簡單，僅適用於格式固定且資料不含多重逗號或換行的情形。
 */
async function loadHistory() {
  try {
    const data = await fsp.readFile(historyFile, 'utf8');
    if (!data.trim()) return [];
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const header = lines[0].split(',').map(h => h.trim());
    const entries = lines.slice(1).map(line => {
      // 使用正則匹配被雙引號包住或不含分隔符的欄位
      let values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!values) values = line.split(',');
      values = values.map(val => val.replace(/^"|"$/g, '').trim());
      let obj = {};
      header.forEach((col, index) => {
        obj[col] = values[index] || '';
      });
      return obj;
    });
    return entries;
  } catch (err) {
    console.error("loadHistory 錯誤：", err);
    return [];
  }
}

/**
 * 新增一筆歷史紀錄（追加寫入 CSV 格式）
 * 輸入格式：
 * {
 *   timestamp: 'ISO 時間字串',
 *   results: [
 *     { branch, ip, alive, avg, packetLoss, evaluation, alertLevel },
 *     ...
 *   ]
 * }
 */
async function addHistoryEntry(entry) {
  let newRows = [];
  const ts = entry.timestamp;
  if (entry.results && Array.isArray(entry.results)) {
    entry.results.forEach(result => {
      let row = [
        ts,
        result.branch || '',
        result.ip || '',
        result.alive ? 'TRUE' : 'FALSE',
        result.avg || '',
        result.packetLoss || '',
        result.evaluation || '',
        result.alertLevel || ''
      ];
      // 若欄位有特殊字元，則加上雙引號並轉義內部雙引號
      row = row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('\n') || field.includes('"'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });
      newRows.push(row.join(','));
    });
  }
  const fileExists = fs.existsSync(historyFile);
  const contentToAppend = (fileExists ? "\n" : CSV_HEADER + "\n") + newRows.join("\n");
  try {
    await fsp.appendFile(historyFile, contentToAppend, 'utf8');
  } catch (err) {
    console.error("addHistoryEntry 錯誤：", err);
    throw err;
  }
}

/**
 * 覆寫整個歷史紀錄檔案（批次更新用），以 CSV 格式儲存。
 * historyData 為一個陣列，每個元素結構：
 * { timestamp: 'ISO 時間字串', results: [ { branch, ip, alive, avg, packetLoss, evaluation, alertLevel } ] }
 */
async function saveHistory(historyData) {
  let rows = [CSV_HEADER];
  historyData.forEach(entry => {
    const ts = entry.timestamp;
    if (entry.results && Array.isArray(entry.results)) {
      entry.results.forEach(result => {
        let row = [
          ts,
          result.branch || '',
          result.ip || '',
          result.alive ? 'TRUE' : 'FALSE',
          result.avg || '',
          result.packetLoss || '',
          result.evaluation || '',
          result.alertLevel || ''
        ];
        row = row.map(field => {
          if (typeof field === 'string' && (field.includes(',') || field.includes('\n') || field.includes('"'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        });
        rows.push(row.join(','));
      });
    }
  });
  const csvContent = rows.join('\n');
  const tempFilePath = historyFile + '.' + Date.now() + '.tmp';
  try {
    await fsp.writeFile(tempFilePath, csvContent, 'utf8');
    await fsp.rename(tempFilePath, historyFile);
  } catch (err) {
    console.error("saveHistory 錯誤：", err);
    throw err;
  }
}

module.exports = {
  loadHistory,
  addHistoryEntry,
  saveHistory
};