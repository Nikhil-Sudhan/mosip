const { pool } = require('../db');
const { v4: uuid } = require('uuid');
const { hashPassword } = require('../utils/password');
const config = require('../config');

/**
 * User Service - Handles user management with PostgreSQL
 */

async function findByEmail(email) {
  const result = await pool.query(
    'SELECT id, email, password_hash, role, organization, created_at, updated_at FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  const user = result.rows[0];
  if (user) {
    // Map password_hash to passwordHash for consistency
    user.passwordHash = user.password_hash;
    delete user.password_hash;
  }
  return user || null;
}

async function findById(id) {
  const result = await pool.query(
    'SELECT id, email, password_hash, role, organization, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function createUser({ email, password, role, organization }) {
  const passwordHash = await hashPassword(password);
  
  const result = await pool.query(`
    INSERT INTO users (email, password_hash, role, organization)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, role, organization, created_at, updated_at
  `, [email.toLowerCase(), passwordHash, role, organization || '']);
  
  return result.rows[0];
}

async function seedAdminIfMissing() {
  const result = await pool.query(
    'SELECT id FROM users WHERE role = $1',
    ['ADMIN']
  );

  if (result.rows.length === 0) {
    const passwordHash = await hashPassword(config.defaultAdminPassword);
    const adminResult = await pool.query(`
      INSERT INTO users (email, password_hash, role, organization)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role, organization
    `, [
      config.defaultAdminEmail.toLowerCase(),
      passwordHash,
      'ADMIN',
      'AgriQCert HQ',
    ]);
    
    return {
      seeded: true,
      credentials: {
        email: config.defaultAdminEmail,
        password: config.defaultAdminPassword,
      },
    };
  }

  return { seeded: false };
}

async function getUserById(id) {
  return findById(id);
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  seedAdminIfMissing,
  getUserById,
};
