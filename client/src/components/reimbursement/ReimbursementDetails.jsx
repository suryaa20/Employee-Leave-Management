import { useState } from 'react';
import { format } from 'date-fns';
import { REIMBURSEMENT_STATUS, CURRENCIES, PAYMENT_METHODS } from '../../utils/constants';
import { FiX, FiCheck, FiXCircle, FiDollarSign, FiCalendar, FiUser, FiTag, FiPaperclip, FiExternalLink } from 'react-icons/fi';
import { reimbursementAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ReimbursementDetails = ({ reimbursement, onClose, onRefresh, userRole }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'bank_transfer',
    transactionId: ''
  });

  const getStatusBadge = (status) => {
    const statusInfo = REIMBURSEMENT_STATUS[status] || REIMBURSEMENT_STATUS.pending;

    return (
      <span className={`px-3 py-1 inline-flex items-center text-sm font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
        <span className="mr-2">{statusInfo.icon}</span>
        {statusInfo.label}
      </span>
    );
  };

  const getCurrencySymbol = (currency) => {
    const curr = CURRENCIES.find(c => c.value === currency);
    return curr?.symbol || '$';
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await reimbursementAPI.updateStatus(reimbursement._id, {
        status: 'approved',
        comments
      });
      toast.success('Reimbursement approved successfully');
      onRefresh();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve reimbursement');
    } finally {
      setActionLoading(false);
      setShowApproveModal(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await reimbursementAPI.updateStatus(reimbursement._id, {
        status: 'rejected',
        rejectionReason
      });
      toast.success('Reimbursement rejected');
      onRefresh();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject reimbursement');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setActionLoading(true);
    try {
      await reimbursementAPI.markAsPaid(reimbursement._id, paymentData);
      toast.success('Reimbursement marked as paid');
      onRefresh();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setActionLoading(false);
      setShowPayModal(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-6 w-full max-w-2xl bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            Reimbursement Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex justify-between items-center">
            {getStatusBadge(reimbursement.status)}

            {/* Action Buttons based on role and status */}
            <div className="flex space-x-2">
              {(userRole === 'manager' || userRole === 'admin') && reimbursement.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm"
                  >
                    <FiCheck className="mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center text-sm"
                  >
                    <FiXCircle className="mr-2" />
                    Reject
                  </button>
                </>
              )}

              {userRole === 'admin' && reimbursement.status === 'approved' && (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
                >
                  <FiDollarSign className="mr-2" />
                  Mark as Paid
                </button>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <h4 className="text-lg font-medium text-gray-900 mb-2">{reimbursement.title}</h4>
            </div>

            <div className="flex items-start space-x-2">
              <FiTag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium capitalize">{reimbursement.category.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <FiDollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium text-lg">
                  {getCurrencySymbol(reimbursement.currency)}{reimbursement.amount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <FiCalendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Expense Date</p>
                <p className="font-medium">
                  {format(new Date(reimbursement.expenseDate), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <FiCalendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Applied Date</p>
                <p className="font-medium">
                  {format(new Date(reimbursement.appliedDate), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>

            {(userRole === 'manager' || userRole === 'admin') && (
              <div className="flex items-start space-x-2 col-span-2">
                <FiUser className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-medium">{reimbursement.employeeName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
              {reimbursement.description}
            </p>
          </div>

          {/* Receipt */}
          {reimbursement.receipt && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Receipt / Evidence</h4>
              <div className="flex items-center p-3 bg-primary-50 border border-primary-100 rounded-lg">
                <FiPaperclip className="text-primary-600 mr-2 w-5 h-5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-900 truncate">
                    {reimbursement.receiptOriginalName || 'Receipt File'}
                  </p>
                </div>
                <a
                  href={`${import.meta.env.VITE_API_URL || ''}${reimbursement.receipt}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 flex items-center text-sm font-medium text-primary-700 hover:text-primary-800"
                >
                  <FiExternalLink className="mr-1" />
                  View
                </a>
              </div>
            </div>
          )}

          {/* Approval Info */}
          {reimbursement.approvedBy && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800 flex items-center">
                <FiCheck className="mr-2" />
                Approved by {reimbursement.approvedBy.name} on{' '}
                {format(new Date(reimbursement.approvedDate), 'MMMM dd, yyyy')}
              </p>
            </div>
          )}

          {/* Payment Info */}
          {reimbursement.paidBy && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center">
                <FiDollarSign className="mr-2" />
                Paid by {reimbursement.paidBy.name} on{' '}
                {format(new Date(reimbursement.paidDate), 'MMMM dd, yyyy')}
                {reimbursement.transactionId && (
                  <> (Transaction ID: {reimbursement.transactionId})</>
                )}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {reimbursement.rejectionReason && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800 flex items-center">
                <FiXCircle className="mr-2" />
                Rejected: {reimbursement.rejectionReason}
              </p>
            </div>
          )}

          {/* Comments */}
          {reimbursement.comments && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Comments:</span> {reimbursement.comments}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Approve Reimbursement</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to approve this reimbursement request?
            </p>
            <textarea
              placeholder="Add comments (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="input-field mb-4"
              rows="3"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Reimbursement</h3>
            <textarea
              placeholder="Reason for rejection *"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-field mb-4"
              rows="3"
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Mark as Paid</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="input-field"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID (optional)
                </label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                  className="input-field"
                  placeholder="Enter transaction ID"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReimbursementDetails;