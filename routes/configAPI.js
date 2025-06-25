// routes/configAPI.js
const express = require('express');
const router = express.Router();
const { loadJSON, saveJSON } = require('../utils/jsonHelper');

['branches', 'emailConfig', 'recipients'].forEach(name => {
  router.put(`/api/${name}`, async (req, res) => {
    try {
      await saveJSON(`${name}.json`, req.body);
      res.json({ message: '更新成功' });
    } catch (err) {
      console.error(`更新 ${name}.json 失敗：`, err);
      res.status(500).json({ message: '更新失敗' });
    }
  });
  
  router.get(`/api/${name}`, async (req, res) => {
    try {
      const data = await loadJSON(`${name}.json`);
      res.json(data);
    } catch (err) {
      console.error(`讀取 ${name}.json 失敗：`, err);
      res.status(500).json({ message: '讀取資料失敗' });
    }
  });
});

module.exports = router;