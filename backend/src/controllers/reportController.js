const AttendanceSession = require('../models/AttendanceSession');
const User = require('../models/User');

// @desc    Get attendance summary for reports
// @route   GET /api/reports/summary
// @access  Private/Admin,Editor
const getAttendanceSummary = async (req, res) => {
  try {
    const { range, startDate: customStart, endDate: customEnd } = req.query;
    let startDate = new Date();
    let endDate = new Date();

    if (customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      // Daily (default)
      startDate.setHours(0, 0, 0, 0);
    }

    const orgId = req.user.organizationId;

    // 1. Counters Aggregation
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalEmployees, presentToday, activeSessions, dailyPunches] = await Promise.all([
      User.countDocuments({ organizationId: orgId, role: 'Member' }),
      AttendanceSession.distinct('userId', { 
        organizationId: orgId, 
        punchInTime: { $gte: todayStart } 
      }),
      AttendanceSession.countDocuments({ 
        organizationId: orgId, 
        status: 'Active' 
      }),
      AttendanceSession.aggregate([
        { $match: { organizationId: orgId, punchInTime: { $gte: todayStart } } },
        { $group: { 
          _id: null, 
          ins: { $sum: 1 }, 
          outs: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } } 
        } }
      ])
    ]);

    // 2. Trend Aggregation (Historical for range)
    const summary = await AttendanceSession.aggregate([
      {
        $match: {
          organizationId: orgId,
          punchInTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$punchInTime" } },
          count: { $sum: 1 },
          totalDistance: { $sum: "$totalDistance" },
          totalDuration: { $sum: "$duration" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      overview: {
        totalEmployees,
        presentToday: presentToday.length,
        absentToday: Math.max(0, totalEmployees - presentToday.length),
        activeSessions,
        totalPunchIns: dailyPunches[0]?.ins || 0,
        totalPunchOuts: dailyPunches[0]?.outs || 0
      },
      trend: summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export attendance as CSV
// @route   GET /api/reports/export
// @access  Private/Admin,Editor
const exportAttendanceCSV = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    let query = { organizationId: req.user.organizationId };

    if (startDate && endDate) {
      query.punchInTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    let sessions = await AttendanceSession.find(query)
      .populate('userId', 'name email')
      .sort('-punchInTime');

    // Filter by name/email if search provided
    if (search) {
      const regex = new RegExp(search, 'i');
      sessions = sessions.filter(s => regex.test(s.userId.name) || regex.test(s.userId.email));
    }

    let csv = 'Employee Name,Email,Attendance Mode,Punch In Time,Punch Out Time,Duration (Min),Status,Date\n';
    sessions.forEach(s => {
      const date = s.punchInTime.toISOString().split('T')[0];
      const pin = s.punchInTime.toLocaleString();
      const pout = s.punchOutTime ? s.punchOutTime.toLocaleString() : '-';
      csv += `"${s.userId.name}","${s.userId.email}","${s.mode}","${pin}","${pout}",${s.duration},"${s.status}","${date}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get raw attendance records for table display
// @route   GET /api/reports/records
// @access  Private/Admin,Editor
const getAttendanceRecords = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { organizationId: req.user.organizationId };

    if (startDate && endDate) {
      query.punchInTime = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    } else {
      // Default: last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.punchInTime = { $gte: thirtyDaysAgo };
    }

    const records = await AttendanceSession.find(query)
      .populate('userId', 'name email role')
      .sort('-punchInTime')
      .limit(500); // Safety cap

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAttendanceSummary, exportAttendanceCSV, getAttendanceRecords };

