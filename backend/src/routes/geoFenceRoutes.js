const express = require('express');
const router = express.Router();
const { getGeoFences, createGeoFence, deleteGeoFence, updateGeoFence } = require('../controllers/geoFenceController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getGeoFences)
  .post(protect, authorizeRoles('Admin'), createGeoFence);

router.route('/:id')
  .put(protect, authorizeRoles('Admin'), updateGeoFence)
  .delete(protect, authorizeRoles('Admin'), deleteGeoFence);

module.exports = router;
