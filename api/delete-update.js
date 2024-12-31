// api/delete-update.js
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { index } = req.body;

  if (typeof index !== 'number') {
    res.status(400).json({ error: 'Update index must be a number' });
    return;
  }

  try {
    // Fetch current updates.json from GitHub
    const fileUrl = `https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/${process.env.FILE_PATH}?ref=${process.env.BRANCH}`;
    const fileResponse = await axios.get(fileUrl, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    const content = Buffer.from(fileResponse.data.content, 'base64').toString('utf-8');
    let updates = JSON.parse(content);

    if (index < 0 || index >= updates.length) {
      res.status(400).json({ error: 'Invalid update index' });
      return;
    }

    // Remove the update at the specified index
    updates.splice(index, 1);

    // Commit the updated updates.json back to GitHub
    const newContent = Buffer.from(JSON.stringify(updates, null, 2)).toString('base64');
    await axios.put(`https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/${process.env.FILE_PATH}`, {
      message: 'Delete update via backend',
      content: newContent,
      sha: fileResponse.data.sha,
      branch: process.env.BRANCH,
    }, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in /delete-update:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to delete update' });
  }
};
