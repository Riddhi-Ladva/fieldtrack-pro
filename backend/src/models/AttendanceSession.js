const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
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
  punchInTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  punchOutTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Active', 'Completed'],
    default: 'Active'
  },
  mode: {
    type: String,
    enum: ['Geo-Fenced', 'Remote'],
    required: true
  },
  punchInLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  deviceId: {
    type: String,
    required: true
  },
  totalDistance: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // in minutes
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
