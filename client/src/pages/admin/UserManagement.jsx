import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { userAPI } from '../../services/api';
import { USER_ROLES, DEPARTMENTS } from '../../utils/constants';
import {
  FiUsers,
  FiUserPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiAward,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
  FiMoreVertical,
  FiLock,
  FiUnlock,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiX
} from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'

  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    isActive: '',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: 'General',
    phoneNumber: '',
    address: '',
    leaveBalance: {
      annual: 20,
      sick: 12,
      casual: 10
    }
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    employees: 0,
    managers: 0,
    admins: 0,
    byDepartment: [],
    recentActivity: []
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers(filters);
      setUsers(response.data.users || []);
      setPagination({
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        total: response.data.total || 0,
        pages: response.data.pages || 1
      });
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await userAPI.getUserStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
    fetchStatistics();
  };

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchUsers();
    setShowFilters(false);
    toast.success('Filters applied');
  };

  const handleResetFilters = () => {
    setFilters({
      role: '',
      department: '',
      isActive: '',
      search: '',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setTimeout(() => {
      fetchUsers();
    }, 100);
    toast.success('Filters reset');
  };

  const handleSort = (field) => {
    const order = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: order }));
  };

  const handleAddUser = () => {
    setModalMode('add');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
      department: 'General',
      phoneNumber: '',
      address: '',
      leaveBalance: {
        annual: 20,
        sick: 12,
        casual: 10
      }
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      role: user.role || 'employee',
      department: user.department || 'General',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      leaveBalance: user.leaveBalance || {
        annual: 20,
        sick: 12,
        casual: 10
      }
    });
    setShowUserModal(true);
  };

  const handleViewUser = (user) => {
    setModalMode('view');
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await userAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await userAPI.updateUser(userId, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (modalMode === 'add') {
      if (!formData.password) {
        toast.error('Password is required');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    try {
      if (modalMode === 'add') {
        await userAPI.createUser(formData);
        toast.success('User created successfully');
      } else {
        const updateData = { ...formData };
        delete updateData.password;
        delete updateData.confirmPassword;
        await userAPI.updateUser(selectedUser._id, updateData);
        toast.success('User updated successfully');
      }

      setShowUserModal(false);
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await userAPI.exportUsers();
      const users = response.data.users;

      const csvData = users.map(u => ({
        'Name': u.Name,
        'Email': u.Email,
        'Role': u.Role,
        'Department': u.Department,
        'Phone Number': u['Phone Number'],
        'Annual Leave': u['Annual Leave Balance'],
        'Sick Leave': u['Sick Leave Balance'],
        'Casual Leave': u['Casual Leave Balance'],
        'Status': u.Status,
        'Created At': u['Created At'],
        'Last Login': u['Last Login']
      }));

      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      a.click();

      toast.success('Users exported successfully');
    } catch (error) {
      toast.error('Failed to export users');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 dark:border dark:border-red-500/20',
      manager: 'bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400 dark:border dark:border-purple-500/20',
      employee: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 dark:border dark:border-blue-500/20'
    };
    return colors[role] || colors.employee;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <FiShield className="w-4 h-4" />;
      case 'manager': return <FiAward className="w-4 h-4" />;
      default: return <FiUserCheck className="w-4 h-4" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return format(new Date(date), 'dd MMM yyyy');
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm p-6 -mx-6 -mt-6 mb-6 border-b border-gray-100 dark:border-dark-border/30 rounded-t-xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">User Management</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Manage employees, managers, and administrators
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-secondary flex items-center"
          >
            <FiBarChart2 className="mr-2" />
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
          <button
            onClick={handleExportUsers}
            className="btn-secondary flex items-center"
          >
            <FiDownload className="mr-2" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center"
          >
            <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleAddUser}
            className="btn-primary flex items-center"
          >
            <FiUserPlus className="mr-2" />
            Add User
          </button>
        </div>
      </div>

      {showStats && (
        <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border border-gray-100 dark:border-dark-border/50">
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stat-card-blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{stats.totalUsers || 0}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                  <FiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="stat-card-green">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Active Users</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.activeUsers || 0}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                  <FiUserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="stat-card-red">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Inactive Users</p>
                  <p className="text-3xl font-bold text-gray-500 dark:text-slate-500 mt-2">{stats.inactiveUsers || 0}</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
                  <FiUserX className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className="stat-card-purple">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">New This Month</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.newUsersThisMonth || 0}</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                  <FiUserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-dark-border/50">
              <div className="border-l-4 border-blue-500 pl-3">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-500">Employees</p>
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{stats.employees || 0}</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-3">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-500">Managers</p>
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{stats.managers || 0}</p>
              </div>
              <div className="border-l-4 border-red-500 pl-3">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-500">Admins</p>
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{stats.admins || 0}</p>
              </div>
            </div>

            {/* Department Distribution */}
            {stats.byDepartment && stats.byDepartment.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300">By Department</h3>
                <div className="grid grid-cols-2 gap-2">
                  {stats.byDepartment.map((dept) => (
                    <div key={dept._id} className="flex items-center justify-between p-2 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border/50">
                      <span className="text-xs font-medium dark:text-slate-300">{dept._id}</span>
                      <span className="text-xs font-bold bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-400 px-2 py-0.5 rounded-full">
                        {dept.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-dark-card rounded-xl shadow-md border border-gray-100 dark:border-dark-border/50 overflow-hidden">
        <div
          className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-500 dark:text-slate-400" />
            <h2 className="font-semibold text-gray-700 dark:text-slate-200">Filters & Search</h2>
            {Object.values(filters).some(v => v && v !== '' && v !== 1 && v !== 10 && v !== 'createdAt' && v !== 'desc') && (
              <span className="ml-2 px-2.5 py-0.5 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 text-xs font-semibold rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="text-gray-400">
            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
          </div>
        </div>

        {showFilters && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 input-field"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="input-field"
                >
                  <option value="">All Roles</option>
                  {USER_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="input-field"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Status
                </label>
                <select
                  value={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                  className="input-field"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSort('name')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.sortBy === 'name'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                    }`}
                >
                  Name {filters.sortBy === 'name' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('email')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.sortBy === 'email'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                    }`}
                >
                  Email {filters.sortBy === 'email' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('role')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.sortBy === 'role'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                    }`}
                >
                  Role {filters.sortBy === 'role' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('department')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.sortBy === 'department'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                    }`}
                >
                  Department {filters.sortBy === 'department' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('createdAt')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.sortBy === 'createdAt'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                    }`}
                >
                  Join Date {filters.sortBy === 'createdAt' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('lastLogin')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.sortBy === 'lastLogin'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                    }`}
                >
                  Last Login {filters.sortBy === 'lastLogin' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleResetFilters}
                className="btn-secondary"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Showing <span className="font-bold text-gray-900 dark:text-slate-200">{users.length}</span> of{' '}
          <span className="font-bold text-gray-900 dark:text-slate-200">{pagination.total}</span> users
        </p>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-bold text-gray-600 dark:text-slate-400">Show:</label>
          <select
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value), page: 1 })}
            className="input-field text-sm py-1 w-20 font-bold"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-100 dark:border-dark-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border/50">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Role & Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Leave Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-dark-border/30">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors border-b border-gray-100 dark:border-dark-border/20 last:border-0">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`avatar-sm shadow-sm ${getRoleBadge(user.role)}`}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{user.name}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">ID: {user._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center">
                      <FiMail className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 mr-2" />
                      {user.email}
                    </div>
                    {user.phoneNumber && (
                      <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center mt-1">
                        <FiPhone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 mr-2" />
                        {user.phoneNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 inline-flex items-center text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm ${getRoleBadge(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role}</span>
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-500 dark:text-slate-500 mt-1.5 flex items-center">
                      <FiBriefcase className="w-3.5 h-3.5 mr-1" />
                      {user.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 dark:text-slate-100">
                      <span className="text-blue-600 dark:text-blue-400">{user.leaveBalance?.annual || 0}</span> Annual
                    </div>
                    <div className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1">
                      <span className="text-green-600 dark:text-green-500 font-bold">{user.leaveBalance?.sick || 0}</span> Sick •{' '}
                      <span className="text-purple-600 dark:text-purple-400 font-bold">{user.leaveBalance?.casual || 0}</span> Casual
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex items-center text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm ${user.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400 dark:border dark:border-green-500/20'
                      : 'bg-gray-100 text-gray-800 dark:bg-slate-700/50 dark:text-slate-400'
                      }`}>
                      {user.isActive ? (
                        <FiCheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <FiXCircle className="w-3 h-3 mr-1" />
                      )}
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-500 dark:text-slate-500">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="View Details"
                      >
                        <FiEye className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                        title="Edit User"
                      >
                        <FiEdit className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        className={`p-1.5 rounded-lg transition-colors ${user.isActive
                          ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <FiLock className="w-4.5 h-4.5" /> : <FiUnlock className="w-4.5 h-4.5" />}
                      </button>
                      {user._id !== currentUser?._id && (
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete User"
                        >
                          <FiTrash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12 bg-white dark:bg-dark-card/50 rounded-xl border border-dashed border-gray-200 dark:border-dark-border/50">
            <FiUsers className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-700 mb-3" />
            <p className="text-gray-500 dark:text-slate-500">No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-3 mt-6 pb-6">
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={filters.page === 1}
            className="px-4 py-2 text-sm font-bold border border-gray-200 dark:border-dark-border/50 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
          >
            Previous
          </button>
          <div className="px-5 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-gray-100 dark:border-dark-border/30 rounded-xl shadow-inner text-sm font-bold text-gray-800 dark:text-slate-100">
            Page <span className="text-primary-600 dark:text-primary-400">{filters.page}</span> of {pagination.pages}
          </div>
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
            disabled={filters.page === pagination.pages}
            className="px-4 py-2 text-sm font-bold border border-gray-200 dark:border-dark-border/50 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
          >
            Next
          </button>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowUserModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-dark-border/50 transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-dark-border/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {modalMode === 'add' ? 'Add New User' : modalMode === 'edit' ? 'Edit User' : 'User Details'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
              {modalMode === 'view' ? (
                // View Mode
                <div className="space-y-6">
                  <div className="flex items-center space-x-5 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-dark-border/30">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner ${getRoleBadge(selectedUser?.role)}`}>
                      {selectedUser?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-slate-100">{selectedUser?.name}</h4>
                      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{selectedUser?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 bg-white dark:bg-slate-800/20 p-4 rounded-xl border border-gray-100 dark:border-dark-border/30">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Role</p>
                      <p className="font-semibold capitalize text-gray-900 dark:text-slate-200">{selectedUser?.role}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Department</p>
                      <p className="font-semibold text-gray-900 dark:text-slate-200">{selectedUser?.department}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Phone Number</p>
                      <p className="font-semibold text-gray-900 dark:text-slate-200">{selectedUser?.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Address</p>
                      <p className="font-semibold text-gray-900 dark:text-slate-200">{selectedUser?.address || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Status</p>
                      <div>
                        <span className={`px-3 py-1 inline-flex items-center text-xs font-bold rounded-full ${selectedUser?.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400 dark:border dark:border-green-500/20'
                          : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                          {selectedUser?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Member Since</p>
                      <p className="font-semibold text-gray-900 dark:text-slate-200">{formatDate(selectedUser?.createdAt)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-slate-100">Leave Balance</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20 text-center">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Annual</p>
                        <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{selectedUser?.leaveBalance?.annual || 0}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-500/20 text-center">
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">Sick</p>
                        <p className="text-2xl font-black text-green-700 dark:text-green-300">{selectedUser?.leaveBalance?.sick || 0}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20 text-center">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">Casual</p>
                        <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{selectedUser?.leaveBalance?.casual || 0}</p>
                      </div>
                    </div>
                  </div>

                  {selectedUser?.stats && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-slate-100">Activity Summary</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-dark-border/30">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Total Leaves</p>
                          <p className="text-xl font-black text-slate-700 dark:text-slate-200">{selectedUser.stats.leaves?.totalLeaves || 0}</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-500/10">
                          <p className="text-xs font-bold text-yellow-600 dark:text-yellow-500 mb-1">Pending Leaves</p>
                          <p className="text-xl font-black text-yellow-700 dark:text-yellow-400">{selectedUser.stats.leaves?.pendingLeaves || 0}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/10">
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Reimbursements</p>
                          <p className="text-xl font-black text-blue-700 dark:text-blue-200">{selectedUser.stats.reimbursements?.totalReimbursements || 0}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-500/10">
                          <p className="text-xs font-bold text-green-600 dark:text-green-500 mb-1">Total Amount</p>
                          <p className="text-xl font-black text-green-700 dark:text-green-300">
                            ${selectedUser.stats.reimbursements?.totalAmount?.toFixed(2) || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3 border-t border-gray-100 dark:border-dark-border/50 pt-4">
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setModalMode('edit');
                        handleEditUser(selectedUser);
                      }}
                      className="btn-primary"
                    >
                      Edit User
                    </button>
                  </div>
                </div>
              ) : (
                // Add/Edit Form
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="input-field"
                        required
                      >
                        {USER_ROLES.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-500 mt-1 font-medium italic">
                        {formData.role === 'admin' ? 'Total control: Manage users, departments, and all system settings.' :
                          formData.role === 'manager' ? 'Team leader: Approve/reject leaves for their department and view team reports.' :
                            'Individual contributor: Access dashboard and submit leave/reimbursement requests.'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
                        Password {modalMode === 'add' ? <span className="text-red-500">*</span> : <span className="text-gray-400 text-xs font-normal">(Leave blank to keep current)</span>}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-field"
                        placeholder="••••••••"
                        required={modalMode === 'add'}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
                        Confirm Password {modalMode === 'add' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="input-field"
                        placeholder="••••••••"
                        required={modalMode === 'add' && formData.password !== ''}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
                      Office Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input-field min-h-[80px]"
                    />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-100 dark:border-dark-border/30">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-slate-100 mb-4">Initial Leave Balances</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400">
                          Annual Leave
                        </label>
                        <input
                          type="number"
                          value={formData.leaveBalance.annual}
                          onChange={(e) => setFormData({
                            ...formData,
                            leaveBalance: { ...formData.leaveBalance, annual: parseInt(e.target.value) }
                          })}
                          className="input-field text-center font-bold"
                          min="0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400">
                          Sick Leave
                        </label>
                        <input
                          type="number"
                          value={formData.leaveBalance.sick}
                          onChange={(e) => setFormData({
                            ...formData,
                            leaveBalance: { ...formData.leaveBalance, sick: parseInt(e.target.value) }
                          })}
                          className="input-field text-center font-bold"
                          min="0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400">
                          Casual Leave
                        </label>
                        <input
                          type="number"
                          value={formData.leaveBalance.casual}
                          onChange={(e) => setFormData({
                            ...formData,
                            leaveBalance: { ...formData.leaveBalance, casual: parseInt(e.target.value) }
                          })}
                          className="input-field text-center font-bold"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 bg-gray-50 dark:bg-slate-800/20 -mx-6 -mb-6 px-6 py-4 border-t border-gray-100 dark:border-dark-border/50">
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      {modalMode === 'add' ? 'Create Account' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;