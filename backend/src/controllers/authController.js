const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { findByEmail, createUser } = require('../services/userService');
const { comparePassword } = require('../utils/password');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../services/tokenService');
const {
  storeRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
} = require('../services/sessionService');
const esignetService = require('../services/esignetService');
const config = require('../config');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(5),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['IMPORTER', 'EXPORTER']),
  organization: z.string().min(1).optional(),
});

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    organization: user.organization,
  };
}

const login = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const user = await findByEmail(payload.email);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Bad credentials' },
    });
  }

  const passwordMatches = await comparePassword(
    payload.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Bad credentials' },
    });
  }

  const accessToken = generateAccessToken({
    sub: user.id,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    sub: user.id,
    role: user.role,
  });
  await storeRefreshToken(user.id, refreshToken);

  return res.json({
    success: true,
    data: {
      user: formatUser(user),
      accessToken,
      refreshToken,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const payload = refreshSchema.parse(
    req.body.refreshToken
      ? req.body
      : { refreshToken: req.cookies?.refreshToken }
  );

  let decoded;
  try {
    decoded = verifyRefreshToken(payload.refreshToken);
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: error.message },
    });
  }

  const stillValid = await isRefreshTokenValid(decoded.sub, payload.refreshToken);
  if (!stillValid) {
    return res.status(401).json({
      success: false,
      error: { code: 'REFRESH_REVOKED', message: 'Token expired or revoked' },
    });
  }

  await revokeRefreshToken(payload.refreshToken);
  const accessToken = generateAccessToken({
    sub: decoded.sub,
    role: decoded.role,
  });
  const refreshToken = generateRefreshToken({
    sub: decoded.sub,
    role: decoded.role,
  });
  await storeRefreshToken(decoded.sub, refreshToken);

  return res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken || req.cookies?.refreshToken;
  if (token) {
    await revokeRefreshToken(token);
  }
  return res.json({
    success: true,
    data: { message: 'Logged out' },
  });
});

const register = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  
  const existingUser = await findByEmail(payload.email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: { code: 'USER_EXISTS', message: 'User with this email already exists' },
    });
  }

  const newUser = await createUser(payload);
  
  const accessToken = generateAccessToken({
    sub: newUser.id,
    role: newUser.role,
  });
  const refreshToken = generateRefreshToken({
    sub: newUser.id,
    role: newUser.role,
  });
  await storeRefreshToken(newUser.id, refreshToken);

  return res.status(201).json({
    success: true,
    data: {
      user: formatUser(newUser),
      accessToken,
      refreshToken,
    },
  });
});

/**
 * eSignet OIDC Flow - Step 1: Get authorization URL
 * Frontend redirects user to this URL for authentication
 */
const esignetLogin = asyncHandler(async (req, res) => {
  const state = req.query.state || Date.now().toString();
  const authUrl = esignetService.getAuthorizationUrl(state);
  
  return res.json({
    success: true,
    data: {
      authorizationUrl: authUrl,
      state: state,
    },
  });
});

/**
 * eSignet OIDC Flow - Step 2: Handle callback from eSignet
 * eSignet redirects here after user authenticates
 */
const esignetCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_CODE', message: 'Authorization code not provided' },
    });
  }
  
  try {
    // Exchange code for tokens
    const tokens = await esignetService.exchangeCodeForTokens(code);
    
    // Get user info from eSignet
    const userInfo = await esignetService.getUserInfo(tokens.accessToken);
    
    // Verify ID token
    const idTokenPayload = esignetService.verifyIdToken(tokens.idToken);
    
    // Find or create user in our system based on eSignet user info
    // Using email or individual_id from eSignet
    const userEmail = userInfo.email || idTokenPayload.email || userInfo.sub;
    let user = await findByEmail(userEmail);
    
    if (!user) {
      // Create user from eSignet data
      // Map eSignet role to our system roles if needed
      const role = userInfo.role || 'EXPORTER'; // Default role
      user = await createUser({
        email: userEmail,
        password: 'esignet-user-' + Date.now(), // Random password, not used for eSignet users
        role: role,
        organization: userInfo.organization || userInfo.name,
      });
    }
    
    // Generate our own tokens for the session
    const accessToken = generateAccessToken({
      sub: user.id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      sub: user.id,
      role: user.role,
    });
    await storeRefreshToken(user.id, refreshToken);
    
    // Store eSignet tokens in session (optional, for future API calls)
    // In production, store these securely
    
    return res.json({
      success: true,
      data: {
        user: formatUser(user),
        accessToken,
        refreshToken,
        esignetTokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'ESIGNET_AUTH_FAILED', message: error.message },
    });
  }
});

module.exports = {
  login,
  refresh,
  logout,
  register,
  esignetLogin,
  esignetCallback,
};

