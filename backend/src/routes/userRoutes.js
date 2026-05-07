const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, authorizeRoles('Admin', 'Editor'), getUsers)
  .post(protect, authorizeRoles('Admin', 'Editor'), createUser);

router.route('/:id')
  .put(protect, authorizeRoles('Admin', 'Editor'), updateUser);

module.exports = router;
