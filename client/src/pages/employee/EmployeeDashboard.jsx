import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { Link } from 'react-router-dom';
import { leaveAPI, reimbursementAPI } from '../../services/api';
import { format } from 'date-fns';
import LeaveSummaryCard from '../../components/common/LeaveSummaryCard';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiDollarSign } from 'react-icons/fi';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [leaveStats, setLeaveStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const [reimbStats, setReimbStats] = useState({
    total: 0,
    totalAmount: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch leaves
      const leavesResponse = await leaveAPI.getMyLeaves();
      const leavesData = leavesResponse?.data?.leaves || [];
      setLeaves(leavesData.slice(0, 5));

      const leaveStats = {
        total: leavesData.length,
        approved: leavesData.filter(l => l?.status === 'approved').length,
        pending: leavesData.filter(l => l?.status === 'pending').length,
        rejected: leavesData.filter(l => l?.status === 'rejected').length
      };
      setLeaveStats(leaveStats);

      // Fetch reimbursements
      const reimbResponse = await reimbursementAPI.getMyReimbursements({ limit: 5 });
      const reimbursementsData = (reimbResponse?.data?.reimbursements || []).filter(r => r?.title);
      setReimbursements(reimbursementsData);

      setReimbStats({
        total: reimbursementsData.length,
        totalAmount: reimbResponse?.data?.totalAmount || 0,
        pending: reimbursementsData.filter(r => r?.status === 'pending').length
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'paid': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  const safeFormat = (dateStr, formatStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (!date || isNaN(date.getTime())) return 'N/A';
      return format(date, formatStr);
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Welcome back, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center">
            <FiClock className="mr-2" />
            {safeFormat(new Date().toISOString(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Apply leave button removed */}
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl shadow-blue-500/10 p-8 text-white transition-all hover:-translate-y-1">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">Annual Leave</p>
              <p className="text-5xl font-black mt-3">{user?.leaveBalance?.annual || 0}</p>
              <p className="text-blue-100/80 text-sm mt-2 font-medium">Days remaining</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <FiCalendar className="text-4xl text-white" />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl shadow-xl shadow-emerald-500/10 p-8 text-white transition-all hover:-translate-y-1">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">Sick Leave</p>
              <p className="text-5xl font-black mt-3">{user?.leaveBalance?.sick || 0}</p>
              <p className="text-emerald-100/80 text-sm mt-2 font-medium">Days remaining</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <FiClock className="text-4xl text-white" />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl shadow-xl shadow-indigo-500/10 p-8 text-white transition-all hover:-translate-y-1">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wider">Casual Leave</p>
              <p className="text-5xl font-black mt-3">{user?.leaveBalance?.casual || 0}</p>
              <p className="text-indigo-100/80 text-sm mt-2 font-medium">Days remaining</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <FiCheckCircle className="text-4xl text-white" />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <LeaveSummaryCard
          title="Leave Applications"
          count={leaveStats.total}
          color="blue"
          icon="📊"
        />
        <LeaveSummaryCard
          title="Pending Leaves"
          count={leaveStats.pending}
          color="yellow"
          icon="⏳"
        />
        <LeaveSummaryCard
          title="Reimbursements"
          count={reimbStats.total}
          color="green"
          icon="💰"
        />
        <LeaveSummaryCard
          title="Pending Reimbursements"
          count={reimbStats.pending}
          color="yellow"
          icon="⏳"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/employee/apply-leave"
          className="group relative overflow-hidden bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-transparent"
        >
          <div className="flex items-center space-x-4 relative z-10">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl transition-colors group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30">
              <FiCalendar className="text-2xl text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Apply for Leave</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Submit a new leave application</p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
        </Link>

        <Link
          to="/employee/reimbursements"
          className="group relative overflow-hidden bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-primary-500/50"
        >
          <div className="flex items-center space-x-4 relative z-10">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl transition-colors group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30">
              <FiDollarSign className="text-2xl text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">New Reimbursement</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Submit an expense claim</p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
        </Link>

        <Link
          to="/employee/leave-history"
          className="group relative overflow-hidden bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-primary-500/50"
        >
          <div className="flex items-center space-x-4 relative z-10">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl transition-colors group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30">
              <FiClock className="text-2xl text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">View History</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Check your leave history</p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
        </Link>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Leaves */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border dark:border-dark-border overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between bg-gray-50/50 dark:bg-dark-bg/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Leave Applications</h2>
            <Link to="/employee/leave-history" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">View All</Link>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : leaves.length === 0 ? (
            <div className="p-12 text-center text-gray-400 dark:text-gray-500">
              <FiCalendar className="mx-auto w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No leave applications yet</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-dark-border">
              {leaves.map((leave) => (
                <div key={leave._id} className="px-6 py-5 hover:bg-gray-50 dark:hover:bg-dark-bg/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${leave.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                        leave.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                          'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                        }`}>
                        {leave.leaveType === 'sick' ? '🤒' : leave.leaveType === 'casual' ? '🏖️' : '📝'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white capitalize">{leave.leaveType} Leave</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                          {safeFormat(leave.fromDate, 'dd MMM')} - {safeFormat(leave.toDate, 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reimbursements */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border dark:border-dark-border overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between bg-gray-50/50 dark:bg-dark-bg/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Reimbursements</h2>
            <Link to="/employee/reimbursements" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">View All</Link>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : reimbursements.length === 0 ? (
            <div className="p-12 text-center text-gray-400 dark:text-gray-500">
              <FiDollarSign className="mx-auto w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No reimbursement requests yet</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-dark-border">
              {reimbursements.map((item) => (
                <div key={item._id} className="px-6 py-5 hover:bg-gray-50 dark:hover:bg-dark-bg/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <FiDollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] md:max-w-[200px]">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                          ${item.amount} • {safeFormat(item.expenseDate, 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;