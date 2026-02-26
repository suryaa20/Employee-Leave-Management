const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;

    // Calculate days
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance for non-unpaid leaves
    if (leaveType !== 'unpaid') {
      const user = await User.findById(req.user._id);
      if (user.leaveBalance[leaveType] < days) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance. Available: ${user.leaveBalance[leaveType]} days`
        });
      }
    }

    // Create leave application
    const leave = await Leave.create({
      employeeId: req.user._id,
      employeeName: req.user.name,
      leaveType,
      fromDate,
      toDate,
      numberOfDays: days,
      reason,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave
    });

  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all leaves (Admin/Manager)
// @route   GET /api/leaves
// @access  Private (Admin, Manager)
const getAllLeaves = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.appliedDate = {};
      if (startDate) query.appliedDate.$gte = new Date(startDate);
      if (endDate) query.appliedDate.$lte = new Date(endDate);
    }

    // Hierarchical filtering: Managers see Employees, Admins see Managers
    if (req.user.role === 'manager') {
      const users = await User.find({
        department: req.user.department,
        role: 'employee'
      }).select('_id');
      query.employeeId = { $in: users.map(u => u._id) };
    } else if (req.user.role === 'admin') {
      // Admins see all leaves
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name email department')
      .populate('approvedBy', 'name')
      .sort('-appliedDate')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Leave.countDocuments(query);

    res.json({
      success: true,
      count: leaves.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      leaves
    });

  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get employee's leaves
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.user._id })
      .populate('approvedBy', 'name')
      .sort('-appliedDate');

    res.json({
      success: true,
      count: leaves.length,
      leaves
    });

  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get pending leaves
// @route   GET /api/leaves/pending
// @access  Private (Manager, Admin)
const getPendingLeaves = async (req, res) => {
  try {
    let query = { status: 'pending' };

    // Hierarchical filtering: Managers see pending Employees, Admins see pending Managers
    if (req.user.role === 'manager') {
      const users = await User.find({
        department: req.user.department,
        role: 'employee'
      }).select('_id');
      query.employeeId = { $in: users.map(u => u._id) };
    } else if (req.user.role === 'admin') {
      // Admins see all pending leaves
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name email department')
      .sort('-appliedDate');

    res.json({
      success: true,
      count: leaves.length,
      leaves
    });

  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update leave status
// @route   PUT /api/leaves/:id/status
// @access  Private (Manager, Admin)
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    // Hierarchical Approval Validation
    const applicant = await User.findById(leave.employeeId);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant user not found'
      });
    }

    if (req.user.role === 'manager') {
      if (applicant.role !== 'employee' || applicant.department !== req.user.department) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only approve leaves for employees in their department'
        });
      }
    } else if (req.user.role === 'admin') {
      // Admins can approve leaves for any user
    }

    // Check if already processed
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status}`
      });
    }

    // Update status
    leave.status = status;
    leave.comments = comments || '';
    leave.approvedBy = req.user._id;
    leave.approvedDate = Date.now();

    await leave.save();

    // If approved, update leave balance
    if (status === 'approved' && leave.leaveType !== 'unpaid') {
      const user = await User.findById(leave.employeeId);
      user.leaveBalance[leave.leaveType] -= leave.numberOfDays;
      await user.save();
    }

    res.json({
      success: true,
      message: `Leave ${status} successfully`,
      leave
    });

  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel leave
// @route   PUT /api/leaves/:id/cancel
// @access  Private
const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    // Check if user owns this leave
    if (leave.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this leave'
      });
    }

    // Check if leave can be cancelled
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel leave with status: ${leave.status}`
      });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({
      success: true,
      message: 'Leave cancelled successfully',
      leave
    });

  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get leave statistics
// @route   GET /api/leaves/stats
// @access  Private (Manager, Admin)
const getLeaveStats = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'manager') {
      const users = await User.find({
        department: req.user.department,
        role: 'employee'
      }).select('_id');
      query.employeeId = { $in: users.map(u => u._id) };
    } else if (req.user.role === 'admin') {
      // Admins see all stats
    }

    const leaves = await Leave.find(query);

    const byType = {};
    leaves.forEach(l => {
      byType[l.leaveType] = (byType[l.leaveType] || 0) + 1;
    });

    const approved = leaves.filter(l => l.status === 'approved');
    const totalDays = approved.reduce((sum, l) => sum + (l.numberOfDays || 0), 0);

    const stats = {
      totalRequests: leaves.length,
      pendingCount: leaves.filter(l => l.status === 'pending').length,
      approvedCount: approved.length,
      rejectedCount: leaves.filter(l => l.status === 'rejected').length,
      cancelledCount: leaves.filter(l => l.status === 'cancelled').length,
      totalDays,
      averageDays: approved.length ? Math.round(totalDays / approved.length) : 0,
      byType
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  applyLeave,
  getAllLeaves,
  getMyLeaves,
  getPendingLeaves,
  updateLeaveStatus,
  cancelLeave,
  getLeaveStats
};