const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: Number(process.env.PORT) || 4000,
  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@agriqcert.test',
  defaultAdminPassword:
    process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:4000',
  verifyPortalUrl:
    process.env.VERIFY_PORTAL_URL || 'http://localhost:5173/verify',
};

module.exports = config;

