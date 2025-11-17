const express = require('express');
const { verifyById, verifyByUpload, activity } = require('../controllers/verifyController');

const router = express.Router();

router.get('/activity', activity);
router.get('/:credentialId', verifyById);
router.post('/upload', verifyByUpload);

module.exports = router;

