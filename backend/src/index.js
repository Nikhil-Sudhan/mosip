const app = require('./app');
const config = require('./config');
const { seedAdminIfMissing } = require('./services/userService');

async function start() {
  const seedResult = await seedAdminIfMissing();
  if (seedResult?.seeded) {
    // eslint-disable-next-line no-console
    console.log(
      `Seeded default admin user (${seedResult.credentials.email} / ${seedResult.credentials.password}). Please change the password.`
    );
  }

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`AgriQCert API running on port ${config.port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});

