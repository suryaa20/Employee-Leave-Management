import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { reimbursementAPI } from '../../services/api';
import ReimbursementForm from '../../components/reimbursement/ReimbursementForm';
import ReimbursementList from '../../components/reimbursement/ReimbursementList';
import { REIMBURSEMENT_STATUS } from '../../utils/constants';
import { FiPlus, FiFilter, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ReimbursementPage = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    page: 1
  });

  useEffect(() => {
    fetchReimbursements();
  }, [filters]);

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      const response = await reimbursementAPI.getMyReimbursements(filters);
      setReimbursements((response.data.reimbursements || []).filter(r => r.title));

      // Calculate stats
      const allResponse = await reimbursementAPI.getMyReimbursements({ limit: 1000 });
      const allReimbursements = (allResponse.data.reimbursements || []).filter(r => r.title);

      const newStats = {
        total: allReimbursements.length,
        totalAmount: allResponse.data.totalAmount || 0,
        pending: allReimbursements.filter(r => r.status === 'pending').length,
        approved: allReimbursements.filter(r => r.status === 'approved').length,
        paid: allReimbursements.filter(r => r.status === 'paid').length,
        rejected: allReimbursements.filter(r => r.status === 'rejected').length
      };
      setStats(newStats);
    } catch (error) {
      toast.error('Failed to fetch reimbursements');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reimbursements</h1>
          <p className="text-gray-600 mt-1">Manage your expense claims</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center"
        >
          <FiPlus className="mr-2" />
          {showForm ? 'View List' : 'New Reimbursement'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Claims</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">${stats.totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
        </div>
      </div>

      {/* Main Content */}
      {showForm ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Submit New Reimbursement</h2>
          <ReimbursementForm onSuccess={() => {
            setShowForm(false);
            fetchReimbursements();
          }} />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <FiFilter className="text-gray-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="input-field text-sm py-2 w-40"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Showing {reimbursements.length} of {stats.total}
              </span>
              <button
                onClick={fetchReimbursements}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Refresh"
              >
                <FiRefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Reimbursement List */}
          <ReimbursementList
            reimbursements={reimbursements}
            loading={loading}
            onRefresh={fetchReimbursements}
            userRole="employee"
          />
        </>
      )}
    </div>
  );
};

export default ReimbursementPage;