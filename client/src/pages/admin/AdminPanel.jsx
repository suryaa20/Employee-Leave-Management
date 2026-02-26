import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { Link } from 'react-router-dom';
import { userAPI, leaveAPI, reimbursementAPI } from '../../services/api';
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiActivity,
  FiRefreshCw,
  FiPieChart,
  FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalEmployees: 0,
    totalManagers: 0,
    totalAdmins: 0,
    pendingLeaves: 0,
    pendingReimbursements: 0,
    totalLeaveRequests: 0,
    totalReimbursements: 0,
    totalLeaveDays: 0,
    totalReimbursementAmount: 0,
    usersByDepartment: [],
    recentActivities: []
  });

  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersResponse = await userAPI.getUsers({ limit: 1000 });
      const users = usersResponse.data.users || [];

      // Fetch pending leaves
      const leavesResponse = await leaveAPI.getPendingLeaves();
      const pendingLeaves = leavesResponse.data.leaves || [];

      // Fetch pending reimbursements
      const reimbResponse = await reimbursementAPI.getPendingReimbursements();
      const pendingReimbursements = reimbResponse.data.reimbursements || [];

      // Fetch all leaves
      const allLeavesResponse = await leaveAPI.getAllLeaves({ limit: 1000 });
      const allLeaves = allLeavesResponse.data.leaves || [];

      // Fetch all reimbursements
      const allReimbResponse = await reimbursementAPI.getAllReimbursements({ limit: 1000 });
      const allReimbursements = allReimbResponse.data.reimbursements || [];

      // Calculate user statistics
      const activeUsers = users.filter(u => u.isActive).length;
      const inactiveUsers = users.filter(u => !u.isActive).length;
      const employees = users.filter(u => u.role === 'employee').length;
      const managers = users.filter(u => u.role === 'manager').length;
      const admins = users.filter(u => u.role === 'admin').length;

      // Calculate department distribution
      const deptMap = {};
      users.forEach(u => {
        deptMap[u.department] = (deptMap[u.department] || 0) + 1;
      });
      const usersByDepartment = Object.entries(deptMap).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count);

      // Calculate totals
      const totalLeaveDays = allLeaves
        .filter(leave => leave.status === 'approved')
        .reduce((sum, leave) => sum + (leave.numberOfDays || 0), 0);

      const totalReimbursementAmount = allReimbursements
        .filter(reimb => reimb.status === 'paid')
        .reduce((sum, reimb) => sum + (reimb.amount || 0), 0);

      setStats({
        totalUsers: users.length,
        activeUsers,
        inactiveUsers,
        totalEmployees: employees,
        totalManagers: managers,
        totalAdmins: admins,
        pendingLeaves: pendingLeaves.length,
        pendingReimbursements: pendingReimbursements.length,
        totalLeaveRequests: allLeaves.length,
        totalReimbursements: allReimbursements.length,
        totalLeaveDays,
        totalReimbursementAmount,
        usersByDepartment: usersByDepartment.slice(0, 5),
        recentActivities: generateRecentActivities(users, allLeaves, allReimbursements)
      });

      // Set recent users (last 5 registered)
      setRecentUsers(users.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateRecentActivities = (users, leaves, reimbursements) => {
    const activities = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    // New user registrations - only if created within the last 24 hours
    users.filter(user => new Date(user.createdAt) > oneDayAgo).slice(0, 3).forEach(user => {
      activities.push({
        id: `user-${user._id}`,
        type: 'user',
        description: `${user.name || 'A user'} registered as ${user.role}`,
        time: user.createdAt,
        icon: '👤',
        color: 'blue'
      });
    });

    // Recent leave applications - last 5
    leaves.slice(0, 5).forEach(leave => {
      activities.push({
        id: `leave-${leave._id}`,
        type: 'leave',
        description: `${leave.employeeName || leave.employeeId?.name || 'Someone'} applied for ${leave.leaveType || 'a'} leave`,
        time: leave.appliedDate,
        icon: '📅',
        color: 'yellow'
      });
    });

    // Recent reimbursements - last 5
    reimbursements.slice(0, 5).forEach(reimb => {
      activities.push({
        id: `reimb-${reimb._id}`,
        type: 'reimbursement',
        description: `${reimb.employeeName || reimb.employeeId?.name || 'Someone'} submitted ${reimb.category || 'an'} claim for $${reimb.amount || 0}`,
        time: reimb.appliedDate,
        icon: '💰',
        color: 'green'
      });
    });

    // Sort by date (most recent first)
    return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now - new Date(date)) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Welcome back, <span className="text-primary-600 dark:text-primary-400 font-bold">{user?.name}</span>. Here's what's happening today.
          </p>
        </div>
        <div className="flex space-x-3">
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions - Left Sidebar style column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-100 dark:border-dark-border/50 p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/admin/users"
                className="flex items-center p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 border border-transparent hover:border-primary-100 dark:hover:border-primary-900/20 transition-all duration-200 group"
              >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl mr-3 group-hover:scale-110 transition-transform shadow-sm">
                  <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">User Management</p>
                </div>
              </Link>


              <Link
                to="/admin/reports"
                className="flex items-center p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 border border-transparent hover:border-primary-100 dark:hover:border-primary-900/20 transition-all duration-200 group"
              >
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-xl mr-3 group-hover:scale-110 transition-transform shadow-sm">
                  <FiPieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Reports</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-100 dark:border-dark-border/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Departments</h2>
            </div>
            <div className="space-y-4">
              {stats.usersByDepartment.map((dept) => (
                <div key={dept.name} className="group">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 dark:text-slate-400 font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors uppercase text-[10px] tracking-wider">{dept.name}</span>
                    <span className="font-bold text-gray-900 dark:text-slate-200">{dept.count}</span>
                  </div>
                  <div className="progress-bar dark:bg-slate-800 h-1.5">
                    <div
                      className="progress-bar-fill bg-primary-600 dark:bg-primary-500 shadow-sm shadow-primary-500/20"
                      style={{ width: `${(dept.count / stats.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column - Recent Activity */}
        <div className="lg:col-span-1.5 xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-100 dark:border-dark-border/50 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border/50 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/30">
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Recent Activity</h2>
              <FiActivity className="text-gray-400 dark:text-slate-500" />
            </div>
            <div className="divide-y divide-gray-100 dark:divide-dark-border/20 flex-1 overflow-y-auto custom-scrollbar">
              {stats.recentActivities.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-slate-500">
                  <FiActivity className="w-12 h-12 mx-auto text-gray-200 dark:text-slate-800 mb-3" />
                  <p className="font-medium">No recent activity</p>
                </div>
              ) : (
                stats.recentActivities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl pt-1 flex-shrink-0 group-hover:scale-110 transition-transform">{activity.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{activity.description}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mt-1.5 flex items-center">
                          <FiClock className="mr-1" />
                          {formatTimeAgo(activity.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Recent Users */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-100 dark:border-dark-border/50 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border/50 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30">
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Recent Users</h2>
              <Link to="/admin/users" className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-dark-border/20 flex-1 overflow-y-auto custom-scrollbar">
              {recentUsers.map((user) => (
                <div key={user._id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className={`avatar-xs shadow-sm ring-2 ring-white dark:ring-slate-800 ${user.role === 'admin' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      user.role === 'manager' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-slate-100 text-xs truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{user.name}</p>
                      <p className="text-[10px] font-medium text-gray-500 dark:text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
