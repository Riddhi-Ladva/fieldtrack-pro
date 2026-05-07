const User = require('../models/User');
const Organization = require('../models/Organization');
const generateToken = require('../utils/generateToken');
const AuditLog = require('../models/AuditLog');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('organizationId');

    if (user && (await user.matchPassword(password))) {
      // Log Audit
      await AuditLog.create({
        actorId: user._id,
        organizationId: user.organizationId,
        action: 'LOGIN',
        targetEntity: 'User',
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        assignedGeoFenceId: user.assignedGeoFenceId,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new organization and admin
// @route   POST /api/auth/register
// @access  Public
const registerOrg = async (req, res) => {
  const { orgName, userName, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Since it's a cyclic dependency (Org needs createdBy, User needs organizationId)
    // We create Org with a dummy createdBy, then update it. Or, create User without org, then update.
    // Better: Generate both ObjectIds beforehand.
    const mongoose = require('mongoose');
    const orgId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const organization = await Organization.create({
      _id: orgId,
      name: orgName,
      createdBy: userId,
    });

    const user = await User.create({
      _id: userId,
      name: userName,
      email,
      password,
      role: 'Admin',
      organizationId: orgId,
    });

    if (user) {
      await AuditLog.create({
        actorId: user._id,
        organizationId: organization._id,
        action: 'ORG_REGISTERED',
        targetEntity: 'Organization',
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        assignedGeoFenceId: user.assignedGeoFenceId,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update organization settings
// @route   PUT /api/auth/org
// @access  Private/Admin
const updateOrg = async (req, res) => {
  const { name, trackingInterval } = req.body;

  try {
    const org = await Organization.findById(req.user.organizationId);

    if (!org) {
      return res.status(404).json({ message: 'Organization profile not found. Please contact support.' });
    }

    org.name = name || org.name;
    org.trackingInterval = trackingInterval !== undefined ? trackingInterval : org.trackingInterval;

    const updatedOrg = await org.save();

    await AuditLog.create({
      actorId: req.user._id,
      organizationId: org._id,
      action: 'ORG_UPDATED',
      targetEntity: 'Organization',
      details: { trackingInterval: updatedOrg.trackingInterval }
    });

    res.json(updatedOrg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get organization settings
// @route   GET /api/auth/org
// @access  Private
const getOrg = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) {
      return res.status(404).json({ message: 'Organization information could not be retrieved.' });
    }
    res.json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { loginUser, registerOrg, updateOrg, getOrg };
