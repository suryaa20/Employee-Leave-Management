import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { leaveAPI, reimbursementAPI, userAPI } from '../../services/api';
import { 
  FiDownload, 
  FiCalendar, 
  FiPieChart,
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiFileText,
  FiRefreshCw,
  FiPrinter,
  FiMail,
  FiShare2,
  FiChevronDown,
  FiChevronUp,
  FiActivity,
  FiAward,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedReport, setSelectedReport] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [reportData, setReportData] = useState({
    overview: {},
    leaves: {},
    reimbursements: {},
    users: {},
    financial: {}
  });

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedReport]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch data based on selected report
      switch(selectedReport) {
        case 'overview':
          await fetchOverviewReport();
          break;
        case 'leaves':
          await fetchLeavesReport();
          break;
        case 'reimbursements':
          await fetchReimbursementsReport();
          break;
        case 'users':
          await fetchUsersReport();
          break;
        case 'financial':
          await fetchFinancialReport();
          break;
        default:
          await fetchOverviewReport();
      }

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOverviewReport = async () => {
    // Fetch all data for overview
    const [usersRes, leavesRes, reimbRes] = await Promise.all([
      userAPI.getUsers({ limit: 1000 }),
      leaveAPI.getAllLeaves({ limit: 1000, startDate: dateRange.startDate, endDate: dateRange.endDate }),
      reimbursementAPI.getAllReimbursements({ limit: 1000, startDate: dateRange.startDate, endDate: dateRange.endDate })
    ]);

    const users = usersRes.data.users || [];
    const leaves = leavesRes.data.leaves || [];
    const reimbursements = reimbRes.data.reimbursements || [];

    // Calculate overview metrics
    const totalEmployees = users.filter(u => u.role === 'employee').length;
    const totalManagers = users.filter(u => u.role === 'manager').length;
    const activeUsers = users.filter(u => u.isActive).length;

    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
    const totalLeaveDays = leaves
      .filter(l => l.status === 'approved')
      .reduce((sum, l) => sum + (l.numberOfDays || 0), 0);

    const pendingReimbursements = reimbursements.filter(r => r.status === 'pending').length;
    const approvedReimbursements = reimbursements.filter(r => r.status === 'approved').length;
    const paidReimbursements = reimbursements.filter(r => r.status === 'paid').length;
    const totalReimbursementAmount = reimbursements
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    // Monthly trend data
    const months = eachMonthOfInterval({
      start: new Date(dateRange.startDate),
      end: new Date(dateRange.endDate)
    });

    const monthlyData = months.map(month => {
      const monthLeaves = leaves.filter(l => 
        new Date(l.appliedDate).getMonth() === month.getMonth() &&
        new Date(l.appliedDate).getFullYear() === month.getFullYear()
      );
      const monthReimbursements = reimbursements.filter(r => 
        new Date(r.appliedDate).getMonth() === month.getMonth() &&
        new Date(r.appliedDate).getFullYear() === month.getFullYear()
      );

      return {
        name: format(month, 'MMM yyyy'),
        leaves: monthLeaves.length,
        reimbursements: monthReimbursements.length,
        amount: monthReimbursements.reduce((sum, r) => sum + (r.amount || 0), 0)
      };
    });

    setReportData({
      overview: {
        users: {
          total: users.length,
          employees: totalEmployees,
          managers: totalManagers,
          active: activeUsers,
          inactive: users.length - activeUsers
        },
        leaves: {
          total: leaves.length,
          pending: pendingLeaves,
          approved: approvedLeaves,
          totalDays: totalLeaveDays
        },
        reimbursements: {
          total: reimbursements.length,
          pending: pendingReimbursements,
          approved: approvedReimbursements,
          paid: paidReimbursements,
          totalAmount: totalReimbursementAmount
        },
        monthlyTrend: monthlyData
      }
    });
  };

  const fetchLeavesReport = async () => {
    const leavesRes = await leaveAPI.getAllLeaves({ 
      limit: 1000, 
      startDate: dateRange.startDate, 
      endDate: dateRange.endDate 
    });
    const leaves = leavesRes.data.leaves || [];

    // Group by status
    const byStatus = {
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
      cancelled: leaves.filter(l => l.status === 'cancelled').length
    };

    // Group by type
    const byType = {};
    leaves.forEach(l => {
      byType[l.leaveType] = (byType[l.leaveType] || 0) + 1;
    });

    // Group by department
    const byDepartment = {};
    leaves.forEach(l => {
      if (l.employeeId?.department) {
        byDepartment[l.employeeId.department] = (byDepartment[l.employeeId.department] || 0) + 1;
      }
    });

    // Monthly trend
    const months = eachMonthOfInterval({
      start: new Date(dateRange.startDate),
      end: new Date(dateRange.endDate)
    });

    const monthlyData = months.map(month => {
      const monthLeaves = leaves.filter(l => 
        new Date(l.appliedDate).getMonth() === month.getMonth() &&
        new Date(l.appliedDate).getFullYear() === month.getFullYear()
      );

      return {
        name: format(month, 'MMM yyyy'),
        total: monthLeaves.length,
        approved: monthLeaves.filter(l => l.status === 'approved').length,
        pending: monthLeaves.filter(l => l.status === 'pending').length,
        days: monthLeaves.reduce((sum, l) => sum + (l.numberOfDays || 0), 0)
      };
    });

    setReportData({
      leaves: {
        total: leaves.length,
        byStatus,
        byType,
        byDepartment,
        monthlyTrend: monthlyData,
        topEmployees: leaves
          .reduce((acc, l) => {
            const emp = acc.find(e => e.name === l.employeeName);
            if (emp) {
              emp.count++;
              emp.days += l.numberOfDays || 0;
            } else {
              acc.push({
                name: l.employeeName,
                count: 1,
                days: l.numberOfDays || 0
              });
            }
            return acc;
          }, [])
          .sort((a, b) => b.days - a.days)
          .slice(0, 5)
      }
    });
  };

  const fetchReimbursementsReport = async () => {
    const reimbRes = await reimbursementAPI.getAllReimbursements({ 
      limit: 1000, 
      startDate: dateRange.startDate, 
      endDate: dateRange.endDate 
    });
    const reimbursements = reimbRes.data.reimbursements || [];

    // Group by status
    const byStatus = {
      pending: reimbursements.filter(r => r.status === 'pending').length,
      approved: reimbursements.filter(r => r.status === 'approved').length,
      rejected: reimbursements.filter(r => r.status === 'rejected').length,
      paid: reimbursements.filter(r => r.status === 'paid').length
    };

    // Group by category
    const byCategory = {};
    reimbursements.forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + r.amount;
    });

    // Amount by status
    const amountByStatus = {
      pending: reimbursements.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
      approved: reimbursements.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0),
      paid: reimbursements.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0),
      rejected: reimbursements.filter(r => r.status === 'rejected').reduce((sum, r) => sum + r.amount, 0)
    };

    // Monthly trend
    const months = eachMonthOfInterval({
      start: new Date(dateRange.startDate),
      end: new Date(dateRange.endDate)
    });

    const monthlyData = months.map(month => {
      const monthReimbursements = reimbursements.filter(r => 
        new Date(r.appliedDate).getMonth() === month.getMonth() &&
        new Date(r.appliedDate).getFullYear() === month.getFullYear()
      );

      return {
        name: format(month, 'MMM yyyy'),
        count: monthReimbursements.length,
        amount: monthReimbursements.reduce((sum, r) => sum + r.amount, 0),
        paid: monthReimbursements.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0)
      };
    });

    setReportData({
      reimbursements: {
        total: reimbursements.length,
        totalAmount: reimbursements.reduce((sum, r) => sum + r.amount, 0),
        byStatus,
        byCategory,
        amountByStatus,
        monthlyTrend: monthlyData,
        topEmployees: reimbursements
          .reduce((acc, r) => {
            const emp = acc.find(e => e.name === r.employeeName);
            if (emp) {
              emp.count++;
              emp.amount += r.amount;
            } else {
              acc.push({
                name: r.employeeName,
                count: 1,
                amount: r.amount
              });
            }
            return acc;
          }, [])
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
      }
    });
  };

  const fetchUsersReport = async () => {
    const usersRes = await userAPI.getUsers({ limit: 1000 });
    const users = usersRes.data.users || [];

    // Group by role
    const byRole = {
      employee: users.filter(u => u.role === 'employee').length,
      manager: users.filter(u => u.role === 'manager').length,
      admin: users.filter(u => u.role === 'admin').length
    };

    // Group by department
    const byDepartment = {};
    users.forEach(u => {
      byDepartment[u.department] = (byDepartment[u.department] || 0) + 1;
    });

    // Active vs Inactive
    const activeStatus = {
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    };

    // Recent registrations
    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        joined: format(new Date(u.createdAt), 'dd MMM yyyy')
      }));

    setReportData({
      users: {
        total: users.length,
        byRole,
        byDepartment,
        activeStatus,
        recentUsers,
        registrationTrend: calculateRegistrationTrend(users)
      }
    });
  };

  const fetchFinancialReport = async () => {
    const [leavesRes, reimbRes] = await Promise.all([
      leaveAPI.getAllLeaves({ limit: 1000, startDate: dateRange.startDate, endDate: dateRange.endDate }),
      reimbursementAPI.getAllReimbursements({ limit: 1000, startDate: dateRange.startDate, endDate: dateRange.endDate })
    ]);

    const leaves = leavesRes.data.leaves || [];
    const reimbursements = reimbRes.data.reimbursements || [];

    // Calculate leave costs (assuming daily rate)
    const DAILY_RATE = 100; // This should come from settings
    const leaveCost = leaves
      .filter(l => l.status === 'approved')
      .reduce((sum, l) => sum + (l.numberOfDays * DAILY_RATE), 0);

    // Reimbursement totals
    const totalReimbursements = reimbursements.reduce((sum, r) => sum + r.amount, 0);
    const paidReimbursements = reimbursements
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    // Monthly financial trend
    const months = eachMonthOfInterval({
      start: new Date(dateRange.startDate),
      end: new Date(dateRange.endDate)
    });

    const monthlyData = months.map(month => {
      const monthReimbursements = reimbursements.filter(r => 
        new Date(r.appliedDate).getMonth() === month.getMonth() &&
        new Date(r.appliedDate).getFullYear() === month.getFullYear() &&
        r.status === 'paid'
      );

      const monthLeaves = leaves.filter(l => 
        new Date(l.appliedDate).getMonth() === month.getMonth() &&
        new Date(l.appliedDate).getFullYear() === month.getFullYear() &&
        l.status === 'approved'
      );

      return {
        name: format(month, 'MMM yyyy'),
        reimbursements: monthReimbursements.reduce((sum, r) => sum + r.amount, 0),
        leaveCost: monthLeaves.reduce((sum, l) => sum + (l.numberOfDays * DAILY_RATE), 0),
        total: monthReimbursements.reduce((sum, r) => sum + r.amount, 0) + 
               monthLeaves.reduce((sum, l) => sum + (l.numberOfDays * DAILY_RATE), 0)
      };
    });

    setReportData({
      financial: {
        leaveCost,
        totalReimbursements,
        paidReimbursements,
        pendingReimbursements: totalReimbursements - paidReimbursements,
        totalExpense: leaveCost + paidReimbursements,
        monthlyTrend: monthlyData,
        categoryBreakdown: reimbursements
          .filter(r => r.status === 'paid')
          .reduce((acc, r) => {
            acc[r.category] = (acc[r.category] || 0) + r.amount;
            return acc;
          }, {})
      }
    });
  };

  const calculateRegistrationTrend = (users) => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return months.map(month => {
      const count = users.filter(u => 
        new Date(u.createdAt).getMonth() === month.getMonth() &&
        new Date(u.createdAt).getFullYear() === month.getFullYear()
      ).length;

      return {
        month: format(month, 'MMM yyyy'),
        registrations: count
      };
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  const handleExportPDF = () => {
    toast.success('PDF export started');
    // Implement PDF export
  };

  const handleExportExcel = () => {
    toast.success('Excel export started');
    // Implement Excel export
  };

  const handleEmailReport = () => {
    toast.success('Report sent to your email');
    // Implement email functionality
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTypes = [
    { id: 'overview', name: 'Overview', icon: FiActivity, description: 'High-level summary of all activities' },
    { id: 'leaves', name: 'Leave Reports', icon: FiCalendar, description: 'Detailed leave analytics' },
    { id: 'reimbursements', name: 'Reimbursement Reports', icon: FiDollarSign, description: 'Expense and reimbursement analysis' },
    { id: 'users', name: 'User Reports', icon: FiUsers, description: 'User demographics and activity' },
    { id: 'financial', name: 'Financial Reports', icon: FiTrendingUp, description: 'Financial summaries and trends' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Generating reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Generate and analyze comprehensive reports
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="btn-secondary flex items-center"
            title="Print"
          >
            <FiPrinter className="mr-2" />
            Print
          </button>
          <button
            onClick={handleEmailReport}
            className="btn-secondary flex items-center"
            title="Email"
          >
            <FiMail className="mr-2" />
            Email
          </button>
          <button
            onClick={handleExportPDF}
            className="btn-secondary flex items-center"
          >
            <FiDownload className="mr-2" />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="btn-primary flex items-center"
          >
            <FiFileText className="mr-2" />
            Excel
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center"
          >
            <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {reportTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedReport(type.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedReport === type.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
            }`}
          >
            <type.icon className={`w-8 h-8 mx-auto mb-2 ${
              selectedReport === type.id ? 'text-primary-600' : 'text-gray-400'
            }`} />
            <h3 className={`font-medium text-center ${
              selectedReport === type.id ? 'text-primary-600' : 'text-gray-700'
            }`}>{type.name}</h3>
            <p className="text-xs text-gray-500 text-center mt-1">{type.description}</p>
          </button>
        ))}
      </div>

      {/* Date Range and Filters */}
      <div className="bg-white rounded-lg shadow">
        <div 
          className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-500" />
            <h2 className="font-medium text-gray-700">Date Range & Filters</h2>
          </div>
          {showFilters ? <FiChevronUp /> : <FiChevronDown />}
        </div>

        {showFilters && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDateRange({
                  startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                  endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
                })}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                This Month
              </button>
              <button
                onClick={() => {
                  const lastMonth = subMonths(new Date(), 1);
                  setDateRange({
                    startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
                    endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
                  });
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Last Month
              </button>
              <button
                onClick={() => {
                  const threeMonthsAgo = subMonths(new Date(), 3);
                  setDateRange({
                    startDate: format(threeMonthsAgo, 'yyyy-MM-dd'),
                    endDate: format(new Date(), 'yyyy-MM-dd')
                  });
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Last 3 Months
              </button>
              <button
                onClick={() => {
                  const sixMonthsAgo = subMonths(new Date(), 6);
                  setDateRange({
                    startDate: format(sixMonthsAgo, 'yyyy-MM-dd'),
                    endDate: format(new Date(), 'yyyy-MM-dd')
                  });
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Last 6 Months
              </button>
              <button
                onClick={() => {
                  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
                  setDateRange({
                    startDate: format(startOfYear, 'yyyy-MM-dd'),
                    endDate: format(new Date(), 'yyyy-MM-dd')
                  });
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                This Year
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {/* Overview Report */}
        {selectedReport === 'overview' && reportData.overview && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="stat-card-blue">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {reportData.overview.users?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportData.overview.users?.active || 0} Active
                    </p>
                  </div>
                  <FiUsers className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="stat-card-green">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Leave Requests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {reportData.overview.leaves?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportData.overview.leaves?.pending || 0} Pending
                    </p>
                  </div>
                  <FiCalendar className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="stat-card-yellow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Reimbursements</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {reportData.overview.reimbursements?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ${(reportData.overview.reimbursements?.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                  <FiDollarSign className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="stat-card-purple">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Leave Days</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {reportData.overview.leaves?.totalDays || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total days</p>
                  </div>
                  <FiActivity className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Activity Trend</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.overview.monthlyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="leaves" stroke="#3b82f6" name="Leaves" />
                    <Line yAxisId="left" type="monotone" dataKey="reimbursements" stroke="#10b981" name="Reimbursements" />
                    <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#f59e0b" name="Amount ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">User Distribution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Employees', value: reportData.overview.users?.employees || 0 },
                          { name: 'Managers', value: reportData.overview.users?.managers || 0 },
                          { name: 'Admins', value: reportData.overview.users?.total - (reportData.overview.users?.employees + reportData.overview.users?.managers) || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Status Overview</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Leave Requests</span>
                      <span className="font-medium">{reportData.overview.leaves?.total || 0}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-yellow-500" 
                        style={{ width: `${(reportData.overview.leaves?.pending / reportData.overview.leaves?.total * 100) || 0}%` }}
                      />
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(reportData.overview.leaves?.approved / reportData.overview.leaves?.total * 100) || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-yellow-600">Pending: {reportData.overview.leaves?.pending || 0}</span>
                      <span className="text-green-600">Approved: {reportData.overview.leaves?.approved || 0}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Reimbursements</span>
                      <span className="font-medium">{reportData.overview.reimbursements?.total || 0}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-yellow-500" 
                        style={{ width: `${(reportData.overview.reimbursements?.pending / reportData.overview.reimbursements?.total * 100) || 0}%` }}
                      />
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(reportData.overview.reimbursements?.approved / reportData.overview.reimbursements?.total * 100) || 0}%` }}
                      />
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${(reportData.overview.reimbursements?.paid / reportData.overview.reimbursements?.total * 100) || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-yellow-600">Pending: {reportData.overview.reimbursements?.pending || 0}</span>
                      <span className="text-green-600">Approved: {reportData.overview.reimbursements?.approved || 0}</span>
                      <span className="text-blue-600">Paid: {reportData.overview.reimbursements?.paid || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Leave Report */}
        {selectedReport === 'leaves' && reportData.leaves && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Leaves</p>
                <p className="text-3xl font-bold text-gray-900">{reportData.leaves.total || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">By Type</p>
                {Object.entries(reportData.leaves.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm mt-1">
                    <span className="capitalize">{type}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Status Breakdown</p>
                {Object.entries(reportData.leaves.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm mt-1">
                    <span className="capitalize">{status}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Top Employees</p>
                {reportData.leaves.topEmployees?.map((emp, idx) => (
                  <div key={idx} className="flex justify-between text-sm mt-1">
                    <span>{emp.name}:</span>
                    <span className="font-medium">{emp.days} days</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Leave Trend</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.leaves.monthlyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" name="Total Leaves" />
                    <Bar dataKey="approved" fill="#10b981" name="Approved" />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Reimbursement Report */}
        {selectedReport === 'reimbursements' && reportData.reimbursements && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(reportData.reimbursements.totalAmount || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">By Category</p>
                {Object.entries(reportData.reimbursements.byCategory || {}).slice(0, 3).map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between text-sm mt-1">
                    <span className="capitalize">{cat}:</span>
                    <span className="font-medium">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Amount by Status</p>
                {Object.entries(reportData.reimbursements.amountByStatus || {}).map(([status, amount]) => (
                  <div key={status} className="flex justify-between text-sm mt-1">
                    <span className="capitalize">{status}:</span>
                    <span className="font-medium">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Top Claimants</p>
                {reportData.reimbursements.topEmployees?.map((emp, idx) => (
                  <div key={idx} className="flex justify-between text-sm mt-1">
                    <span>{emp.name}:</span>
                    <span className="font-medium">${emp.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Reimbursement Trend</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.reimbursements.monthlyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#93c5fd" name="Amount" />
                    <Area type="monotone" dataKey="paid" stroke="#10b981" fill="#a7f3d0" name="Paid" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* User Report */}
        {selectedReport === 'users' && reportData.users && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{reportData.users.total || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-green-600">{reportData.users.activeStatus?.active || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-3xl font-bold text-gray-400">{reportData.users.activeStatus?.inactive || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Users by Role</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Employees', value: reportData.users.byRole?.employee || 0 },
                          { name: 'Managers', value: reportData.users.byRole?.manager || 0 },
                          { name: 'Admins', value: reportData.users.byRole?.admin || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Registration Trend</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.users.registrationTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="registrations" stroke="#3b82f6" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Registrations</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.users.recentUsers?.map((user, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.department}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Financial Report */}
        {selectedReport === 'financial' && reportData.financial && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="stat-card-blue">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Expense</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${(reportData.financial.totalExpense || 0).toFixed(2)}
                    </p>
                  </div>
                  <FiTrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="stat-card-green">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Leave Cost</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${(reportData.financial.leaveCost || 0).toFixed(2)}
                    </p>
                  </div>
                  <FiCalendar className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="stat-card-yellow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Paid Reimbursements</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${(reportData.financial.paidReimbursements || 0).toFixed(2)}
                    </p>
                  </div>
                  <FiDollarSign className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="stat-card-purple">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Payments</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${(reportData.financial.pendingReimbursements || 0).toFixed(2)}
                    </p>
                  </div>
                  <FiClock className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Financial Trend</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.financial.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="reimbursements" fill="#3b82f6" name="Reimbursements" />
                      <Bar dataKey="leaveCost" fill="#10b981" name="Leave Cost" />
                      <Bar dataKey="total" fill="#f59e0b" name="Total" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Expense by Category</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(reportData.financial.categoryBreakdown || {}).map(([cat, amount]) => ({
                          name: cat,
                          value: amount
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;