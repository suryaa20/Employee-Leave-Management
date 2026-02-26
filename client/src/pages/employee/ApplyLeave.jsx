import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { leaveAPI } from '../../services/api';
import { LEAVE_TYPES } from '../../utils/constants';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { FiCalendar, FiClock, FiFileText, FiSend } from 'react-icons/fi';

const ApplyLeave = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'annual',
    fromDate: format(new Date(), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateDays = () => {
    const from = new Date(formData.fromDate);
    const to = new Date(formData.toDate);
    return differenceInDays(to, from) + 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const days = calculateDays();
    
    // Check leave balance
    if (formData.leaveType !== 'unpaid') {
      const balance = user?.leaveBalance?.[formData.leaveType] || 0;
      if (days > balance) {
        toast.error(`Insufficient ${formData.leaveType} leave balance. Available: ${balance} days`);
        return;
      }
    }

    setLoading(true);
    try {
      await leaveAPI.applyLeave(formData);
      toast.success('Leave application submitted successfully!');
      navigate('/employee/leave-history');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply for leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Apply for Leave</h1>
        <p className="text-gray-600 mt-1">Submit a new leave application</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {LEAVE_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`cursor-pointer p-4 border rounded-lg text-center transition-all ${
                    formData.leaveType === type.value
                      ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="leaveType"
                    value={type.value}
                    checked={formData.leaveType === type.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="fromDate"
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleChange}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="pl-10 input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="toDate"
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleChange}
                  min={formData.fromDate}
                  className="pl-10 input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Days Calculation */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Days:</span>
              <span className="text-2xl font-bold text-primary-600">{calculateDays()} days</span>
            </div>
            {formData.leaveType !== 'unpaid' && (
              <p className="text-sm text-gray-500 mt-1">
                Available balance: {user?.leaveBalance?.[formData.leaveType] || 0} days
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Leave
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FiFileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="reason"
                name="reason"
                rows="4"
                value={formData.reason}
                onChange={handleChange}
                className="pl-10 input-field"
                placeholder="Please provide a detailed reason for your leave application..."
                required
                minLength={10}
              ></textarea>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters. {formData.reason.length}/500
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend className="mr-2" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;