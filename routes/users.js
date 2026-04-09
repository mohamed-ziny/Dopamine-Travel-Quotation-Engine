const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaffByRole,
  register,
  login
} = require('../controllers/userController');

// Staff routes
router.get('/staff', getAllStaff);
router.get('/staff/:role', getStaffByRole);

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);

module.exports = router;
