const User = require('../models/User');
const Leave = require('../models/Leave');
const Reimbursement = require('../models/Reimbursement');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  try {
    const {
      role,
      department,
      isActive,
      search,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Filter by active status
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get statistics for each user (leave counts, reimbursement counts)
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const leaveStats = await Leave.aggregate([
        { $match: { employeeId: user._id } },
        {
          $group: {
            _id: null,
            totalLeaves: { $sum: 1 },
            pendingLeaves: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            approvedLeaves: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            rejectedLeaves: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            }
          }
        }
      ]);

      const reimbursementStats = await Reimbursement.aggregate([
        { $match: { employeeId: user._id } },
        {
          $group: {
            _id: null,
            totalReimbursements: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            pendingReimbursements: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        }
      ]);

      const userObj = user.toObject();
      userObj.stats = {
        leaves: leaveStats[0] || {
          totalLeaves: 0,
          pendingLeaves: 0,
          approvedLeaves: 0,
          rejectedLeaves: 0
        },
        reimbursements: reimbursementStats[0] || {
          totalReimbursements: 0,
          totalAmount: 0,
          pendingReimbursements: 0
        }
      };

      return userObj;
    }));

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users: usersWithStats
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's leave history
    const leaves = await Leave.find({ employeeId: user._id })
      .sort('-appliedDate')
      .limit(10);

    // Get user's reimbursement history
    const reimbursements = await Reimbursement.find({ employeeId: user._id })
      .sort('-appliedDate')
      .limit(10);

    // Get statistics
    const leaveStats = await Leave.aggregate([
      { $match: { employeeId: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDays: { $sum: '$numberOfDays' }
        }
      }
    ]);

    const reimbursementStats = await Reimbursement.aggregate([
      { $match: { employeeId: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      user,
      recentActivity: {
        leaves,
        reimbursements
      },
      statistics: {
        leaves: leaveStats,
        reimbursements: reimbursementStats
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      phoneNumber,
      address,
      leaveBalance
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      department: department || 'General',
      phoneNumber: phoneNumber || '',
      address: address || '',
      leaveBalance: leaveBalance || defaultLeaveBalance,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        address: user.address,
        leaveBalance: user.leaveBalance,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      department,
      isActive,
      leaveBalance,
      phoneNumber,
      address
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another user'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = address;

    // Update leave balance if provided
    if (leaveBalance) {
      user.leaveBalance = {
        annual: leaveBalance.annual ?? user.leaveBalance.annual,
        sick: leaveBalance.sick ?? user.leaveBalance.sick,
        casual: leaveBalance.casual ?? user.leaveBalance.casual
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        address: user.address,
        isActive: user.isActive,
        leaveBalance: user.leaveBalance,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user has any pending leaves
    const pendingLeaves = await Leave.findOne({
      employeeId: user._id,
      status: 'pending'
    });

    if (pendingLeaves) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with pending leave applications'
      });
    }

    // Check if user has any pending reimbursements
    const pendingReimbursements = await Reimbursement.findOne({
      employeeId: user._id,
      status: 'pending'
    });

    if (pendingReimbursements) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with pending reimbursement requests'
      });
    }

    // Instead of hard delete, we can soft delete by setting isActive to false
    // Or we can actually delete - here we'll do a soft delete
    user.isActive = false;
    await user.save();

    // Alternative: Hard delete (uncomment if you want permanent deletion)
    // await user.deleteOne();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};

// @desc    Update user profile (self)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      address,
      currentPassword,
      newPassword
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic info
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address) user.address = address;

    // Handle password change if requested
    if (currentPassword && newPassword) {
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        address: user.address,
        leaveBalance: user.leaveBalance,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Get user statistics (for admin dashboard)
// @route   GET /api/users/stats
// @access  Private (Admin only)
const getUserStats = async (req, res) => {
  try {
    // Total users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Total users by department
    const usersByDepartment = await User.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Active vs inactive users
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Users with pending leaves/reimbursements
    const usersWithPendingLeaves = await Leave.distinct('employeeId', { status: 'pending' });
    const usersWithPendingReimbursements = await Reimbursement.distinct('employeeId', { status: 'pending' });

    res.json({
      success: true,
      stats: {
        totalUsers: await User.countDocuments(),
        usersByRole,
        usersByDepartment,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth,
        usersWithPendingLeaves: usersWithPendingLeaves.length,
        usersWithPendingReimbursements: usersWithPendingReimbursements.length
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
};

// @desc    Bulk update users (e.g., department change)
// @route   POST /api/users/bulk-update
// @access  Private (Admin only)
const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updates } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs'
      });
    }

    // Prevent updating self in bulk
    if (userIds.includes(req.user._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update your own account in bulk operation'
      });
    }

    const updateFields = {};
    if (updates.department) updateFields.department = updates.department;
    if (updates.role) updateFields.role = updates.role;
    if (updates.isActive !== undefined) updateFields.isActive = updates.isActive;

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updateFields }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} users successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing bulk update'
    });
  }
};

// @desc    Reset user password (Admin only)
// @route   POST /api/users/:id/reset-password
// @access  Private (Admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow resetting own password through this endpoint
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Use profile update to change your own password'
      });
    }

    // Update password (model will hash it on save)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: `Password reset successfully for ${user.name}`
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password'
    });
  }
};

// @desc    Export users data
// @route   GET /api/users/export
// @access  Private (Admin only)
const exportUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort('-createdAt');

    const exportData = users.map(user => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Department: user.department,
      'Phone Number': user.phoneNumber || 'N/A',
      'Annual Leave Balance': user.leaveBalance.annual,
      'Sick Leave Balance': user.leaveBalance.sick,
      'Casual Leave Balance': user.leaveBalance.casual,
      Status: user.isActive ? 'Active' : 'Inactive',
      'Created At': user.createdAt.toISOString().split('T')[0],
      'Last Login': user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : 'Never'
    }));

    res.json({
      success: true,
      count: exportData.length,
      users: exportData
    });

  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting users'
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  getUserStats,
  bulkUpdateUsers,
  resetUserPassword,
  exportUsers
};