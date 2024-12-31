// api/add-update.js
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { date, time, message, image } = req.body;

  if (!date || !message) {
    res.status(400).json({ error: 'Date and message are required' });
    return;
  }

  try {
    // Fetch current updates.json from the secondary repository
    const fileUrl = `https://api.github.com/repos/${process.env.OWNER_SECONDARY}/${process.env.REPO_SECONDARY}/contents/${process.env.FILE_PATH}?ref=${process.env.BRANCH}`;
    const fileResponse = await axios.get(fileUrl, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    const content = Buffer.from(fileResponse.data.content, 'base64').toString('utf-8');
    let updates = JSON.parse(content);

    // Add the new update
    updates.push({ date, time, message, image });

    // Commit the updated updates.json back to the secondary repository
    const newContent = Buffer.from(JSON.stringify(updates, null, 2)).toString('base64');
    await axios.put(`https://api.github.com/repos/${process.env.OWNER_SECONDARY}/${process.env.REPO_SECONDARY}/contents/${process.env.FILE_PATH}`, {
      message: 'Add new update via backend',
      content: newContent,
      sha: fileResponse.data.sha,
      branch: process.env.BRANCH,
    }, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in /add-update:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to add update' });
  }
};
