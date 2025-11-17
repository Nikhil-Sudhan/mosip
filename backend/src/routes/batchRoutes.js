const express = require('express');
const authenticate = require('../middleware/authenticate');
const roleGuard = require('../middleware/roleGuard');
const upload = require('../middleware/upload');
const {
  list,
  show,
  create,
  addDocuments,
  recordInspection,
} = require('../controllers/batchController');

const router = express.Router();

router.use(authenticate);

router.get('/', list);
router.get('/:id', show);
router.post(
  '/',
  roleGuard(['EXPORTER', 'ADMIN']),
  upload.array('documents', 5),
  create
);
router.post(
  '/:id/documents',
  roleGuard(['EXPORTER', 'ADMIN']),
  upload.array('documents', 5),
  addDocuments
);
router.post(
  '/:id/inspection',
  roleGuard(['QA', 'ADMIN']),
  recordInspection
);

module.exports = router;

