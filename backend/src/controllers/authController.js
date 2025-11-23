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

  if (!user || !user.isActive) {
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

module.exports = {
  login,
  refresh,
  logout,
  register,
};

