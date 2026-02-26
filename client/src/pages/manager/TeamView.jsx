import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { userAPI, leaveAPI, reimbursementAPI } from '../../services/api';
import { USER_ROLES } from '../../utils/constants';
import { 
  FiUsers, 
  FiUserPlus, 
  FiMail, 
  FiPhone,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiBarChart2,
  FiTrendingUp,
  FiAward,
  FiActivity,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TeamView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    onLeave: 0,
    pendingLeaves: 0,
    pendingReimbursements: 0,
    totalLeaveDays: 0,
    totalReimbursementAmount: 0,
    departmentStats: {},
    topPerformers: []
  });

  // Member activity data
  const [memberActivity, setMemberActivity] = useState({});

  useEffect(() => {
    fetchTeamData();
  }, []);

  useEffect(() => {
    filterTeamMembers();
  }, [filters, teamMembers]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch team members
      const usersResponse = await userAPI.getUsers({ 
        department: user?.department,
        limit: 100 
      });
      const members = usersResponse.data.users || [];
      
      // Fetch pending leaves for the department
      const leavesResponse = await leaveAPI.getPendingLeaves();
      const pendingLeaves = leavesResponse.data.leaves || [];
      
      // Fetch pending reimbursements
      const reimbResponse = await reimbursementAPI.getPendingReimbursements();
      const pendingReimbursements = reimbResponse.data.reimbursements || [];
      
      // Fetch all leaves for statistics
      const allLeavesResponse = await leaveAPI.getAllLeaves({ 
        department: user?.department,
        limit: 1000 
      });
      const allLeaves = allLeavesResponse.data.leaves || [];
      
      // Fetch all reimbursements for statistics
      const allReimbResponse = await reimbursementAPI.getAllReimbursements({ 
        department: user?.department,
        limit: 1000 
      });
      const allReimbursements = allReimbResponse.data.reimbursements || [];

      // Calculate department statistics
      const activeMembers = members.filter(m => m.isActive).length;
      const membersOnLeave = members.filter(m => {
        return pendingLeaves.some(leave => leave.employeeId === m._id);
      }).length;

      const totalLeaveDays = allLeaves
        .filter(leave => leave.status === 'approved')
        .reduce((sum, leave) => sum + (leave.numberOfDays || 0), 0);

      const totalReimbursementAmount = allReimbursements
        .filter(reimb => reimb.status === 'paid')
        .reduce((sum, reimb) => sum + (reimb.amount || 0), 0);

      // Calculate department stats by role
      const departmentStats = {};
      members.forEach(member => {
        if (!departmentStats[member.role]) {
          departmentStats[member.role] = 0;
        }
        departmentStats[member.role]++;
      });

      // Calculate member activity
      const activity = {};
      members.forEach(member => {
        const memberLeaves = allLeaves.filter(l => l.employeeId === member._id);
        const memberReimbursements = allReimbursements.filter(r => r.employeeId === member._id);
        
        activity[member._id] = {
          totalLeaves: memberLeaves.length,
          pendingLeaves: memberLeaves.filter(l => l.status === 'pending').length,
          approvedLeaves: memberLeaves.filter(l => l.status === 'approved').length,
          totalReimbursements: memberReimbursements.length,
          pendingReimbursements: memberReimbursements.filter(r => r.status === 'pending').length,
          totalAmount: memberReimbursements
            .filter(r => r.status === 'paid')
            .reduce((sum, r) => sum + (r.amount || 0), 0)
        };
      });
      setMemberActivity(activity);

      // Calculate top performers (based on approvals)
      const topPerformers = members
        .map(member => ({
          ...member,
          approvedLeaves: activity[member._id]?.approvedLeaves || 0,
          totalAmount: activity[member._id]?.totalAmount || 0
        }))
        .sort((a, b) => b.approvedLeaves - a.approvedLeaves)
        .slice(0, 5);

      setStats({
        totalMembers: members.length,
        activeMembers,
        onLeave: membersOnLeave,
        pendingLeaves: pendingLeaves.length,
        pendingReimbursements: pendingReimbursements.length,
        totalLeaveDays,
        totalReimbursementAmount,
        departmentStats,
        topPerformers
      });

      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterTeamMembers = () => {
    let filtered = [...teamMembers];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(member => 
        member.name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (filters.role) {
      filtered = filtered.filter(member => member.role === filters.role);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(member => 
        filters.status === 'active' ? member.isActive : !member.isActive
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[filters.sortBy];
      let bVal = b[filters.sortBy];

      if (filters.sortBy === 'name') {
        aVal = a.name || '';
        bVal = b.name || '';
      } else if (filters.sortBy === 'leaves') {
        aVal = memberActivity[a._id]?.totalLeaves || 0;
        bVal = memberActivity[b._id]?.totalLeaves || 0;
      } else if (filters.sortBy === 'reimbursements') {
        aVal = memberActivity[a._id]?.totalAmount || 0;
        bVal = memberActivity[b._id]?.totalAmount || 0;
      }

      if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTeamData();
  };

  const handleApplyFilters = () => {
    filterTeamMembers();
    setShowFilters(false);
    toast.success('Filters applied');
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
    toast.success('Filters reset');
  };

  const handleSort = (field) => {
    const order = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: order }));
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowDetails(true);
  };

  const handleExportData = () => {
    try {
      const filteredMembers = filterTeamMembers();
      
      const csvData = filteredMembers.map(m => ({
        'Name': m.name,
        'Email': m.email,
        'Role': m.role,
        'Department': m.department,
        'Phone': m.phoneNumber || 'N/A',
        'Status': m.isActive ? 'Active' : 'Inactive',
        'Total Leaves': memberActivity[m._id]?.totalLeaves || 0,
        'Pending Leaves': memberActivity[m._id]?.pendingLeaves || 0,
        'Total Reimbursements': memberActivity[m._id]?.totalReimbursements || 0,
        'Total Amount': `$${memberActivity[m._id]?.totalAmount?.toFixed(2) || 0}`
      }));

      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team_${user?.department}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      a.click();

      toast.success('Team data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      employee: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
    return colors[role] || colors.employee;
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return format(new Date(date), 'dd MMM yyyy');
  };

  const filteredMembers = filterTeamMembers();

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Team</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {user?.department} Department • {stats.totalMembers} Members
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Team Members</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalMembers}</p>
                </div>
                <FiUsers className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-2 flex space-x-2 text-xs">
                <span className="text-green-600 dark:text-green-400">{stats.activeMembers} Active</span>
                <span className="text-gray-500 dark:text-gray-400">•</span>
                <span className="text-yellow-600 dark:text-yellow-400">{stats.onLeave} On Leave</span>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending Requests</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pendingLeaves}</p>
                </div>
                <FiClock className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                {stats.pendingReimbursements} pending reimbursements
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Leave Days</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalLeaveDays}</p>
                </div>
                <FiCalendar className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">Total approved days</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Reimbursements</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    ${stats.totalReimbursementAmount.toFixed(2)}
                  </p>
                </div>
                <FiDollarSign className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">Total paid amount</p>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.departmentStats).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{role}s</span>
                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>

          {/* Top Performers */}
          {stats.topPerformers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <FiAward className="mr-2 text-yellow-500" />
                Top Performers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {stats.topPerformers.map((member, index) => (
                  <div key={member._id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.approvedLeaves} leaves</p>
                    </div>
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
            {Object.values(filters).some(v => v && v !== '' && v !== 'name' && v !== 'asc') && (
              <span className="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs rounded-full">
                Active
              </span>
            )}
          </div>
          {showFilters ? <FiChevronUp className="text-gray-500" /> : <FiChevronDown className="text-gray-500" />}
        </div>

        {showFilters && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Roles</option>
                  {USER_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
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
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSort('name')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'name' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Name {filters.sortBy === 'name' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('role')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'role' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Role {filters.sortBy === 'role' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('leaves')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'leaves' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Total Leaves {filters.sortBy === 'leaves' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('reimbursements')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === 'reimbursements' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Reimbursement Amount {filters.sortBy === 'reimbursements' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
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
          Showing <span className="font-medium">{filteredMembers.length}</span> team members
        </p>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <div
            key={member._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
            onClick={() => handleViewMember(member)}
          >
            <div className="p-6">
              {/* Header with avatar and status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${getRoleBadge(member.role)}`}>
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{member.role}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(member.isActive)}`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Contact Info */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FiMail className="w-4 h-4 mr-2" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phoneNumber && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiPhone className="w-4 h-4 mr-2" />
                    <span>{member.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FiBriefcase className="w-4 h-4 mr-2" />
                  <span>{member.department}</span>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Leaves</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {memberActivity[member._id]?.totalLeaves || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                    {memberActivity[member._id]?.pendingLeaves || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reimb.</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {memberActivity[member._id]?.totalReimbursements || 0}
                  </p>
                </div>
              </div>

              {/* Leave Balance */}
              <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Leave Balance</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    Annual: <span className="font-medium text-gray-900 dark:text-white">{member.leaveBalance?.annual || 0}</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Sick: <span className="font-medium text-gray-900 dark:text-white">{member.leaveBalance?.sick || 0}</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Casual: <span className="font-medium text-gray-900 dark:text-white">{member.leaveBalance?.casual || 0}</span>
                  </span>
                </div>
              </div>

              {/* View Details Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewMember(member);
                }}
                className="mt-4 w-full btn-secondary flex items-center justify-center"
              >
                <FiEye className="mr-2" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <FiUsers className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No team members found</p>
        </div>
      )}

      {/* Member Details Modal */}
      {showDetails && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Team Member Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Profile Header */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getRoleBadge(selectedMember.role)}`}>
                  {selectedMember.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedMember.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadge(selectedMember.role)}`}>
                      {selectedMember.role}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedMember.isActive)}`}>
                      {selectedMember.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedMember.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedMember.phoneNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedMember.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedMember.createdAt)}</p>
                </div>
              </div>

              {/* Leave Balance */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Leave Balance</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Annual</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                      {selectedMember.leaveBalance?.annual || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-green-600 dark:text-green-400">Sick</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300">
                      {selectedMember.leaveBalance?.sick || 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-purple-600 dark:text-purple-400">Casual</p>
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                      {selectedMember.leaveBalance?.casual || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Summary</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Leaves</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {memberActivity[selectedMember._id]?.totalLeaves || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Approved Leaves</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {memberActivity[selectedMember._id]?.approvedLeaves || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reimbursements</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {memberActivity[selectedMember._id]?.totalReimbursements || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ${memberActivity[selectedMember._id]?.totalAmount?.toFixed(2) || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pending Items */}
              {(memberActivity[selectedMember._id]?.pendingLeaves > 0 || 
                memberActivity[selectedMember._id]?.pendingReimbursements > 0) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">Pending Items</p>
                  <div className="space-y-2">
                    {memberActivity[selectedMember._id]?.pendingLeaves > 0 && (
                      <div className="flex items-center text-sm text-yellow-700 dark:text-yellow-400">
                        <FiClock className="mr-2" />
                        {memberActivity[selectedMember._id]?.pendingLeaves} pending leave requests
                      </div>
                    )}
                    {memberActivity[selectedMember._id]?.pendingReimbursements > 0 && (
                      <div className="flex items-center text-sm text-yellow-700 dark:text-yellow-400">
                        <FiDollarSign className="mr-2" />
                        {memberActivity[selectedMember._id]?.pendingReimbursements} pending reimbursements
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3 border-t dark:border-gray-700 pt-4">
              <button
                onClick={() => setShowDetails(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Navigate to member's detailed view or actions
                  toast.success(`Viewing ${selectedMember.name}'s full profile`);
                }}
                className="btn-primary"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;