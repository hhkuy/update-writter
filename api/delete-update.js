// api/delete-update.js

const axios = require('axios');

module.exports = async (req, res) => {
  // إعداد ترويسات CORS
  res.setHeader('Access-Control-Allow-Origin', '*'); // يفضل تحديد النطاق بدلاً من '*'
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // التعامل مع طلبات OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // التأكد من أن الطريقة هي POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // التحقق من مفتاح الـ API
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // استخراج فهرس التحديث من جسم الطلب
  const { index } = req.body;
  if (index === undefined || index === null) {
    res.status(400).json({ error: 'Index is required' });
    return;
  }

  try {
    const repoOwner = 'hhkuy'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه
    const repoName = 'sumsupdate'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه
    const filePath = 'updates.json'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه
    const branch = 'main'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه

    // جلب المحتويات الحالية للملف
    const getResponse = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    let updates = [];
    let sha = null;

    if (getResponse.status === 200) {
      updates = getResponse.data;
      sha = getResponse.headers['x-github-sha'];
    }

    // التحقق من صحة الفهرس
    if (index < 0 || index >= updates.length) {
      res.status(400).json({ error: 'Invalid index' });
      return;
    }

    // حذف التحديث المطلوب
    updates.splice(index, 1);

    // تحديث الملف على GitHub
    const putResponse = await axios.put(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      message: 'Delete an update',
      content: Buffer.from(JSON.stringify(updates, null, 2)).toString('base64'),
      sha: sha,
      branch: branch
    }, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (putResponse.status === 200 || putResponse.status === 201) {
      res.status(200).json({ success: true });
    } else {
      console.error("فشل في تحديث updates.json:", putResponse.data);
      res.status(500).json({ error: 'Failed to update updates.json' });
    }
  } catch (error) {
    console.error("خطأ أثناء حذف التحديث:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Server Error' });
  }
};
