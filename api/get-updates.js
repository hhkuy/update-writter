// api/get-updates.js
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const fileUrl = `https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/${process.env.FILE_PATH}?ref=${process.env.BRANCH}`;
    const fileResponse = await axios.get(fileUrl, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    const content = Buffer.from(fileResponse.data.content, 'base64').toString('utf-8');
    const updates = JSON.parse(content);

    res.status(200).json({ updates });
  } catch (error) {
    console.error('Error in /get-updates:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
};
