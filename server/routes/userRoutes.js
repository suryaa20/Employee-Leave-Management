const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  getUserStats,
  exportUsers
} = require('../controller/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validateRegister, handleValidationErrors } = require('../middleware/validation');

// Profile route (accessible by authenticated users)
router.put('/profile', protect, updateProfile);

// Admin only routes - Specific routes first
router.get('/stats', protect, authorize('admin'), getUserStats);
router.get('/export', protect, authorize('admin'), exportUsers);

// Admin only routes - Generic routes
router.route('/')
  .get(protect, authorize('admin', 'manager'), getUsers)
  .post(protect, authorize('admin'), validateRegister, handleValidationErrors, createUser);

router.route('/:id')
  .get(protect, authorize('admin', 'manager'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;