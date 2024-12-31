// server.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Middleware للتحقق من API Key
const API_KEY = process.env.API_KEY || 'your_secure_api_key';

app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// نقطة نهاية لرفع الصور إلى ImgHippo
app.post('/upload-image', async (req, res) => {
  try {
    const { image } = req.body; // الصورة مُشفرة بـ Base64

    if (!image) {
      return res.status(400).json({ error: 'لم يتم تقديم صورة.' });
    }

    // رفع الصورة إلى ImgHippo
    const response = await axios.post('https://api.imghippo.com/v1/upload', {
      api_key: process.env.IMGHIPPO_API_KEY,
      file: image,
    });

    if (response.data.success && response.data.data.url) {
      res.json({ url: response.data.data.url });
    } else {
      res.status(400).json({ error: 'فشل رفع الصورة.' });
    }
  } catch (error) {
    console.error('خطأ في /upload-image:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'خطأ في الخادم.' });
  }
});

// نقطة نهاية لجلب جميع التحديثات
app.get('/get-updates', async (req, res) => {
  try {
    const fileUrl = `https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/${process.env.FILE_PATH}?ref=${process.env.BRANCH}`;
    const fileResponse = await axios.get(fileUrl, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    const content = Buffer.from(fileResponse.data.content, 'base64').toString('utf-8');
    const updates = JSON.parse(content);

    res.json({ updates });
  } catch (error) {
    console.error('خطأ في /get-updates:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'خطأ في جلب التحديثات.' });
  }
});

// نقطة نهاية لإضافة تحديث جديد إلى GitHub
app.post('/add-update', async (req, res) => {
  try {
    const { date, time, message, image } = req.body;

    if (!date || !message) {
      return res.status(400).json({ error: 'التاريخ والرسالة مطلوبان.' });
    }

    // جلب الملف الحالي من GitHub
    const fileUrl = `https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/${process.env.FILE_PATH}?ref=${process.env.BRANCH}`;
    const fileResponse = await axios.get(fileUrl, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    const content = Buffer.from(fileResponse.data.content, 'base64').toString('utf-8');
    let updates = JSON.parse(content);

    // إضافة التحديث الجديد
    updates.push({ date, time, message, image });

    // رفع الملف مرة أخرى إلى GitHub
    const newContent = Buffer.from(JSON.stringify(updates, null, 2)).toString('base64');
    await axios.put(`https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/${process.env.FILE_PATH}`, {
      message: 'Add new update via backend',
      content: newContent,
      sha: fileResponse.data.sha,
      branch: process.env.BRANCH,
    }, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('خطأ في /add-update:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'خطأ في إضافة التحديث.' });
  }
});

// نقطة نهاية لحذف تحديث محدد
app.post('/delete-update', async (req, res) => {
  try {
    const { index } = req.body;

    if (typeof index !== 'number') {
      return res.status(400).json({ error: 'فهرس التحديث مطلوب ويجب أن يكون رقمًا.' });
    }

    // جلب الملف الحالي من GitHub
    const fileUrl = `https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/${process.env.FILE_PATH}?ref=${process.env.BRANCH}`;
    const fileResponse = await axios.get(fileUrl, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    const content = Buffer.from(fileResponse.data.content, 'base64').toString('utf-8');
    let updates = JSON.parse(content);

    if (index < 0 || index >= updates.length) {
      return res.status(400).json({ error: 'فهرس التحديث غير صالح.' });
    }

    // حذف التحديث
    updates.splice(index, 1);

    // رفع الملف مرة أخرى إلى GitHub
    const newContent = Buffer.from(JSON.stringify(updates, null, 2)).toString('base64');
    await axios.put(`https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/${process.env.FILE_PATH}`, {
      message: 'Delete update via backend',
      content: newContent,
      sha: fileResponse.data.sha,
      branch: process.env.BRANCH,
    }, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('خطأ في /delete-update:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'خطأ في حذف التحديث.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
