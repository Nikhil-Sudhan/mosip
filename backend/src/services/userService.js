const path = require('path');
const { v4: uuid } = require('uuid');
const { readJSON, writeJSON, ensureJSON } = require('../lib/fileStore');
const { hashPassword } = require('../utils/password');
const config = require('../config');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

async function initStore() {
  await ensureJSON(USERS_FILE, []);
}

async function getUsers() {
  return readJSON(USERS_FILE);
}

async function saveUsers(users) {
  await writeJSON(USERS_FILE, users);
}

async function findByEmail(email) {
  const users = await getUsers();
  return users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
}

async function findById(id) {
  const users = await getUsers();
  return users.find((user) => user.id === id);
}

async function createUser({ email, password, role, organization }) {
  const now = new Date().toISOString();
  const users = await getUsers();
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('User already exists');
  }

  const newUser = {
    id: uuid(),
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role,
    organization: organization || '',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  await saveUsers(users);
  return { ...newUser, passwordHash: undefined };
}

async function seedAdminIfMissing() {
  await initStore();
  const users = await getUsers();
  const adminExists = users.some((user) => user.role === 'ADMIN');

  if (!adminExists) {
    const now = new Date().toISOString();
    const adminUser = {
      id: uuid(),
      email: config.defaultAdminEmail.toLowerCase(),
      passwordHash: await hashPassword(config.defaultAdminPassword),
      role: 'ADMIN',
      organization: 'AgriQCert HQ',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    users.push(adminUser);
    await saveUsers(users);
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

module.exports = {
  initStore,
  getUsers,
  saveUsers,
  findByEmail,
  findById,
  createUser,
  seedAdminIfMissing,
};

