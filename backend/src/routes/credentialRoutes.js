const express = require('express');
const authenticate = require('../middleware/authenticate');
const roleGuard = require('../middleware/roleGuard');
const {
  issue,
  show,
  revoke,
} = require('../controllers/credentialController');

const router = express.Router();

router.use(authenticate);

router.post('/:batchId/issue', roleGuard(['QA', 'ADMIN']), issue);
router.post('/:batchId/revoke', roleGuard(['ADMIN']), revoke);
router.get('/:batchId', show);

module.exports = router;


