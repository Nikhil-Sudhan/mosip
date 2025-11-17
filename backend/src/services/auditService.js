const path = require('path');
const { ensureJSON, readJSON, writeJSON } = require('../lib/fileStore');

const AUDIT_FILE = path.join(__dirname, '..', 'data', 'auditLogs.json');

async function ensureAuditFile() {
  await ensureJSON(AUDIT_FILE, []);
}

async function getAuditLogs() {
  await ensureAuditFile();
  return readJSON(AUDIT_FILE, []);
}

async function saveAuditLogs(logs) {
  await writeJSON(AUDIT_FILE, logs);
}

async function logAction(action, { userId, role, entityType, entityId, metadata }) {
  const logs = await getAuditLogs();
  logs.push({
    id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    action,
    userId: userId || null,
    role: role || 'SYSTEM',
    entityType: entityType || null,
    entityId: entityId || null,
    metadata: metadata || {},
    createdAt: new Date().toISOString(),
  });
  // keep only latest 200 entries to avoid uncontrolled growth
  const trimmed = logs.slice(-200);
  await saveAuditLogs(trimmed);
  return trimmed[trimmed.length - 1];
}

async function listRecent(limit = 25) {
  const logs = await getAuditLogs();
  return logs.slice(-limit).reverse();
}

module.exports = {
  logAction,
  listRecent,
};

