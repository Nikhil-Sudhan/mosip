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
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agriqcert',
    ssl: process.env.DATABASE_SSL === 'true',
  },
  
  // eSignet Configuration
  esignet: {
    baseUrl: process.env.ESIGNET_BASE_URL || 'http://localhost:8080',
    clientId: process.env.ESIGNET_CLIENT_ID || '',
    clientSecret: process.env.ESIGNET_CLIENT_SECRET || '',
    redirectUri: process.env.ESIGNET_REDIRECT_URI || 'http://localhost:4000/api/auth/callback',
    scope: process.env.ESIGNET_SCOPE || 'openid profile email',
  },
  
  // INJI Certify Configuration
  injiCertify: {
    baseUrl: process.env.INJI_CERTIFY_BASE_URL || 'http://localhost:8081',
    apiKey: process.env.INJI_CERTIFY_API_KEY || '',
    issuerDid: process.env.INJI_ISSUER_DID || 'did:example:qa-agency',
  },
  
  // INJI Wallet Configuration
  injiWallet: {
    baseUrl: process.env.INJI_WALLET_BASE_URL || 'http://localhost:8083',
    apiKey: process.env.INJI_WALLET_API_KEY || '',
  },
  
  // INJI Verify Configuration
  injiVerify: {
    baseUrl: process.env.INJI_VERIFY_BASE_URL || 'http://localhost:8082',
    apiKey: process.env.INJI_VERIFY_API_KEY || '',
  },
};

module.exports = config;

