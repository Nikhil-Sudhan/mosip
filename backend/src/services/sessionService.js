const crypto = require('crypto');
const ms = require('ms');
const { pool } = require('../db');
const config = require('../config');

/**
 * Session Service - Handles refresh token management with PostgreSQL
 */

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + ms(config.refreshTokenTtl));
  
  await pool.query(`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
  `, [userId, hashToken(token), expiresAt]);
}

async function isRefreshTokenValid(userId, token) {
  const result = await pool.query(`
    SELECT id FROM sessions
    WHERE user_id = $1
      AND token_hash = $2
      AND expires_at > NOW()
    LIMIT 1
  `, [userId, hashToken(token)]);
  
  return result.rows.length > 0;
}

async function revokeRefreshToken(token) {
  await pool.query(`
    DELETE FROM sessions
    WHERE token_hash = $1
  `, [hashToken(token)]);
}

async function revokeAllTokensForUser(userId) {
  await pool.query(`
    DELETE FROM sessions
    WHERE user_id = $1
  `, [userId]);
}

// Clean up expired sessions periodically
async function cleanupExpiredSessions() {
  await pool.query(`
    DELETE FROM sessions
    WHERE expires_at < NOW()
  `);
}

module.exports = {
  storeRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
  revokeAllTokensForUser,
  cleanupExpiredSessions,
};
