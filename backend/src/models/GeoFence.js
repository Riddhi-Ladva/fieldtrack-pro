const mongoose = require('mongoose');

const geoFenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  radius: {
    type: Number,
    required: true,
    default: 100 // in meters
  }
}, { timestamps: true });

module.exports = mongoose.model('GeoFence', geoFenceSchema);
