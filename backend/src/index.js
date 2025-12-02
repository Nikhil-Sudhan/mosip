const app = require('./app');
const config = require('./config');
const { seedAdminIfMissing } = require('./services/userService');
const { initSchema } = require('./db');
const { cleanupExpiredSessions } = require('./services/sessionService');
const fs = require('fs');
const path = require('path');

async function start() {
  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory');
    }

    // Initialize database schema
    await initSchema();
    console.log('Database schema initialized');

    // Seed admin user if missing
    const seedResult = await seedAdminIfMissing();
    if (seedResult?.seeded) {
      // eslint-disable-next-line no-console
      console.log(
        `Seeded default admin user (${seedResult.credentials.email} / ${seedResult.credentials.password}). Please change the password.`
      );
    }

    // Clean up expired sessions on startup
    await cleanupExpiredSessions();

    app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`AgriQCert API running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});

