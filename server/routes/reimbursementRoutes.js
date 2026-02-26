const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validateReimbursement, handleValidationErrors } = require('../middleware/validation');
const {
  submitReimbursement,
  getAllReimbursements,
  getMyReimbursements,
  getPendingReimbursements,
  getReimbursement,
  updateReimbursementStatus,
  markAsPaid,
  updateReimbursement,
  deleteReimbursement,
  getReimbursementStats
} = require('../controller/reimbursementController');

const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Employee routes
router.post('/', upload.single('receipt'), validateReimbursement, handleValidationErrors, submitReimbursement);
router.get('/my-reimbursements', getMyReimbursements);
router.put('/:id', upload.single('receipt'), updateReimbursement);
router.delete('/:id', deleteReimbursement);

// Manager/Admin routes
router.get('/pending', authorize('manager', 'admin'), getPendingReimbursements);
router.get('/stats', authorize('manager', 'admin'), getReimbursementStats);
router.put('/:id/status', authorize('manager', 'admin'), updateReimbursementStatus);

// Admin only routes
router.get('/', authorize('admin', 'manager'), getAllReimbursements);
router.get('/:id', getReimbursement);
router.put('/:id/pay', authorize('admin'), markAsPaid);

module.exports = router;