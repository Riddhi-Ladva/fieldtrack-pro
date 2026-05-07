const express = require('express');
const router = express.Router();
const { loginUser, registerOrg, updateOrg, getOrg } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.post('/login', loginUser);
router.post('/register', registerOrg);
router.route('/org')
  .get(protect, getOrg)
  .put(protect, authorizeRoles('Admin'), updateOrg);

module.exports = router;
