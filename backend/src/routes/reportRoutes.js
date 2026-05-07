const express = require('express');
const router = express.Router();
const { getAttendanceSummary, exportAttendanceCSV, getAttendanceRecords } = require('../controllers/reportController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/summary', protect, authorizeRoles('Admin', 'Editor'), getAttendanceSummary);
router.get('/export', protect, authorizeRoles('Admin', 'Editor'), exportAttendanceCSV);
router.get('/records', protect, authorizeRoles('Admin', 'Editor'), getAttendanceRecords);

module.exports = router;

