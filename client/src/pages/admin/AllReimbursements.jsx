import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { reimbursementAPI, userAPI } from '../../services/api';
import ReimbursementList from '../../components/reimbursement/ReimbursementList';
import ReimbursementDetails from '../../components/reimbursement/ReimbursementDetails';
import { 
  FiFilter, 
  FiRefreshCw, 
  FiDownload, 
  FiPieChart,
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCreditCard,
  FiFileText,
  FiTrendingUp,
  FiActivity
} from 'react-icons/fi';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const AllReimbursements = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reimbursements, setReimbursements] = useState([]);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [employees, setEmployees] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    employeeId: '',
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
    totalReimbursements: 0,
    totalAmount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    approvedCount: 0,
    approvedAmount: 0,
    rejectedCount: 0,
    rejectedAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    categoryBreakdown: [],
    monthlyTrend: [],
    averageAmount: 0,
    processingTime: 0
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
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Last 3 Months', value: 'last3Months' },
    { label: 'Last 6 Months', value: 'last6Months' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'All Time', value: 'all' }
  ];

  // Category options
  const categoryOptions = [
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'food', label: 'Food & Meals', icon: '🍔' },
    { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
    { value: 'medical', label: 'Medical', icon: '🏥' },
    { value: 'office_supplies', label: 'Office Supplies', icon: '📎' },
    { value: 'training', label: 'Training', icon: '📚' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow', icon: '⏳' },
    { value: 'approved', label: 'Approved', color: 'green', icon: '✅' },
    { value: 'rejected', label: 'Rejected', color: 'red', icon: '❌' },
    { value: 'paid', label: 'Paid', color: 'blue', icon: '💰' }
  ];

  useEffect(() => {
    fetchEmployees();
    fetchReimbursements();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchReimbursements();
  }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  const fetchEmployees = async () => {
    try {
      const response = await userAPI.getUsers({ limit: 1000 });
      setEmployees(response.data.users || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
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
      status: '',
      category: '',
      employeeId: '',
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
      case 'last6Months':
        startDate = format(subMonths(today, 6), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'thisYear':
        startDate = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
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

  const handleViewDetails = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setShowDetails(true);
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await reimbursementAPI.markAsPaid(id, {
        paymentMethod: 'bank_transfer',
        transactionId: `TXN${Date.now()}`
      });
      toast.success('Reimbursement marked as paid');
      fetchReimbursements();
      fetchStatistics();
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reimbursement?')) {
      return;
    }

    try {
      await reimbursementAPI.deleteReimbursement(id);
      toast.success('Reimbursement deleted successfully');
      fetchReimbursements();
      fetchStatistics();
    } catch (error) {
      toast.error('Failed to delete reimbursement');
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
        'Approved Date': r.approvedDate ? format(new Date(r.approvedDate), 'dd/MM/yyyy') : '',
        'Paid Date': r.paidDate ? format(new Date(r.paidDate), 'dd/MM/yyyy') : '',
        'Transaction ID': r.transactionId || '',
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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || colors.pending;
  };

  const getCategoryIcon = (category) => {
    const found = categoryOptions.find(c => c.value === category);
    return found?.icon || '📦';
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading reimbursements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">All Reimbursements</h1>
          <p className="text-gray-600 mt-1">
            Manage and process all employee reimbursement requests
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-secondary flex items-center"
          >
            <FiPieChart className="mr-2" />
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Reimbursement Statistics</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FiActivity className="w-4 h-4" />
              <span>Updated just now</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Reimbursements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReimbursements || 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalAmount || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Across all statuses</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Average Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.averageAmount || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per reimbursement</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processingTime || 0}d</p>
              <p className="text-xs text-gray-500 mt-1">Average</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border-l-4 border-yellow-500 pl-3">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-semibold text-gray-900">{stats.pendingCount || 0}</p>
              <p className="text-sm text-yellow-600">{formatCurrency(stats.pendingAmount || 0)}</p>
              <p className="text-xs text-gray-400">{calculatePercentage(stats.pendingAmount, stats.totalAmount)}% of total</p>
            </div>
            <div className="border-l-4 border-green-500 pl-3">
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-lg font-semibold text-gray-900">{stats.approvedCount || 0}</p>
              <p className="text-sm text-green-600">{formatCurrency(stats.approvedAmount || 0)}</p>
              <p className="text-xs text-gray-400">{calculatePercentage(stats.approvedAmount, stats.totalAmount)}% of total</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-3">
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-lg font-semibold text-gray-900">{stats.paidCount || 0}</p>
              <p className="text-sm text-blue-600">{formatCurrency(stats.paidAmount || 0)}</p>
              <p className="text-xs text-gray-400">{calculatePercentage(stats.paidAmount, stats.totalAmount)}% of total</p>
            </div>
            <div className="border-l-4 border-red-500 pl-3">
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-lg font-semibold text-gray-900">{stats.rejectedCount || 0}</p>
              <p className="text-sm text-red-600">{formatCurrency(stats.rejectedAmount || 0)}</p>
              <p className="text-xs text-gray-400">{calculatePercentage(stats.rejectedAmount, stats.totalAmount)}% of total</p>
            </div>
          </div>

          {/* Category Breakdown */}
          {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">By Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.categoryBreakdown.map((cat) => (
                  <div key={cat._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{getCategoryIcon(cat._id)}</span>
                      <span className="text-sm capitalize">{cat._id.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm font-medium">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            {Object.values(filters).some(v => v && v !== '' && v !== 1 && v !== 10) && (
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
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
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
                  onClick={() => handleSort('employeeName')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'employeeName' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Employee Name {filters.sortBy === 'employeeName' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
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
          <span className="font-medium">{pagination.total}</span> reimbursements
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

      {/* Reimbursement List */}
      <ReimbursementList
        reimbursements={reimbursements}
        loading={loading}
        onRefresh={fetchReimbursements}
        userRole="admin"
        onViewDetails={handleViewDetails}
        onMarkAsPaid={handleMarkAsPaid}
        onDelete={handleDelete}
      />

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

      {/* Details Modal */}
      {showDetails && selectedReimbursement && (
        <ReimbursementDetails
          reimbursement={selectedReimbursement}
          onClose={() => setShowDetails(false)}
          onRefresh={fetchReimbursements}
          userRole="admin"
        />
      )}
    </div>
  );
};

export default AllReimbursements;