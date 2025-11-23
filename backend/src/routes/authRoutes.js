const express = require('express');
const { login, refresh, logout, register } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/signup', register);
router.post('/create-account', register);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;




