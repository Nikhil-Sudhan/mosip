const jwt = require('jsonwebtoken');
const config = require('../config');

function generateAccessToken(payload) {
  return jwt.sign(payload, config.accessSecret, {
    expiresIn: config.accessTokenTtl,
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, config.refreshSecret, {
    expiresIn: config.refreshTokenTtl,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.refreshSecret);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

