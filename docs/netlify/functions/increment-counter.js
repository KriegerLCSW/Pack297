const fetch = require('node-fetch');

const OWNER = 'kriegerlcsw';
const REPO = 'pack297';
const FILE_PATH = 'count.txt';
const BRANCH = 'main'; // or your default branch

exports.handler = async (event, context) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { statusCode: 500, body: 'Missing GitHub token' };
  }

  const fileUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;

  const headers = {
    Authorization: `token ${token}`,
    'User-Agent': 'netlify-function'
  };

  try {
    // Get current count and sha
    const fileRes = await fetch(fileUrl, { headers });
    if (!fileRes.ok) {
      return { statusCode: fileRes.status, body: `Failed to get file: ${await fileRes.text()}` };
    }
    const fileData = await fileRes.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    let count = parseInt(content.trim());
    if (isNaN(count)) count = 0;
    count++;

    // Update file content
    const updatedContent = Buffer.from(String(count)).toString('base64');

    // Commit updated count
    const updateRes = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'netlify-function',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Increment visitor count to ${count}`,
        content: updatedContent,
        sha: fileData.sha,
        branch: BRANCH
      })
    });

    if (!updateRes.ok) {
      return { statusCode: updateRes.status, body: `Failed to update file: ${await updateRes.text()}` };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ count })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error: ${error.message}`
    };
  }
};
