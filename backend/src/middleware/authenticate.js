const { verifyAccessToken } = require('../services/tokenService');
const { findById } = require('../services/userService');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Access token missing' },
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await findById(decoded.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_INACTIVE', message: 'User disabled or missing' },
      });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      organization: user.organization,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: error.message },
    });
  }
}

module.exports = authenticate;

