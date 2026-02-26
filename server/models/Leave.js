const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'unpaid'],
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  numberOfDays: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    minlength: [10, 'Reason must be at least 10 characters'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: {
    type: Date
  },
  comments: {
    type: String,
    default: '',
    maxlength: [300, 'Comments cannot exceed 300 characters']
  }
}, {
  timestamps: true
});

// Calculate number of days before saving
leaveSchema.pre('save', function (next) {
  if (this.fromDate && this.toDate) {
    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    this.numberOfDays = diffDays;
  }
  next();
});

// Index for better query performance
leaveSchema.index({ employeeId: 1, status: 1 });
leaveSchema.index({ appliedDate: -1 });

module.exports = mongoose.model('Leave', leaveSchema);