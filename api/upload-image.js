// api/upload-image.js

const axios = require('axios');

module.exports = async (req, res) => {
  // إعداد ترويسات CORS
  res.setHeader('Access-Control-Allow-Origin', '*'); // يمكنك تحديد النطاق المسموح بدلاً من '*'
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // التعامل مع طلبات OPTIONS (لـ CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // التأكد من أن الطريقة هي POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // التحقق من مفتاح الـ API المرسل في الترويسات
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // استخراج بيانات الصورة من جسم الطلب
  const { image } = req.body;
  if (!image) {
    res.status(400).json({ error: 'Image is required' });
    return;
  }

  try {
    // رفع الصورة إلى خدمة ImgHippo
    const response = await axios.post('https://api.imghippo.com/v1/upload', {
      api_key: process.env.IMGHIPPO_API_KEY,
      file: image, // يجب أن تكون الصورة مشفرة بـ Base64
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // التحقق من نجاح العملية
    if (response.data.success && response.data.data && response.data.data.url) {
      res.status(200).json({ url: response.data.data.url });
    } else {
      console.error('فشل رفع الصورة:', response.data);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  } catch (error) {
    console.error('خطأ أثناء رفع الصورة:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Server Error' });
  }
};
