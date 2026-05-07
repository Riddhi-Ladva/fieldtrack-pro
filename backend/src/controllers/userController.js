const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

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

module.exports = { getUsers, createUser, updateUser };
