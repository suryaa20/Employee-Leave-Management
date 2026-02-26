import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { leaveAPI, userAPI } from '../../services/api';
import { LEAVE_TYPES, LEAVE_STATUS } from '../../utils/constants';
import { 
  FiCalendar, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiDownload,
  FiPrinter,
  FiAlertCircle,
  FiBarChart2,
  FiActivity,
  FiTrendingUp
} from 'react-icons/fi';
import { format, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const LeaveRequests = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'pending',
    employeeId: '',
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
    totalRequests: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
    totalDays: 0,
    averageDays: 0,
    byType: {},
    monthlyTrend: [],
    teamSummary: []
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve');
  const [approvalComments, setApprovalComments] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Date range presets
  const datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'thisWeek' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'This Quarter', value: 'thisQuarter' },
    { label: 'This Year', value: 'thisYear' }
  ];

  useEffect(() => {
    fetchTeamMembers();
    fetchLeaveRequests();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchLeaveRequests();
  }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder, filters.status]);

  const fetchTeamMembers = async () => {
    try {
      const response = await userAPI.getUsers({ 
        department: user?.department,
        role: 'employee',
        limit: 100 
      });
      setTeamMembers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getAllLeaves(filters);
      setLeaveRequests(response.data.leaves || []);
      setPagination({
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        total: response.data.total || 0,
        pages: response.data.pages || 1
      });
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await leaveAPI.getLeaveStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaveRequests();
    fetchStatistics();
  };

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchLeaveRequests();
    setShowFilters(false);
    toast.success('Filters applied');
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'pending',
      employeeId: '',
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
      fetchLeaveRequests();
    }, 100);
    toast.success('Filters reset');
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate = '';
    let endDate = '';

    switch(preset) {
      case 'today':
        startDate = format(today, 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'thisWeek':
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        startDate = format(weekStart, 'yyyy-MM-dd');
        endDate = format(weekEnd, 'yyyy-MM-dd');
        break;
      case 'thisMonth':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        endDate = format(endOfMonth(lastMonthEnd), 'yyyy-MM-dd');
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        startDate = format(quarterStart, 'yyyy-MM-dd');
        endDate = format(quarterEnd, 'yyyy-MM-dd');
        break;
      case 'thisYear':
        startDate = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
        endDate = format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd');
        break;
    }

    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSort = (field) => {
    const order = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: order }));
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const handleApproveReject = async () => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest._id);
    try {
      await leaveAPI.updateLeaveStatus(selectedRequest._id, {
        status: approvalAction,
        comments: approvalComments
      });
      
      toast.success(`Leave request ${approvalAction}ed successfully`);
      setShowApprovalModal(false);
      setApprovalComments('');
      fetchLeaveRequests();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${approvalAction} request`);
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
    }
  };

  const handleBulkAction = async (action, requestIds) => {
    if (!window.confirm(`Are you sure you want to ${action} ${requestIds.length} selected requests?`)) {
      return;
    }

    try {
      await Promise.all(requestIds.map(id => 
        leaveAPI.updateLeaveStatus(id, { status: action })
      ));
      toast.success(`Successfully ${action}ed ${requestIds.length} requests`);
      fetchLeaveRequests();
      fetchStatistics();
    } catch (error) {
      toast.error(`Failed to process bulk action`);
    }
  };

  const handleExportData = () => {
    try {
      const csvData = leaveRequests.map(l => ({
        'Employee Name': l.employeeName,
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
      a.download = `leave_requests_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
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

  const calculateDaysBetween = (from, to) => {
    return differenceInDays(new Date(to), new Date(from)) + 1;
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy');
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Leave Requests</h1>
          <p className="text-gray-600 mt-1">
            Manage and review employee leave requests
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stat-card-yellow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingCount || 0}</p>
                </div>
                <FiClock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="stat-card-green">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.approvedCount || 0}</p>
                </div>
                <FiCheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="stat-card-blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalDays || 0}</p>
                </div>
                <FiCalendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="stat-card-purple">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Days/Request</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.averageDays || 0}</p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Leave Type Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byType || {}).map(([type, count]) => {
              const leaveType = LEAVE_TYPES.find(t => t.value === type);
              return (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{leaveType?.icon || '📅'}</span>
                    <span className="text-sm capitalize">{type}</span>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow">
        <div 
          className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-500" />
            <h2 className="font-medium text-gray-700">Filters & Search</h2>
            {Object.values(filters).some(v => v && v !== '' && v !== 1 && v !== 10 && v !== 'pending' && v !== 'appliedDate' && v !== 'desc') && (
              <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                Active
              </span>
            )}
          </div>
          {showFilters ? <FiChevronUp /> : <FiChevronDown />}
        </div>

        {showFilters && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by employee or reason..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 input-field"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input-field"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Employee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select
                  value={filters.employeeId}
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                  className="input-field"
                >
                  <option value="">All Employees</option>
                  {teamMembers.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type
                </label>
                <select
                  value={filters.leaveType}
                  onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
                  className="input-field"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Date Presets */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Date Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {datePresets.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => handleDatePreset(preset.value)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSort('employeeName')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'employeeName' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Employee {filters.sortBy === 'employeeName' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('appliedDate')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'appliedDate' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Date {filters.sortBy === 'appliedDate' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('leaveType')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'leaveType' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Leave Type {filters.sortBy === 'leaveType' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('numberOfDays')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'numberOfDays' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
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
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{leaveRequests.length}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> leave requests
        </p>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value), page: 1 })}
            className="input-field text-sm py-1 w-20"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="avatar-sm bg-primary-100 text-primary-600">
                        {request.employeeName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {request.employeeName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{getLeaveTypeIcon(request.leaveType)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {request.leaveType} Leave
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {request.reason.substring(0, 50)}
                          {request.reason.length > 50 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(request.fromDate)} - {formatDate(request.toDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.numberOfDays} {request.numberOfDays === 1 ? 'day' : 'days'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.appliedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                      
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setApprovalAction('approved');
                              setShowApprovalModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <FiCheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setApprovalAction('rejected');
                              setShowApprovalModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <FiXCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leaveRequests.length === 0 && !loading && (
          <div className="text-center py-12">
            <FiCalendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No leave requests found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={filters.page === 1}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {filters.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
            disabled={filters.page === pagination.pages}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {approvalAction === 'approved' ? 'Approve' : 'Reject'} Leave Request
              </h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-4">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Employee:</span> {selectedRequest.employeeName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Leave Type:</span> {selectedRequest.leaveType}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Duration:</span> {formatDate(selectedRequest.fromDate)} - {formatDate(selectedRequest.toDate)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Days:</span> {selectedRequest.numberOfDays}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {approvalAction === 'approved' ? 'Comments (optional)' : 'Reason for rejection *'}
                </label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows="3"
                  className="input-field"
                  placeholder={approvalAction === 'approved' ? 'Add any comments...' : 'Please provide a reason for rejection...'}
                  required={approvalAction === 'rejected'}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveReject}
                disabled={processingId === selectedRequest._id || (approvalAction === 'rejected' && !approvalComments)}
                className={approvalAction === 'approved' ? 'btn-success' : 'btn-danger'}
              >
                {processingId === selectedRequest._id ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `${approvalAction === 'approved' ? 'Approve' : 'Reject'} Request`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 w-full max-w-2xl bg-white rounded-lg shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Leave Request Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Employee Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="avatar-lg bg-primary-100 text-primary-600">
                  {selectedRequest.employeeName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{selectedRequest.employeeName}</h4>
                  <p className="text-gray-500">Employee</p>
                </div>
              </div>

              {/* Leave Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Leave Type</p>
                  <p className="font-medium capitalize flex items-center">
                    <span className="text-2xl mr-2">{getLeaveTypeIcon(selectedRequest.leaveType)}</span>
                    {selectedRequest.leaveType} Leave
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p>{getStatusBadge(selectedRequest.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">From Date</p>
                  <p className="font-medium">{formatDate(selectedRequest.fromDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To Date</p>
                  <p className="font-medium">{formatDate(selectedRequest.toDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Number of Days</p>
                  <p className="font-medium">{selectedRequest.numberOfDays} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Applied On</p>
                  <p className="font-medium">{formatDate(selectedRequest.appliedDate)}</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Reason for Leave</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{selectedRequest.reason}</p>
                </div>
              </div>

              {/* Approval Info */}
              {selectedRequest.approvedBy && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <FiCheckCircle className="inline mr-2" />
                    Approved by {selectedRequest.approvedBy.name} on{' '}
                    {formatDate(selectedRequest.approvedDate)}
                  </p>
                  {selectedRequest.comments && (
                    <p className="text-sm text-green-700 mt-2">
                      Comments: {selectedRequest.comments}
                    </p>
                  )}
                </div>
              )}

              {/* Rejection Info */}
              {selectedRequest.status === 'rejected' && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    <FiXCircle className="inline mr-2" />
                    Rejected
                  </p>
                  {selectedRequest.comments && (
                    <p className="text-sm text-red-700 mt-2">
                      Reason: {selectedRequest.comments}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setApprovalAction('approved');
                      setShowApprovalModal(true);
                    }}
                    className="btn-success"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setApprovalAction('rejected');
                      setShowApprovalModal(true);
                    }}
                    className="btn-danger"
                  >
                    Reject
                  </button>
                </>
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

export default LeaveRequests;