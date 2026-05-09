const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AttendanceSession = require('../models/AttendanceSession');
const LocationLog = require('../models/LocationLog');

// @desc    Get all users in organization
// @route   GET /api/users
// @access  Private/Admin,Editor
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ organizationId: req.user.organizationId })
      .populate('assignedGeoFenceId', 'name')
      .select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new user (Member/Editor)
// @route   POST /api/users
// @access  Private/Admin,Editor
const createUser = async (req, res) => {
  const { name, email, password, role, assignedGeoFenceId } = req.body;

  try {
    // RBAC: Editor cannot create Admin or Editor
    if (req.user.role === 'Editor' && (role === 'Admin' || role === 'Editor')) {
      return res.status(403).json({ message: 'Authorization Restricted: Editors are only permitted to create Member-level accounts. Please contact an Administrator for elevated role assignments.' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Member',
      organizationId: req.user.organizationId,
      assignedGeoFenceId: assignedGeoFenceId || undefined,
    });

    if (user) {
      await AuditLog.create({
        actorId: req.user._id,
        organizationId: req.user.organizationId,
        action: `USER_CREATED`,
        targetEntity: 'User',
        details: { createdUserId: user._id, role: user.role }
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin,Editor
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user && user.organizationId.toString() === req.user.organizationId.toString()) {
      // RBAC: Editor cannot update to Admin or Editor role
      if (req.user.role === 'Editor' && (req.body.role === 'Admin' || req.body.role === 'Editor')) {
        return res.status(403).json({ message: 'Permission Denied: You do not have the authority to assign Admin or Editor roles. This action has been logged for security review.' });
      }

      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;

      // Handle assignedGeoFenceId: empty string from form must become null (not "") to avoid MongoDB CastError
      if (req.body.assignedGeoFenceId !== undefined) {
        user.assignedGeoFenceId = req.body.assignedGeoFenceId === '' ? null : req.body.assignedGeoFenceId;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      await AuditLog.create({
        actorId: req.user._id,
        organizationId: req.user.organizationId,
        action: 'USER_UPDATED',
        targetEntity: 'User',
        details: { updatedUserId: user._id }
      });

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        assignedGeoFenceId: updatedUser.assignedGeoFenceId
      });
    } else {
      res.status(404).json({ message: 'User not found in your organization.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin Only
const deleteUser = async (req, res) => {
  try {
    // Only Admin can delete users
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Permission Denied: Only administrators can delete users.' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ message: 'Cannot delete user from another organization.' });
    }

    // Prevent self-delete
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself. Please contact another administrator.' });
    }

    // Store user info for audit log before deletion
    const deletedUserInfo = {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Cancel all active sessions for this user
    const activeSessions = await AttendanceSession.find({
      userId: user._id,
      status: 'Active'
    });

    for (const session of activeSessions) {
      session.status = 'Completed';
      session.punchOutTime = new Date();
      await session.save();
    }

    // Delete all location logs for this user
    await LocationLog.deleteMany({ userId: user._id });

    // Delete all attendance sessions for this user (or keep for history)
    // Keeping sessions for audit trail, comment out if you want to delete them:
    // await AttendanceSession.deleteMany({ userId: user._id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    // Create audit log for deletion
    await AuditLog.create({
      actorId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'USER_DELETED',
      targetEntity: 'User',
      details: { 
        deletedUser: deletedUserInfo,
        activeSessionsCancelled: activeSessions.length
      }
    });

    res.json({ message: 'User deleted successfully', deletedUser: deletedUserInfo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
