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
  upload.fields([
    { name: 'productDocuments', maxCount: 10 },
    { name: 'labReports', maxCount: 10 },
    { name: 'certifications', maxCount: 10 },
    { name: 'complianceDocs', maxCount: 10 },
    { name: 'packagingPhotos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }, // General/backward compatibility
  ]),
  create
);
router.post(
  '/:id/documents',
  roleGuard(['EXPORTER', 'ADMIN']),
  upload.fields([
    { name: 'productDocuments', maxCount: 10 },
    { name: 'labReports', maxCount: 10 },
    { name: 'certifications', maxCount: 10 },
    { name: 'complianceDocs', maxCount: 10 },
    { name: 'packagingPhotos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }, // General/backward compatibility
  ]),
  addDocuments
);
router.post(
  '/:id/inspection',
  roleGuard(['QA', 'ADMIN']),
  recordInspection
);

module.exports = router;

