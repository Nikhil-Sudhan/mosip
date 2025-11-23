const crypto = require('crypto');
const path = require('path');
const ms = require('ms');
const { ensureJSON, readJSON, writeJSON } = require('../lib/fileStore');
const config = require('../config');

const SESSIONS_FILE = path.join(__dirname, '..', 'data', 'sessions.json');

async function initStore() {
  await ensureJSON(SESSIONS_FILE, []);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function getSessions() {
  return readJSON(SESSIONS_FILE);
}

async function saveSessions(sessions) {
  await writeJSON(SESSIONS_FILE, sessions);
}

async function storeRefreshToken(userId, token) {
  await initStore();
  const sessions = await getSessions();
  const expiresAt = new Date(Date.now() + ms(config.refreshTokenTtl)).toISOString();
  sessions.push({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  await saveSessions(sessions);
}

async function isRefreshTokenValid(userId, token) {
  await initStore();
  const sessions = await getSessions();
  const now = Date.now();
  return sessions.some(
    (session) =>
      session.userId === userId &&
      session.tokenHash === hashToken(token) &&
      new Date(session.expiresAt).getTime() > now
  );
}

async function revokeRefreshToken(token) {
  await initStore();
  const sessions = await getSessions();
  const filtered = sessions.filter(
    (session) => session.tokenHash !== hashToken(token)
  );
  await saveSessions(filtered);
}

async function revokeAllTokensForUser(userId) {
  await initStore();
  const sessions = await getSessions();
  const filtered = sessions.filter((session) => session.userId !== userId);
  await saveSessions(filtered);
}

module.exports = {
  storeRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
  revokeAllTokensForUser,
};




