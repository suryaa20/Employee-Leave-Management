import React, { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../../context/authContext';
import { leaveAPI } from '../../services/api';
import { LEAVE_TYPES, LEAVE_STATUS } from '../../utils/constants';
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiDownload,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiBarChart2,
  FiTrendingUp,
  FiAlertCircle
} from 'react-icons/fi';
import { format, differenceInDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const LeaveHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'appliedDate',
    sortOrder: 'desc'
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalLeaves: 0,
    totalDays: 0,
    approvedLeaves: 0,
    approvedDays: 0,
    pendingLeaves: 0,
    pendingDays: 0,
    rejectedLeaves: 0,
    rejectedDays: 0,
    cancelledLeaves: 0,
    byType: {},
    monthlyTrend: []
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Date range presets
  const datePresets = [
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last 3 Months', value: 'last3Months' },
    { label: 'Last 6 Months', value: 'last6Months' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'All Time', value: 'all' }
  ];

  useEffect(() => {
    fetchLeaveHistory();
    calculateStatistics();
  }, []);

  useEffect(() => {
    fetchLeaveHistory();
  }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder, filters.status]);

  const fetchLeaveHistory = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getMyLeaves(filters);
      setLeaves(response.data.leaves || []);
      setPagination({
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        total: response.data.total || 0,
        pages: response.data.pages || 1
      });
    } catch (error) {
      toast.error('Failed to fetch leave history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStatistics = async () => {
    try {
      const response = await leaveAPI.getMyLeaves({ limit: 1000 });
      const allLeaves = response.data.leaves || [];

      const totalDays = allLeaves.reduce((sum, leave) => sum + (leave.numberOfDays || 0), 0);
      const approvedLeaves = allLeaves.filter(l => l.status === 'approved');
      const pendingLeaves = allLeaves.filter(l => l.status === 'pending');
      const rejectedLeaves = allLeaves.filter(l => l.status === 'rejected');
      const cancelledLeaves = allLeaves.filter(l => l.status === 'cancelled');

      // Group by type
      const byType = {};
      allLeaves.forEach(leave => {
        if (!byType[leave.leaveType]) {
          byType[leave.leaveType] = { count: 0, days: 0 };
        }
        byType[leave.leaveType].count += 1;
        byType[leave.leaveType].days += leave.numberOfDays || 0;
      });

      // Monthly trend for last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = format(date, 'MMM yyyy');
        const monthLeaves = allLeaves.filter(leave => {
          const leaveDate = new Date(leave.appliedDate);
          return leaveDate.getMonth() === date.getMonth() &&
            leaveDate.getFullYear() === date.getFullYear();
        });
        months.push({
          month: monthName,
          count: monthLeaves.length,
          days: monthLeaves.reduce((sum, l) => sum + (l.numberOfDays || 0), 0)
        });
      }

      setStats({
        totalLeaves: allLeaves.length,
        totalDays,
        approvedLeaves: approvedLeaves.length,
        approvedDays: approvedLeaves.reduce((sum, l) => sum + (l.numberOfDays || 0), 0),
        pendingLeaves: pendingLeaves.length,
        pendingDays: pendingLeaves.reduce((sum, l) => sum + (l.numberOfDays || 0), 0),
        rejectedLeaves: rejectedLeaves.length,
        rejectedDays: rejectedLeaves.reduce((sum, l) => sum + (l.numberOfDays || 0), 0),
        cancelledLeaves: cancelledLeaves.length,
        byType,
        monthlyTrend: months
      });
    } catch (error) {
      console.error('Error calculating statistics:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaveHistory();
    calculateStatistics();
  };

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchLeaveHistory();
    setShowFilters(false);
    toast.success('Filters applied');
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      leaveType: '',
      startDate: '',
      endDate: '',
      search: '',
      page: 1,
      limit: 10,
      sortBy: 'appliedDate',
      sortOrder: 'desc'
    });
    setTimeout(() => {
      fetchLeaveHistory();
    }, 100);
    toast.success('Filters reset');
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate = '';
    let endDate = '';

    switch (preset) {
      case 'thisMonth':
        startDate = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
        endDate = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd');
        break;
      case 'last3Months':
        startDate = format(new Date(today.setMonth(today.getMonth() - 3)), 'yyyy-MM-dd');
        endDate = format(new Date(), 'yyyy-MM-dd');
        break;
      case 'last6Months':
        startDate = format(new Date(today.setMonth(today.getMonth() - 6)), 'yyyy-MM-dd');
        endDate = format(new Date(), 'yyyy-MM-dd');
        break;
      case 'thisYear':
        startDate = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
        endDate = format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd');
        break;
      default:
        startDate = '';
        endDate = '';
    }

    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSort = (field) => {
    const order = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: order }));
  };

  const handleViewDetails = (leave) => {
    setSelectedLeave(leave);
    setShowDetails(true);
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      await leaveAPI.cancelLeave(leaveId);
      toast.success('Leave request cancelled successfully');
      fetchLeaveHistory();
      calculateStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const handleExportData = () => {
    try {
      const csvData = leaves.map(l => ({
        'Leave Type': l.leaveType,
        'From Date': format(new Date(l.fromDate), 'dd/MM/yyyy'),
        'To Date': format(new Date(l.toDate), 'dd/MM/yyyy'),
        'Days': l.numberOfDays,
        'Reason': l.reason,
        'Status': l.status,
        'Applied Date': format(new Date(l.appliedDate), 'dd/MM/yyyy'),
        'Comments': l.comments || ''
      }));

      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leave_history_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      a.click();

      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = LEAVE_STATUS[status] || LEAVE_STATUS.pending;
    return (
      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
        <span className="mr-1">{statusInfo.icon}</span>
        {statusInfo.label}
      </span>
    );
  };

  const getLeaveTypeIcon = (type) => {
    const leaveType = LEAVE_TYPES.find(t => t.value === type);
    return leaveType?.icon || '📅';
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy');
  };

  const toggleRowExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leave history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave History</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and track all your leave applications
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
            onClick={handleExportData}
            className="btn-secondary flex items-center"
          >
            <FiDownload className="mr-2" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex items-center"
          >
            <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      {showStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leave Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Leaves</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalLeaves}</p>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">{stats.totalDays} total days</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Approved</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.approvedLeaves}</p>
              <p className="text-xs text-green-500 dark:text-green-400 mt-1">{stats.approvedDays} days</p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pendingLeaves}</p>
              <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">{stats.pendingDays} days</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-sm text-purple-600 dark:text-purple-400">Leave Balance</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {user?.leaveBalance?.annual || 0}
              </p>
              <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">Annual leaves left</p>
            </div>
          </div>

          {/* Leave Type Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byType).map(([type, data]) => {
              const leaveType = LEAVE_TYPES.find(t => t.value === type);
              return (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{leaveType?.icon || '📅'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{data.count} leaves • {data.days} days</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly Trend */}
          {stats.monthlyTrend.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Monthly Trend</h3>
              <div className="grid grid-cols-6 gap-2">
                {stats.monthlyTrend.map((month) => (
                  <div key={month.month} className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{month.month}</div>
                    <div className="relative h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div
                        className="absolute bottom-0 w-full bg-primary-500 dark:bg-primary-600 transition-all duration-300"
                        style={{ height: `${(month.count / Math.max(...stats.monthlyTrend.map(m => m.count), 1)) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">{month.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div
          className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-500 dark:text-gray-400" />
            <h2 className="font-medium text-gray-700 dark:text-gray-300">Filters & Search</h2>
            {Object.values(filters).some(v => v && v !== '' && v !== 1 && v !== 10 && v !== 'appliedDate' && v !== 'desc') && (
              <span className="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs rounded-full">
                Active
              </span>
            )}
          </div>
          {showFilters ? <FiChevronUp className="text-gray-500" /> : <FiChevronDown className="text-gray-500" />}
        </div>

        {showFilters && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by reason..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Leave Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Leave Type
                </label>
                <select
                  value={filters.leaveType}
                  onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Types</option>
                  {LEAVE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Date Presets */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Date Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {datePresets.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => handleDatePreset(preset.value)}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-700 dark:text-gray-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSort('appliedDate')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.sortBy === 'appliedDate'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  Date {filters.sortBy === 'appliedDate' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('leaveType')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.sortBy === 'leaveType'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  Leave Type {filters.sortBy === 'leaveType' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('numberOfDays')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.sortBy === 'numberOfDays'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  Days {filters.sortBy === 'numberOfDays' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
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
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-medium">{leaves.length}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> leave applications
        </p>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
          <select
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value), page: 1 })}
            className="input-field text-sm py-1 w-20 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Leave History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {leaves.map((leave) => (
                <Fragment key={leave._id}>
                  <tr
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => toggleRowExpand(leave._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getLeaveTypeIcon(leave.leaveType)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {leave.leaveType} Leave
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {leave.numberOfDays} {leave.numberOfDays === 1 ? 'day' : 'days'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(leave.appliedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewDetails(leave)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>

                        {leave.status === 'pending' && (
                          <button
                            onClick={() => handleCancelLeave(leave._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Cancel Request"
                          >
                            <FiXCircle className="w-5 h-5" />
                          </button>
                        )}
                        <FiChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${expandedRow === leave._id ? 'rotate-180' : ''
                            }`}
                        />
                      </div>
                    </td>
                  </tr>
                  {expandedRow === leave._id && (
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <p className="font-medium mb-2">Reason for Leave:</p>
                          <p className="whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                            {leave.reason}
                          </p>
                          {leave.status !== 'pending' && leave.status !== 'cancelled' && (
                            <div className="flex items-center space-x-2 mt-3 mb-2">
                              <p className="font-medium">Status Update:</p>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(leave.status).props.className}`}>
                                {leave.status} by {leave.approvedBy?.name || 'Manager'}
                              </span>
                            </div>
                          )}
                          {leave.comments && (
                            <>
                              <p className="font-medium mt-3 mb-2">Approver Comments:</p>
                              <p className="whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600 italic text-gray-600 dark:text-gray-400">
                                "{leave.comments}"
                              </p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {leaves.length === 0 && !loading && (
          <div className="text-center py-12">
            <FiCalendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No leave applications found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Apply for your first leave using the "Apply Leave" button
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={filters.page === 1}
            className="px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
            Page {filters.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
            disabled={filters.page === pagination.pages}
            className="px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300"
          >
            Next
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedLeave && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Leave Request Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Leave Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Leave Type</p>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center mt-1">
                    <span className="text-2xl mr-2">{getLeaveTypeIcon(selectedLeave.leaveType)}</span>
                    <span className="capitalize">{selectedLeave.leaveType} Leave</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="mt-1">{getStatusBadge(selectedLeave.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">From Date</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {formatDate(selectedLeave.fromDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">To Date</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {formatDate(selectedLeave.toDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Number of Days</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {selectedLeave.numberOfDays} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Applied On</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {formatDate(selectedLeave.appliedDate)}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Reason for Leave</p>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">{selectedLeave.reason}</p>
                </div>
              </div>

              {/* Approval Info */}
              {selectedLeave.approvedBy && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-300 flex items-center">
                    <FiCheckCircle className="mr-2" />
                    Approved by {selectedLeave.approvedBy.name} on{' '}
                    {formatDate(selectedLeave.approvedDate)}
                  </p>
                  {selectedLeave.comments && (
                    <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                      Comments: {selectedLeave.comments}
                    </p>
                  )}
                </div>
              )}

              {/* Rejection Info */}
              {selectedLeave.status === 'rejected' && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300 flex items-center">
                    <FiXCircle className="mr-2" />
                    Rejected
                  </p>
                  {selectedLeave.comments && (
                    <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                      Reason: {selectedLeave.comments}
                    </p>
                  )}
                </div>
              )}

              {/* Cancellation Info */}
              {selectedLeave.status === 'cancelled' && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <FiAlertCircle className="mr-2" />
                    This request was cancelled
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3 border-t dark:border-gray-700 pt-4">
              {selectedLeave.status === 'pending' && (
                <button
                  onClick={() => {
                    handleCancelLeave(selectedLeave._id);
                    setShowDetails(false);
                  }}
                  className="btn-danger"
                >
                  Cancel Request
                </button>
              )}
              <button
                onClick={() => setShowDetails(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;