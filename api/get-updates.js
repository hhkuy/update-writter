// api/get-updates.js

const axios = require('axios');

module.exports = async (req, res) => {
  // إعداد ترويسات CORS
  res.setHeader('Access-Control-Allow-Origin', '*'); // يفضل تحديد النطاق بدلاً من '*'
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // التعامل مع طلبات OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // التأكد من أن الطريقة هي GET
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // التحقق من مفتاح الـ API
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const repoOwner = 'hhkuy'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه
    const repoName = 'sumsupdate'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه
    const filePath = 'updates.json'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه
    const branch = 'main'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه

    // جلب محتويات الملف من GitHub
    const response = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    // الرد بالمحتويات
    res.status(200).json({ updates: response.data });
  } catch (error) {
    console.error("خطأ أثناء جلب updates.json:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch updates.json' });
  }
};
