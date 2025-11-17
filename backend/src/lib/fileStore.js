const fs = require('fs/promises');
const path = require('path');

async function ensureJSON(filePath, defaultData) {
  try {
    await fs.access(filePath);
  } catch (error) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

async function readJSON(filePath, defaultData = []) {
  await ensureJSON(filePath, defaultData);
  const content = await fs.readFile(filePath, 'utf8');
  if (!content.trim().length) {
    return Array.isArray(defaultData) ? [...defaultData] : { ...defaultData };
  }
  return JSON.parse(content);
}

async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  ensureJSON,
  readJSON,
  writeJSON,
};

