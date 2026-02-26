import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { Link } from 'react-router-dom';
import { leaveAPI, reimbursementAPI, userAPI } from '../../services/api';
import { format } from 'date-fns';
import {
  FiUsers,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiFileText,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    pendingReimbursements: 0,
    approvedThisMonth: 0,
    totalLeaveDays: 0,
    totalReimbursementAmount: 0,
    teamMembers: []
  });

  const [recentLeaves, setRecentLeaves] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch pending leaves
      const leavesResponse = await leaveAPI.getPendingLeaves();
      const pendingLeaves = leavesResponse.data.leaves || [];

      // Fetch team members
      const teamResponse = await userAPI.getUsers({
        department: user?.department,
        limit: 100
      });
      const teamMembers = teamResponse.data.users || [];

      // Fetch all leaves for the department
      const allLeavesResponse = await leaveAPI.getAllLeaves({
        department: user?.department,
        limit: 50
      });
      const allLeaves = allLeavesResponse.data.leaves || [];

      // Calculate stats
      // Fetch pending reimbursements
      const reimbResponse = await reimbursementAPI.getPendingReimbursements();
      const pendingReimbursements = reimbResponse.data.reimbursements || [];

      // Calculate stats
      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();

      const approvedThisMonth = allLeaves.filter(leave => {
        const leaveDate = new Date(leave.appliedDate);
        return leave.status === 'approved' &&
          leaveDate.getMonth() === thisMonth &&
          leaveDate.getFullYear() === thisYear;
      }).length;

      const totalLeaveDays = allLeaves
        .filter(leave => leave.status === 'approved')
        .reduce((sum, leave) => sum + (leave.numberOfDays || 0), 0);

      setStats({
        totalEmployees: teamMembers.length,
        pendingLeaves: pendingLeaves.length,
        pendingReimbursements: pendingReimbursements.length,
        approvedThisMonth,
        totalLeaveDays,
        totalReimbursementAmount: reimbResponse.data.totalAmount || 0,
        teamMembers: teamMembers.slice(0, 5)
      });

      // Set recent leaves (last 5)
      setRecentLeaves(pendingLeaves.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="w-4 h-4" />;
      case 'approved': return <FiCheckCircle className="w-4 h-4" />;
      case 'rejected': return <FiXCircle className="w-4 h-4" />;
      case 'paid': return <FiDollarSign className="w-4 h-4" />;
      default: return <FiAlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}! Here's what's happening with your team.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center"
        >
          <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEmployees}</p>
              <p className="text-xs text-gray-500 mt-1">in {user?.department} department</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-yellow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingLeaves}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.pendingReimbursements} reimbursements</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FiClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.approvedThisMonth}</p>
              <p className="text-xs text-gray-500 mt-1">leave requests</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leave Days</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLeaveDays}</p>
              <p className="text-xs text-gray-500 mt-1">days approved</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiCalendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leaves */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-dark-border">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-dark-bg/50">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leave Requests Table</h2>
            <Link to="/manager/leave-requests" className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Go to Full List →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-dark-border">
              <thead className="bg-gray-50/50 dark:bg-dark-bg/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Type & Duration</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {recentLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-gray-500 italic">
                      No pending leave requests found.
                    </td>
                  </tr>
                ) : (
                  recentLeaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-gray-50 dark:hover:bg-primary-900/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold">
                            {leave.employeeName?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{leave.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white capitalize">{leave.leaveType} Leave</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(leave.fromDate), 'dd MMM')} - {format(new Date(leave.toDate), 'dd MMM yyyy')} ({leave.numberOfDays}d)
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={async () => {
                              try {
                                await leaveAPI.updateLeaveStatus(leave._id, { status: 'approved' });
                                toast.success('Leave approved!');
                                fetchDashboardData();
                              } catch (e) {
                                toast.error('Approval failed');
                              }
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Quick Approve"
                          >
                            <FiCheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await leaveAPI.updateLeaveStatus(leave._id, { status: 'rejected', comments: 'Rejected from dashboard' });
                                toast.success('Leave rejected');
                                fetchDashboardData();
                              } catch (e) {
                                toast.error('Rejection failed');
                              }
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            title="Quick Reject"
                          >
                            <FiXCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/manager/leave-requests"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <div className="bg-primary-100 p-2 rounded-full mr-3">
                <FiFileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Review Leave Requests</p>
                <p className="text-sm text-gray-500">{stats.pendingLeaves} pending</p>
              </div>
            </Link>

            <Link
              to="/manager/team"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <FiUsers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Team</p>
                <p className="text-sm text-gray-500">{stats.totalEmployees} members</p>
              </div>
            </Link>

            <Link
              to="/manager/reimbursements"
              className="flex items-center p-3 bg-gray-50 dark:bg-dark-bg/50 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors border border-transparent hover:border-primary-500/20"
            >
              <div className="bg-emerald-100 dark:bg-emerald-900/20 p-2 rounded-full mr-3">
                <FiDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Review Reimbursements</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stats.pendingReimbursements} pending</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ManagerDashboard;