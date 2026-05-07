const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs for org
// @route   GET /api/audit
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    const query = { organizationId: req.user.organizationId };
    
    // RBAC: Editors can only see their own logs
    if (req.user.role === 'Editor') {
      query.actorId = req.user._id;
    }

    const logs = await AuditLog.find(query)
      .populate('actorId', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAuditLogs };
