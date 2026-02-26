const { body, validationResult } = require('express-validator');

// Validation rules
const validateRegister = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
  body('role')
    .optional()
    .isIn(['employee', 'manager', 'admin']).withMessage('Invalid role'),
  body('department')
    .optional()
    .isString().withMessage('Department must be a string')
];

const validateLogin = [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const validateLeave = [
  body('leaveType')
    .isIn(['sick', 'casual', 'annual', 'unpaid']).withMessage('Invalid leave type'),
  body('fromDate')
    .isISO8601().withMessage('Valid from date is required')
    .custom((value, { req }) => {
      const fromDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (fromDate < today) {
        throw new Error('From date cannot be in the past');
      }
      return true;
    }),
  body('toDate')
    .isISO8601().withMessage('Valid to date is required')
    .custom((value, { req }) => {
      const fromDate = new Date(req.body.fromDate);
      const toDate = new Date(value);
      if (toDate < fromDate) {
        throw new Error('To date cannot be before from date');
      }
      return true;
    }),
  body('reason')
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters')
    .trim()
    .escape()
];

const validateReimbursement = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('category')
    .isIn(['travel', 'food', 'accommodation', 'medical', 'office_supplies', 'training', 'other'])
    .withMessage('Invalid category'),
  body('amount')
    .isFloat({ min: 0.01, max: 100000 }).withMessage('Amount must be between 0.01 and 100,000'),
  body('currency')
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'AED']).withMessage('Invalid currency'),
  body('expenseDate')
    .isISO8601().withMessage('Valid expense date is required')
    .custom((value) => {
      const expenseDate = new Date(value);
      const today = new Date();
      if (expenseDate > today) {
        throw new Error('Expense date cannot be in the future');
      }
      return true;
    })
];

// Check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateLeave,
  validateReimbursement,
  handleValidationErrors
};