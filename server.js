// server.js
const express = require('express');
const path = require('path');
const { logMessage } = require('./services/logService');  // 新增：引入 logMessage

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體設定
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 掛載路由模組
app.use(require('./routes/status'));
app.use(require('./routes/configAPI'));
app.use(require('./routes/historyAPI'));
app.use(require('./routes/exportHistory'));
app.use(require('./routes/logs'));
app.use(require('./routes/testRecipients'));

// 啟動伺服器並記日誌
app.listen(PORT, async () => {
  console.log(`伺服器已啟動，監聽 port ${PORT}`);
  try {
    await logMessage('伺服器啟動');
  } catch (err) {
    console.error('記錄啟動日誌失敗：', err);
  }
});