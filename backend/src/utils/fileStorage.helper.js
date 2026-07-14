const fs = require('fs');
const path = require('path');

/**
 * Checks if a value is a base64 Data URL (e.g., data:image/png;base64,...) and saves it
 * as a physical file on disk in public/uploads/<subFolder>, returning the static web URL.
 * If the value is already a URL or not a base64 string, returns it untouched.
 *
 * @param {string} val - The input string (e.g. data:image/jpeg;base64,... or https://...)
 * @param {string} subFolder - The subfolder relative to public/uploads (e.g. 'orders/designs')
 * @param {object} req - Express req object to construct base host URL (optional)
 * @returns {Promise<string>} - The web URL to the file, or original val
 */
const saveBase64ToFileIfDataUrl = async (val, subFolder = 'others', req = null) => {
  if (!val || typeof val !== 'string' || !val.startsWith('data:')) {
    return val;
  }

  try {
    const matches = val.match(/^data:([A-Za-z0-9-+.\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return val;
    }

    const mimeType = matches[1].toLowerCase();
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Determine file extension from mimeType
    let ext = '.bin';
    if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
    else if (mimeType.includes('gif')) ext = '.gif';
    else if (mimeType.includes('webp')) ext = '.webp';
    else if (mimeType.includes('pdf')) ext = '.pdf';
    else if (mimeType.includes('word') || mimeType.includes('docx')) ext = '.docx';
    else if (mimeType.includes('excel') || mimeType.includes('xlsx')) ext = '.xlsx';
    else if (mimeType.includes('svg')) ext = '.svg';

    // Path resolution relative to __dirname (backend/src/utils -> backend/public/uploads)
    const uploadDir = path.join(__dirname, '../../public/uploads', subFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `upload-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    let hostUrl = '';
    if (req && req.get && req.get('host')) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.get('host');
      hostUrl = `${protocol}://${host}`;
    } else if (process.env.BACKEND_URL) {
      hostUrl = process.env.BACKEND_URL;
    }

    return `${hostUrl}/uploads/${subFolder}/${filename}`;
  } catch (err) {
    console.error('[fileStorage.helper] Failed to save base64 string to file:', err.message);
    return val; // Fallback to original string if saving fails
  }
};

module.exports = {
  saveBase64ToFileIfDataUrl,
};
