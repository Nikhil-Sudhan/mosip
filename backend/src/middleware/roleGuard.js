function roleGuard(allowedRoles = []) {
  return function guard(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not allowed to do this' },
      });
    }
    next();
  };
}

module.exports = roleGuard;




