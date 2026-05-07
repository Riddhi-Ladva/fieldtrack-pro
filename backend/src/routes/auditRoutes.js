const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/', protect, authorizeRoles('Admin', 'Editor'), getAuditLogs);

module.exports = router;
