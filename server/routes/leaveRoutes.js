const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getAllLeaves,
  getMyLeaves,
  getPendingLeaves,
  updateLeaveStatus,
  cancelLeave
} = require('../controller/leaveController');
const { protect } = require('../middleware/auth');
const { authorize, isManagerOrAdmin } = require('../middleware/roleCheck');
const { validateLeave, handleValidationErrors } = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Employee routes
router.post('/', validateLeave, handleValidationErrors, applyLeave);
router.get('/my-leaves', getMyLeaves);
router.put('/:id/cancel', cancelLeave);

// Manager/Admin routes
router.get('/', authorize('admin', 'manager'), getAllLeaves);
router.get('/pending', authorize('manager', 'admin'), getPendingLeaves);
router.put('/:id/status', isManagerOrAdmin, updateLeaveStatus);

module.exports = router;