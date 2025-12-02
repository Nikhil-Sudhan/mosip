const express = require('express');
const qaController = require('../controllers/qaController');
const authenticate = require('../middleware/authenticate');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

// All QA routes require authentication and QA role
router.use(authenticate);
router.use(roleGuard(['QA', 'ADMIN']));

// Get pending inspections for logged-in QA agency
router.get('/pending-inspections', qaController.getPendingInspections);

// Schedule inspection for a batch
router.post('/schedule-inspection/:batchId', qaController.scheduleInspection);

// Get QA agency profile
router.get('/profile', qaController.getProfile);

// Update QA agency profile
router.put('/profile', qaController.updateProfile);

module.exports = router;

