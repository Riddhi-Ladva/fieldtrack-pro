const GeoFence = require('../models/GeoFence');
const AuditLog = require('../models/AuditLog');

// @desc    Get all geofences for org
// @route   GET /api/geofences
// @access  Private/Admin
const getGeoFences = async (req, res) => {
  try {
    const geoFences = await GeoFence.find({ organizationId: req.user.organizationId });
    res.json(geoFences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a geofence
// @route   POST /api/geofences
// @access  Private/Admin
const createGeoFence = async (req, res) => {
  const { name, lat, lng, radius } = req.body;

  try {
    const geoFence = await GeoFence.create({
      name,
      location: { lat, lng },
      radius,
      organizationId: req.user.organizationId,
    });

    await AuditLog.create({
      actorId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'GEOFENCE_CREATED',
      targetEntity: 'GeoFence',
      details: { geoFenceId: geoFence._id, name }
    });

    res.status(201).json(geoFence);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a geofence
// @route   DELETE /api/geofences/:id
// @access  Private/Admin
const deleteGeoFence = async (req, res) => {
  try {
    const geoFence = await GeoFence.findById(req.params.id);

    if (geoFence && geoFence.organizationId.toString() === req.user.organizationId.toString()) {
      await GeoFence.deleteOne({ _id: geoFence._id });

      await AuditLog.create({
        actorId: req.user._id,
        organizationId: req.user.organizationId,
        action: 'GEOFENCE_DELETED',
        targetEntity: 'GeoFence',
        details: { geoFenceId: req.params.id }
      });

      res.json({ message: 'GeoFence removed' });
    } else {
      res.status(404).json({ message: 'GeoFence not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a geofence
// @route   PUT /api/geofences/:id
// @access  Private/Admin
const updateGeoFence = async (req, res) => {
  const { name, lat, lng, radius } = req.body;

  try {
    const geoFence = await GeoFence.findById(req.params.id);

    if (geoFence && geoFence.organizationId.toString() === req.user.organizationId.toString()) {
      geoFence.name = name || geoFence.name;
      geoFence.location.lat = lat !== undefined ? Number(lat) : geoFence.location.lat;
      geoFence.location.lng = lng !== undefined ? Number(lng) : geoFence.location.lng;
      geoFence.radius = radius !== undefined ? Number(radius) : geoFence.radius;

      const updatedFence = await geoFence.save();

      await AuditLog.create({
        actorId: req.user._id,
        organizationId: req.user.organizationId,
        action: 'GEOFENCE_UPDATED',
        targetEntity: 'GeoFence',
        details: { geoFenceId: updatedFence._id, name: updatedFence.name }
      });

      res.json(updatedFence);
    } else {
      res.status(404).json({ message: 'The specified Geo-Fence could not be found in your organization.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGeoFences, createGeoFence, deleteGeoFence, updateGeoFence };
