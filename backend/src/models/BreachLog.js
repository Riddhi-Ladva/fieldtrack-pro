const mongoose = require('mongoose');

const breachLogSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  geoFenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeoFence',
    required: true,
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  distance: {
    type: Number, // distance in meters from geo-fence center
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
breachLogSchema.index({ sessionId: 1, timestamp: -1 });

module.exports = mongoose.model('BreachLog', breachLogSchema);