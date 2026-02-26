const Reimbursement = require('../models/Reimbursement');
const User = require('../models/User');

// @desc    Submit reimbursement request
// @route   POST /api/reimbursements
// @access  Private
const submitReimbursement = async (req, res) => {
  try {
    const { title, description, category, amount, currency, expenseDate } = req.body;

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Create reimbursement request
    const reimbursement = await Reimbursement.create({
      employeeId: req.user._id,
      employeeName: req.user.name,
      title,
      description,
      category,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      expenseDate: new Date(expenseDate),
      status: 'pending',
      receipt: req.file ? `/uploads/reimbursements/${req.file.filename}` : undefined,
      receiptOriginalName: req.file ? req.file.originalname : undefined,
      appliedDate: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Reimbursement request submitted successfully',
      reimbursement
    });

  } catch (error) {
    console.error('Submit reimbursement error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all reimbursements (Admin/Manager)
// @route   GET /api/reimbursements
// @access  Private (Admin, Manager)
const getAllReimbursements = async (req, res) => {
  try {
    const {
      status,
      category,
      startDate,
      endDate,
      employeeId,
      search,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by employee
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    // Hierarchical filtering: Managers see Employees, Admins see Managers
    if (req.user.role === 'manager') {
      const users = await User.find({
        department: req.user.department,
        role: 'employee'
      }).select('_id');
      query.employeeId = { $in: users.map(u => u._id) };
    } else if (req.user.role === 'admin') {
      // Admins see all reimbursements
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reimbursements = await Reimbursement.find(query)
      .populate('employeeId', 'name email department')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .sort('-appliedDate')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reimbursement.countDocuments(query);

    res.json({
      success: true,
      count: reimbursements.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reimbursements
    });

  } catch (error) {
    console.error('Get all reimbursements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get employee's reimbursements
// @route   GET /api/reimbursements/my-reimbursements
// @access  Private
const getMyReimbursements = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let query = { employeeId: req.user._id };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reimbursements = await Reimbursement.find(query)
      .sort('-appliedDate')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reimbursement.countDocuments(query);

    // Calculate total amount
    const totalAmount = await Reimbursement.aggregate([
      { $match: { employeeId: req.user._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      count: reimbursements.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      totalAmount: totalAmount[0]?.total || 0,
      reimbursements
    });

  } catch (error) {
    console.error('Get my reimbursements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get pending reimbursements
// @route   GET /api/reimbursements/pending
// @access  Private (Manager, Admin)
const getPendingReimbursements = async (req, res) => {
  try {
    let query = { status: 'pending' };

    // Hierarchical filtering: Managers see Employees, Admins see Managers
    if (req.user.role === 'manager') {
      const users = await User.find({
        department: req.user.department,
        role: 'employee'
      }).select('_id');
      query.employeeId = { $in: users.map(u => u._id) };
    } else if (req.user.role === 'admin') {
      // Admins see all pending reimbursements
    }

    const reimbursements = await Reimbursement.find(query)
      .populate('employeeId', 'name email department')
      .sort('-appliedDate');

    // Calculate total pending amount
    const totalPendingAmount = reimbursements.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      success: true,
      count: reimbursements.length,
      totalPendingAmount,
      reimbursements
    });

  } catch (error) {
    console.error('Get pending reimbursements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single reimbursement
// @route   GET /api/reimbursements/:id
// @access  Private
const getReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id)
      .populate('employeeId', 'name email department')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name');

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found'
      });
    }

    // Check if user has access
    if (req.user.role === 'employee' &&
      reimbursement.employeeId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this reimbursement'
      });
    }

    res.json({
      success: true,
      reimbursement
    });

  } catch (error) {
    console.error('Get reimbursement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update reimbursement status (Approve/Reject)
// @route   PUT /api/reimbursements/:id/status
// @access  Private (Manager, Admin)
const updateReimbursementStatus = async (req, res) => {
  try {
    const { status, comments, rejectionReason } = req.body;
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found'
      });
    }

    // Check if already processed
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Reimbursement already ${reimbursement.status}`
      });
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Update status
    reimbursement.status = status;

    if (status === 'approved') {
      reimbursement.approvedBy = req.user._id;
      reimbursement.approvedDate = Date.now();
      reimbursement.comments = comments || '';
    } else if (status === 'rejected') {
      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      reimbursement.rejectionReason = rejectionReason;
      reimbursement.comments = comments || '';
    }

    await reimbursement.save();

    res.json({
      success: true,
      message: `Reimbursement ${status} successfully`,
      reimbursement
    });

  } catch (error) {
    console.error('Update reimbursement status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark as paid
// @route   PUT /api/reimbursements/:id/pay
// @access  Private (Admin only)
const markAsPaid = async (req, res) => {
  try {
    const { paymentMethod, transactionId, comments } = req.body;
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found'
      });
    }

    // Can only pay approved reimbursements
    if (reimbursement.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved reimbursements can be marked as paid'
      });
    }

    reimbursement.status = 'paid';
    reimbursement.paidBy = req.user._id;
    reimbursement.paidDate = Date.now();
    reimbursement.paymentMethod = paymentMethod;
    if (transactionId) reimbursement.transactionId = transactionId;
    reimbursement.comments = comments || reimbursement.comments;

    await reimbursement.save();

    res.json({
      success: true,
      message: 'Reimbursement marked as paid successfully',
      reimbursement
    });

  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update reimbursement
// @route   PUT /api/reimbursements/:id
// @access  Private (Employee only - for pending requests)
const updateReimbursement = async (req, res) => {
  try {
    const { title, description, category, amount, currency, expenseDate } = req.body;
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found'
      });
    }

    // Check if user owns this reimbursement
    if (reimbursement.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reimbursement'
      });
    }

    // Can only update pending requests
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update reimbursement with status: ${reimbursement.status}`
      });
    }

    // Update fields
    if (title) reimbursement.title = title;
    if (description) reimbursement.description = description;
    if (category) reimbursement.category = category;
    if (amount) reimbursement.amount = parseFloat(amount);
    if (currency) reimbursement.currency = currency;
    if (expenseDate) reimbursement.expenseDate = new Date(expenseDate);

    // Update receipt if new file is uploaded
    if (req.file) {
      reimbursement.receipt = `/uploads/reimbursements/${req.file.filename}`;
      reimbursement.receiptOriginalName = req.file.originalname;
    }

    await reimbursement.save();

    res.json({
      success: true,
      message: 'Reimbursement updated successfully',
      reimbursement
    });

  } catch (error) {
    console.error('Update reimbursement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete reimbursement
// @route   DELETE /api/reimbursements/:id
// @access  Private (Employee only - for pending requests)
const deleteReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found'
      });
    }

    // Check if user owns this reimbursement
    if (reimbursement.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reimbursement'
      });
    }

    // Can only delete pending requests
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete reimbursement with status: ${reimbursement.status}`
      });
    }

    await reimbursement.deleteOne();

    res.json({
      success: true,
      message: 'Reimbursement deleted successfully'
    });

  } catch (error) {
    console.error('Delete reimbursement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get reimbursement statistics
// @route   GET /api/reimbursements/stats
// @access  Private (Admin, Manager)
const getReimbursementStats = async (req, res) => {
  try {
    let matchStage = {};

    // If manager, only their department
    if (req.user.role === 'manager') {
      const users = await User.find({ department: req.user.department }).select('_id');
      matchStage.employeeId = { $in: users.map(u => u._id) };
    }

    const stats = await Reimbursement.aggregate([
      { $match: matchStage },
      {
        $facet: {
          statusBreakdown: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          categoryBreakdown: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          monthlyTrend: [
            {
              $group: {
                _id: {
                  year: { $year: '$appliedDate' },
                  month: { $month: '$appliedDate' }
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                avgAmount: { $avg: '$amount' },
                pendingAmount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
                  }
                },
                approvedAmount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
                  }
                },
                paidAmount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0]
    });

  } catch (error) {
    console.error('Get reimbursement stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
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
};