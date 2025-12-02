const { pool } = require('../db');
const { v4: uuid } = require('uuid');

/**
 * Audit Service - Handles audit logging with PostgreSQL
 */

async function logAction(action, { userId, role, entityType, entityId, metadata }) {
  const result = await pool.query(`
    INSERT INTO audit_logs (action, user_id, role, entity_type, entity_id, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    action,
    userId || null,
    role || 'SYSTEM',
    entityType || null,
    entityId || null,
    metadata || {},
  ]);
  
  return result.rows[0];
}

async function listRecent(limit = 25) {
  const result = await pool.query(`
    SELECT 
      a.*,
      u.email as user_email,
      u.organization as user_organization
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT $1
  `, [limit]);
  
  return result.rows;
}

module.exports = {
  logAction,
  listRecent,
};
