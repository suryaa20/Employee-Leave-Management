import { useState, Fragment } from 'react';
import { format } from 'date-fns';
import { REIMBURSEMENT_STATUS, CURRENCIES } from '../../utils/constants';
import { FiEye, FiEdit, FiTrash2, FiChevronRight, FiPaperclip } from 'react-icons/fi';
import ReimbursementDetails from './ReimbursementDetails';
import toast from 'react-hot-toast';
import { reimbursementAPI } from '../../services/api';

const ReimbursementList = ({ reimbursements, loading, onRefresh, userRole }) => {
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const getStatusBadge = (status) => {
    const statusInfo = REIMBURSEMENT_STATUS[status] || REIMBURSEMENT_STATUS.pending;

    return (
      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
        <span className="mr-1">{statusInfo.icon}</span>
        {statusInfo.label}
      </span>
    );
  };

  const getCurrencySymbol = (currency) => {
    const curr = CURRENCIES.find(c => c.value === currency);
    return curr?.symbol || '$';
  };

  const handleViewDetails = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setShowDetails(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reimbursement request?')) {
      return;
    }

    try {
      await reimbursementAPI.deleteReimbursement(id);
      toast.success('Reimbursement deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete reimbursement');
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-gray-500">Loading reimbursements...</p>
      </div>
    );
  }

  if (reimbursements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reimbursements found</h3>
        <p className="text-gray-500">
          {userRole === 'employee'
            ? 'Submit your first reimbursement request using the "New Reimbursement" button.'
            : 'No reimbursement requests to display.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {userRole !== 'employee' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reimbursements.map((item) => (
                <Fragment key={item._id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpand(item._id)}>
                    {userRole !== 'employee' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.employeeName}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        {item.receipt && (
                          <FiPaperclip className="ml-2 w-3.5 h-3.5 text-primary-500" title="Has receipt" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(item.description || '').substring(0, 50)}
                        {(item.description || '').length > 50 ? '...' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {(item.category || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {getCurrencySymbol(item.currency)}{Number(item.amount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => { try { const d = new Date(item.expenseDate); return isNaN(d) ? 'N/A' : format(d, 'dd MMM yyyy'); } catch { return 'N/A'; } })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>

                        {userRole === 'employee' && item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                // Handle edit - you can implement this
                                toast.success('Edit functionality coming soon');
                              }}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <FiEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <FiChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedRow === item._id ? 'rotate-90' : ''}`} />
                      </div>
                    </td>
                  </tr>
                  {expandedRow === item._id && (
                    <tr className="bg-gray-50">
                      <td colSpan={userRole !== 'employee' ? 7 : 6} className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          <p className="font-medium mb-2">Full Description:</p>
                          <p className="whitespace-pre-wrap">{item.description}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedReimbursement && (
        <ReimbursementDetails
          reimbursement={selectedReimbursement}
          onClose={() => setShowDetails(false)}
          onRefresh={onRefresh}
          userRole={userRole}
        />
      )}
    </>
  );
};

export default ReimbursementList;