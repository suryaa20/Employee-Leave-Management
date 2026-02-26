const mongoose = require('mongoose');

const reimbursementSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['travel', 'food', 'accommodation', 'medical', 'office_supplies', 'training', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [100000, 'Amount cannot exceed 100,000']
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'INR', 'AED'],
    default: 'USD'
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required'],
    validate: {
      validator: function (value) {
        return value <= new Date();
      },
      message: 'Expense date cannot be in the future'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'check', 'other'],
  },
  transactionId: {
    type: String,
    trim: true
  },
  comments: {
    type: String,
    maxlength: [300, 'Comments cannot exceed 300 characters']
  },
  rejectionReason: {
    type: String,
    maxlength: [300, 'Rejection reason cannot exceed 300 characters']
  },
  receipt: {
    type: String
  },
  receiptOriginalName: {
    type: String
  },
  appliedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update timestamp on save
reimbursementSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
reimbursementSchema.index({ employeeId: 1, status: 1 });
reimbursementSchema.index({ appliedDate: -1 });
reimbursementSchema.index({ category: 1 });

module.exports = mongoose.model('Reimbursement', reimbursementSchema);