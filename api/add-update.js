// api/add-update.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { date, time, message, image } = req.body;

  if (!date || !message) {
    res.status(400).json({ error: 'Date and message are required' });
    return;
  }

  try {
    // قراءة الملف الحالي من GitHub باستخدام GitHub API
    const repoOwner = process.env.OWNER_SECONDARY;
    const repoName = process.env.REPO_SECONDARY;
    const filePath = process.env.FILE_PATH;
    const branch = process.env.BRANCH;
    const githubToken = process.env.GITHUB_TOKEN;

    // جلب المحتوى الحالي للملف
    const getResponse = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    let updates = [];
    let sha = null;
    if (getResponse.status === 200) {
      updates = getResponse.data;
    }

    // إضافة التحديث الجديد
    updates.push({ date, time, message, image });

    // تحديث الملف على GitHub
    const putResponse = await axios.put(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      message: 'Add a new update',
      content: Buffer.from(JSON.stringify(updates, null, 2)).toString('base64'),
      sha: getResponse.headers['x-github-sha'],
      branch: branch
    }, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (putResponse.status === 201 || putResponse.status === 200) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to update updates.json' });
    }
  } catch (error) {
    console.error("Error in /add-update:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Server error' });
  }
};
