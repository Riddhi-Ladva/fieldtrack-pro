const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  trackingInterval: {
    type: Number,
    default: 5, // Default 5 minutes
    min: 5,
    max: 30
  }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
