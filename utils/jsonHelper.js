// utils/jsonHelper.js
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const cfgDir = path.join(__dirname, '..', 'cfg');
const { logMessage } = require('../services/logService');

/**
 * 讀取 JSON 檔並解析
 * @param {string} filename - 檔名（含 .json）
 * @returns {Promise<any>}
 */
async function loadJSON(filename) {
  const fullPath = path.join(cfgDir, filename);
  try {
    const data = await fsp.readFile(fullPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // 讀檔失敗
    await logMessage(`讀取 ${filename} 錯誤：${err.message}`);
    throw err;
  }
}

/**
 * 將物件寫入 JSON 檔（原子性寫法）
 * @param {string} filename - 檔名（含 .json）
 * @param {any} data - 要寫入的資料
 * @returns {Promise<void>}
 */
async function saveJSON(filename, data) {
  const fullPath = path.join(cfgDir, filename);
  const tempPath = fullPath + '.' + Date.now() + '.tmp';
  try {
    await fsp.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
    await fsp.rename(tempPath, fullPath);
    // 寫檔成功
    await logMessage(`${filename} 已更新。`);
  } catch (err) {
    // 寫檔錯誤
    await logMessage(`寫入 ${filename} 錯誤：${err.message}`);
    throw err;
  }
}

module.exports = { loadJSON, saveJSON };