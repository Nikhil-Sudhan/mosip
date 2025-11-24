const express = require('express');
const { login, refresh, logout, register, esignetLogin, esignetCallback } = require('../controllers/authController');

const router = express.Router();

// Traditional login (for backward compatibility)
router.post('/login', login);
router.post('/register', register);
router.post('/signup', register);
router.post('/create-account', register);
router.post('/refresh', refresh);
router.post('/logout', logout);

// eSignet OIDC endpoints
router.get('/esignet/login', esignetLogin);
router.get('/esignet/callback', esignetCallback);

module.exports = router;




