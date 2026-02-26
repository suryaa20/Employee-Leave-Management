import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { reimbursementAPI } from '../../services/api';
import { REIMBURSEMENT_CATEGORIES, CURRENCIES } from '../../utils/constants';
import { FiSave, FiX, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ReimbursementForm = ({ initialData = null, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'travel',
    amount: initialData?.amount || '',
    currency: initialData?.currency || 'USD',
    expenseDate: initialData?.expenseDate
      ? new Date(initialData.expenseDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }
      setReceiptFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    if (formData.description.length < 10) {
      toast.error('Description must be at least 10 characters');
      return false;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return false;
    }
    if (formData.amount > 100000) {
      toast.error('Amount cannot exceed 100,000');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (receiptFile) {
        data.append('receipt', receiptFile);
      }

      if (initialData) {
        await reimbursementAPI.updateReimbursement(initialData._id, data);
        toast.success('Reimbursement updated successfully!');
      } else {
        await reimbursementAPI.submitReimbursement(data);
        toast.success('Reimbursement submitted successfully!');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/employee/reimbursements');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit reimbursement');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoryValue) => {
    const category = REIMBURSEMENT_CATEGORIES.find(c => c.value === categoryValue);
    return category?.icon || '📦';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFileText className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength={100}
            className="pl-10 input-field"
            placeholder="e.g., Business trip to Dubai, Office supplies purchase"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formData.title.length}/100 characters
        </p>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {REIMBURSEMENT_CATEGORIES.map((category) => (
            <label
              key={category.value}
              className={`cursor-pointer p-3 border rounded-lg text-center transition-all ${formData.category === category.value
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-primary-300'
                }`}
            >
              <input
                type="radio"
                name="category"
                value={category.value}
                checked={formData.category === category.value}
                onChange={handleChange}
                className="sr-only"
                required
              />
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-xs font-medium text-gray-900">{category.label}</div>
            </label>
          ))}
        </div>
      </div>

      {/* Amount and Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiDollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0.01"
              max="100000"
              step="0.01"
              className="pl-10 input-field"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency <span className="text-red-500">*</span>
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            required
            className="input-field"
          >
            {CURRENCIES.map(currency => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Date */}
      <div>
        <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-1">
          Expense Date <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiCalendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            id="expenseDate"
            name="expenseDate"
            value={formData.expenseDate}
            onChange={handleChange}
            required
            max={new Date().toISOString().split('T')[0]}
            className="pl-10 input-field"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Date when the expense occurred
        </p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="4"
          maxLength={500}
          className="input-field"
          placeholder="Provide details about this expense. Include purpose, vendors, etc."
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Minimum 10 characters</span>
          <span>{formData.description.length}/500 characters</span>
        </div>
      </div>

      {/* Receipt Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receipt / Proof of Expense
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
          <div className="space-y-1 text-center">
            {receiptPreview ? (
              <div className="mb-4 relative inline-block">
                <img src={receiptPreview} alt="Receipt preview" className="h-32 w-auto rounded-lg shadow-sm" />
                <button
                  type="button"
                  onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ) : receiptFile ? (
              <div className="mb-4 flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                <FiFileText className="w-8 h-8 text-primary-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">{receiptFile.name}</span>
                <button
                  type="button"
                  onClick={() => setReceiptFile(null)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
            )}

            <div className="flex text-sm text-gray-600 justify-center">
              <label htmlFor="receipt" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                <span>{receiptFile ? 'Change file' : 'Upload a file'}</span>
                <input
                  id="receipt"
                  name="receipt"
                  type="file"
                  className="sr-only"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </label>
              {!receiptFile && <p className="pl-1">or drag and drop</p>}
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, JPEG or PDF up to 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel || (() => navigate(-1))}
          className="btn-secondary flex items-center"
        >
          <FiX className="mr-2" />
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
              {initialData ? 'Updating...' : 'Submitting...'}
            </>
          ) : (
            <>
              <FiSave className="mr-2" />
              {initialData ? 'Update Reimbursement' : 'Submit Reimbursement'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ReimbursementForm;