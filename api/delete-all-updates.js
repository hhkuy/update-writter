// api/delete-all-updates.js

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

  try {
    const repoOwner = 'hhkuy'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه
    const repoName = 'sumsupdate'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه
    const filePath = 'updates.json'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه
    const branch = 'main'; // تأكد من أنه يتطابق مع المتغير البيئي إذا كنت تستخدمه

    // قراءة محتويات الملف الحالي
    const getResponse = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    let sha = getResponse.headers['x-github-sha'];

    // تعيين مصفوفة التحديثات إلى مصفوفة فارغة
    const updatedContent = [];

    // تحويل المحتوى إلى Base64
    const base64Content = Buffer.from(JSON.stringify(updatedContent, null, 2)).toString('base64');

    // تحديث الملف على GitHub
    const putResponse = await axios.put(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      message: 'Delete all updates',
      content: base64Content,
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
    console.error("خطأ أثناء حذف جميع التحديثات:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Server Error' });
  }
};
