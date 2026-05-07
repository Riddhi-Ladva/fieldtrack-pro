const AttendanceSession = require('../models/AttendanceSession');
const LocationLog = require('../models/LocationLog');
const GeoFence = require('../models/GeoFence');
const AuditLog = require('../models/AuditLog');
const haversineDistance = require('../utils/haversine');

// @desc    Punch in
// @route   POST /api/attendance/punch-in
// @access  Private
const punchIn = async (req, res) => {
  const { mode, location, deviceId } = req.body; // mode: 'Geo-Fenced' | 'Remote'

  if (!deviceId) {
    return res.status(400).json({ message: 'Device ID is required for security verification.' });
  }

  try {
    // Check if already punched in
    const existingSession = await AttendanceSession.findOne({
      userId: req.user._id,
      status: 'Active'
    });

    if (existingSession) {
      return res.status(400).json({ message: 'You are already punched in for an active session.' });
    }

    if (req.user.assignedGeoFenceId && mode === 'Remote') {
      return res.status(403).json({ message: 'Remote punch-in restricted. You are assigned to a specific Geo-Fence and must use Geo-Fenced mode at your assigned location.' });
    }

    // Single Device Restriction: Check if this device is already being used for an active session by ANY user
    const deviceInUse = await AttendanceSession.findOne({
      deviceId,
      status: 'Active'
    });

    if (deviceInUse) {
      if (deviceInUse.userId.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You are already punched in on this device.' });
      } else {
        return res.status(403).json({ message: 'This device is currently being used by another member for an active session. Only one user can be punched in from a single device at a time.' });
      }
    }

    if (mode === 'Geo-Fenced') {
      if (!req.user.assignedGeoFenceId) {
        return res.status(403).json({ message: 'Punch in rejected: No Geo-Fence assigned to your account.' });
      }

      const assignedFence = await GeoFence.findById(req.user.assignedGeoFenceId);
      if (!assignedFence) {
        return res.status(404).json({ message: 'Assigned Geo-Fence not found.' });
      }

      const dist = haversineDistance(location, assignedFence.location);
      if (dist > assignedFence.radius) {
        return res.status(403).json({ message: 'Punch in rejected: Outside your assigned Geo-Fenced zone.' });
      }
    }

    const session = await AttendanceSession.create({
      userId: req.user._id,
      organizationId: req.user.organizationId,
      mode,
      punchInLocation: location,
      deviceId
    });

    await AuditLog.create({
      actorId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'PUNCH_IN',
      targetEntity: 'AttendanceSession',
      details: { sessionId: session._id, mode }
    });

    // Notify organization
    if (req.io) {
      req.io.to(req.user.organizationId.toString()).emit('attendance-status-changed', {
        userId: req.user._id,
        status: 'Active',
        mode,
        session
      });
    }

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Punch out
// @route   POST /api/attendance/punch-out
// @access  Private
const punchOut = async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({
      userId: req.user._id,
      status: 'Active'
    });

    if (!session) {
      return res.status(400).json({ message: 'Not currently punched in' });
    }

    // Calculate Metrics
    const logs = await LocationLog.find({ sessionId: session._id }).sort('timestamp');
    let totalDistance = 0;
    if (logs.length > 1) {
      for (let i = 0; i < logs.length - 1; i++) {
        totalDistance += haversineDistance(logs[i].location, logs[i+1].location);
      }
    }

    const durationMs = new Date() - new Date(session.punchInTime);
    const durationMin = Math.round(durationMs / 60000);

    session.status = 'Completed';
    session.punchOutTime = new Date();
    session.totalDistance = totalDistance;
    session.duration = durationMin;
    await session.save();

    await AuditLog.create({
      actorId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'PUNCH_OUT',
      targetEntity: 'AttendanceSession',
      details: { 
        sessionId: session._id,
        totalDistance: `${session.totalDistance.toFixed(2)} km`,
        duration: `${session.duration} mins`
      }
    });

    // Notify organization
    if (req.io) {
      req.io.to(req.user.organizationId.toString()).emit('attendance-status-changed', {
        userId: req.user._id,
        status: 'Completed',
        session
      });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current active session for user
// @route   GET /api/attendance/active
// @access  Private
const getActiveSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({
      userId: req.user._id,
      status: 'Active'
    });
    res.json(session || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log current location (Remote Tracking)
// @route   POST /api/attendance/location
// @access  Private
const logLocation = async (req, res) => {
  const { location } = req.body;
  try {
    const session = await AttendanceSession.findOne({
      userId: req.user._id,
      status: 'Active'
    });

    if (!session) {
      return res.status(400).json({ message: 'Not currently punched in' });
    }

    await LocationLog.create({
      sessionId: session._id,
      userId: req.user._id,
      location,
    });

    res.status(201).json({ message: 'Location logged' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active sessions for organization (Admin View)
// @route   GET /api/attendance/org-active
// @access  Private/Admin,Editor
const getOrgActiveSessions = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find({
      organizationId: req.user.organizationId,
      status: 'Active'
    }).populate('userId', 'name email role');
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Update attendance record (Manual Correction)
// @route   PUT /api/attendance/:id
// @access  Private/Admin,Editor
const updateAttendanceRecord = async (req, res) => {
  const { punchInTime, punchOutTime, mode } = req.body;

  try {
    const session = await AttendanceSession.findById(req.params.id);

    if (session && session.organizationId.toString() === req.user.organizationId.toString()) {
      const oldData = {
        punchInTime: session.punchInTime,
        punchOutTime: session.punchOutTime,
        mode: session.mode
      };

      session.punchInTime = punchInTime || session.punchInTime;
      session.punchOutTime = punchOutTime || session.punchOutTime;
      session.mode = mode || session.mode;

      await session.save();

      await AuditLog.create({
        actorId: req.user._id,
        organizationId: req.user.organizationId,
        action: 'ATTENDANCE_CORRECTION',
        targetEntity: 'AttendanceSession',
        details: { 
          sessionId: session._id,
          oldData,
          newData: { punchInTime, punchOutTime, mode }
        }
      });

      res.json(session);
    } else {
      res.status(404).json({ message: 'Attendance record not found in your organization.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { punchIn, punchOut, getActiveSession, logLocation, getOrgActiveSessions, updateAttendanceRecord };
