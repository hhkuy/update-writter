// api/upload-image.js
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { image } = req.body;

  if (!image) {
    res.status(400).json({ error: 'Image is required' });
    return;
  }

  try {
    const response = await axios.post('https://api.imghippo.com/v1/upload', {
      api_key: process.env.IMGHIPPO_API_KEY,
      file: image,
    });

    if (response.data.success && response.data.data.url) {
      res.status(200).json({ url: response.data.data.url });
    } else {
      res.status(400).json({ error: 'Failed to upload image' });
    }
  } catch (error) {
    console.error('Error in /upload-image:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Server error' });
  }
};
