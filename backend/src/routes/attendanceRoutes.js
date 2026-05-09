const express = require('express');
const router = express.Router();
const { punchIn, punchOut, getActiveSession, logLocation, getOrgActiveSessions, updateAttendanceRecord, getAttendanceHistory, getLocationHistory } = require('../controllers/attendanceController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.post('/punch-in', protect, punchIn);
router.post('/punch-out', protect, punchOut);
router.get('/active', protect, getActiveSession);
router.get('/history', protect, getAttendanceHistory);
router.post('/location', protect, logLocation);
router.get('/org-active', protect, authorizeRoles('Admin', 'Editor'), getOrgActiveSessions);
router.get('/location-history/:userId', protect, authorizeRoles('Admin', 'Editor'), getLocationHistory);

router.route('/:id')
  .put(protect, authorizeRoles('Admin', 'Editor'), updateAttendanceRecord);

module.exports = router;
