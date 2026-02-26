import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { reimbursementAPI, userAPI } from '../../services/api';
import { REIMBURSEMENT_CATEGORIES, REIMBURSEMENT_STATUS, CURRENCIES } from '../../utils/constants';
import { 
  FiDollarSign,
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
  FiBarChart2,
  FiTrendingUp,
  FiCalendar,
  FiTag,
  FiFileText,
  FiAlertCircle,
  FiCreditCard,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

const ReimbursementApprovals = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reimbursements, setReimbursements] = useState([]);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'pending',
    employeeId: '',
    category: '',
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
    pendingAmount: 0,
    approvedCount: 0,
    approvedAmount: 0,
    rejectedCount: 0,
    rejectedAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    byCategory: {},
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
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Date range presets
  const datePresets = [
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Last 3 Months', value: 'last3Months' },
    { label: 'This Quarter', value: 'thisQuarter' },
    { label: 'This Year', value: 'thisYear' }
  ];

  useEffect(() => {
    fetchTeamMembers();
    fetchReimbursements();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchReimbursements();
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

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      const response = await reimbursementAPI.getAllReimbursements(filters);
      setReimbursements(response.data.reimbursements || []);
      setPagination({
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        total: response.data.total || 0,
        pages: response.data.pages || 1
      });
    } catch (error) {
      toast.error('Failed to fetch reimbursements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await reimbursementAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReimbursements();
    fetchStatistics();
  };

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchReimbursements();
    setShowFilters(false);
    toast.success('Filters applied');
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'pending',
      employeeId: '',
      category: '',
      startDate: '',
      endDate: '',
      search: '',
      page: 1,
      limit: 10,
      sortBy: 'appliedDate',
      sortOrder: 'desc'
    });
    setTimeout(() => {
      fetchReimbursements();
    }, 100);
    toast.success('Filters reset');
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate = '';
    let endDate = '';

    switch(preset) {
      case 'thisMonth':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        break;
      case 'last3Months':
        startDate = format(subMonths(today, 3), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
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

  const handleViewDetails = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setShowDetails(true);
  };

  const handleApproveReject = async () => {
    if (!selectedReimbursement) return;

    setProcessingId(selectedReimbursement._id);
    try {
      await reimbursementAPI.updateStatus(selectedReimbursement._id, {
        status: approvalAction,
        comments: approvalComments,
        rejectionReason: approvalAction === 'rejected' ? rejectionReason : undefined
      });
      
      toast.success(`Reimbursement ${approvalAction}ed successfully`);
      setShowApprovalModal(false);
      setApprovalComments('');
      setRejectionReason('');
      fetchReimbursements();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${approvalAction} reimbursement`);
    } finally {
      setProcessingId(null);
      setSelectedReimbursement(null);
    }
  };

  const handleExportData = () => {
    try {
      const csvData = reimbursements.map(r => ({
        'Employee Name': r.employeeName,
        'Title': r.title,
        'Category': r.category,
        'Amount': r.amount,
        'Currency': r.currency,
        'Expense Date': format(new Date(r.expenseDate), 'dd/MM/yyyy'),
        'Status': r.status,
        'Applied Date': format(new Date(r.appliedDate), 'dd/MM/yyyy'),
        'Description': r.description
      }));

      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reimbursements_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      a.click();

      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = REIMBURSEMENT_STATUS[status] || REIMBURSEMENT_STATUS.pending;
    return (
      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
        <span className="mr-1">{statusInfo.icon}</span>
        {statusInfo.label}
      </span>
    );
  };

  const getCategoryIcon = (category) => {
    const cat = REIMBURSEMENT_CATEGORIES.find(c => c.value === category);
    return cat?.icon || '📦';
  };

  const getCategoryColor = (category) => {
    const cat = REIMBURSEMENT_CATEGORIES.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  const getCurrencySymbol = (currency) => {
    const curr = CURRENCIES.find(c => c.value === currency);
    return curr?.symbol || '$';
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy');
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading reimbursement requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reimbursement Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and manage employee reimbursement requests
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
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reimbursement Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stat-card-yellow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Amount: {formatCurrency(stats.pendingAmount || 0)}
                  </p>
                </div>
                <FiClock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="stat-card-green">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.approvedCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Amount: {formatCurrency(stats.approvedAmount || 0)}
                  </p>
                </div>
                <FiCheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="stat-card-blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Paid</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.paidCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Amount: {formatCurrency(stats.paidAmount || 0)}
                  </p>
                </div>
                <FiDollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="stat-card-purple">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {formatCurrency(stats.totalAmount || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.totalRequests || 0} total requests
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byCategory || {}).slice(0, 4).map(([category, data]) => {
              const cat = REIMBURSEMENT_CATEGORIES.find(c => c.value === category);
              return (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{cat?.icon || '📦'}</span>
                    <div>
                      <p className="text-sm capitalize">{category.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{data.count || 0} requests</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">
                    {formatCurrency(data.totalAmount || 0)}
                  </span>
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
                    placeholder="Search by title or description..."
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
                  <option value="paid">Paid</option>
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

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {REIMBURSEMENT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
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
                  onClick={() => handleSort('amount')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'amount' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Amount {filters.sortBy === 'amount' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('category')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'category' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Category {filters.sortBy === 'category' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
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
          Showing <span className="font-medium">{reimbursements.length}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> reimbursement requests
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

      {/* Reimbursements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense Date
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
              {reimbursements.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="avatar-sm bg-primary-100 text-primary-600">
                        {item.employeeName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {item.employeeName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.description.substring(0, 50)}
                      {item.description.length > 50 ? '...' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{getCategoryIcon(item.category)}</span>
                      <span className="text-sm capitalize">{item.category.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.amount, item.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.expenseDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.appliedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                      
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedReimbursement(item);
                              setApprovalAction('approve');
                              setShowApprovalModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <FiCheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReimbursement(item);
                              setApprovalAction('reject');
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

        {reimbursements.length === 0 && !loading && (
          <div className="text-center py-12">
            <FiDollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No reimbursement requests found</p>
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
      {showApprovalModal && selectedReimbursement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Reimbursement
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
                  <span className="font-medium">Employee:</span> {selectedReimbursement.employeeName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Title:</span> {selectedReimbursement.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Amount:</span> {formatCurrency(selectedReimbursement.amount, selectedReimbursement.currency)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Category:</span> {selectedReimbursement.category.replace('_', ' ')}
                </p>
              </div>

              {approvalAction === 'approve' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (optional)
                  </label>
                  <textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    rows="3"
                    className="input-field"
                    placeholder="Add any comments..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows="3"
                    className="input-field"
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}
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
                disabled={processingId === selectedReimbursement._id || (approvalAction === 'reject' && !rejectionReason)}
                className={approvalAction === 'approve' ? 'btn-success' : 'btn-danger'}
              >
                {processingId === selectedReimbursement._id ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `${approvalAction === 'approve' ? 'Approve' : 'Reject'} Request`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedReimbursement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 w-full max-w-2xl bg-white rounded-lg shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Reimbursement Details</h3>
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
                  {selectedReimbursement.employeeName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{selectedReimbursement.employeeName}</h4>
                  <p className="text-gray-500">Employee</p>
                </div>
              </div>

              {/* Title */}
              <div>
                <h4 className="text-lg font-medium text-gray-900">{selectedReimbursement.title}</h4>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium flex items-center mt-1">
                    <span className="text-2xl mr-2">{getCategoryIcon(selectedReimbursement.category)}</span>
                    <span className="capitalize">{selectedReimbursement.category.replace('_', ' ')}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium text-lg mt-1">
                    {formatCurrency(selectedReimbursement.amount, selectedReimbursement.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expense Date</p>
                  <p className="font-medium mt-1">{formatDate(selectedReimbursement.expenseDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Applied Date</p>
                  <p className="font-medium mt-1">{formatDate(selectedReimbursement.appliedDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="mt-1">{getStatusBadge(selectedReimbursement.status)}</p>
                </div>
                {selectedReimbursement.transactionId && (
                  <div>
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="font-medium mt-1">{selectedReimbursement.transactionId}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{selectedReimbursement.description}</p>
                </div>
              </div>

              {/* Approval Info */}
              {selectedReimbursement.approvedBy && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800 flex items-center">
                    <FiCheckCircle className="mr-2" />
                    Approved by {selectedReimbursement.approvedBy.name} on{' '}
                    {formatDate(selectedReimbursement.approvedDate)}
                  </p>
                  {selectedReimbursement.comments && (
                    <p className="text-sm text-green-700 mt-2">
                      Comments: {selectedReimbursement.comments}
                    </p>
                  )}
                </div>
              )}

              {/* Payment Info */}
              {selectedReimbursement.paidBy && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-center">
                    <FiDollarSign className="mr-2" />
                    Paid by {selectedReimbursement.paidBy.name} on{' '}
                    {formatDate(selectedReimbursement.paidDate)}
                  </p>
                  {selectedReimbursement.paymentMethod && (
                    <p className="text-sm text-blue-700 mt-1">
                      Payment Method: {selectedReimbursement.paymentMethod.replace('_', ' ')}
                    </p>
                  )}
                </div>
              )}

              {/* Rejection Info */}
              {selectedReimbursement.status === 'rejected' && selectedReimbursement.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800 flex items-center">
                    <FiXCircle className="mr-2" />
                    Rejected: {selectedReimbursement.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
              {selectedReimbursement.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setApprovalAction('approve');
                      setShowApprovalModal(true);
                    }}
                    className="btn-success"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setApprovalAction('reject');
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

export default ReimbursementApprovals;