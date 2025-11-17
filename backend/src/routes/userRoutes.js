const express = require('express');
const { create } = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.post('/', authenticate, roleGuard(['ADMIN']), create);

module.exports = router;

