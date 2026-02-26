import { format, formatDistance } from 'date-fns';

/**
 * Format date to a readable string
 * @param {Date|string} date 
 * @param {string} formatStr 
 * @returns {string}
 */
export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  if (!date) return 'N/A';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Get relative time from now
 * @param {Date|string} date 
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  try {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  } catch (error) {
    return '';
  }
};

/**
 * Format currency amount
 * @param {number} amount 
 * @param {string} currency 
 * @returns {string}
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount || 0);
};

/**
 * Get status badge color classes
 * @param {string} status 
 * @returns {string}
 */
export const getStatusColor = (status) => {
  const s = status?.toLowerCase();
  switch (s) {
    case 'approved':
    case 'paid':
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
    case 'pending':
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
    case 'rejected':
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

/**
 * Capitalize first letter of a string
 * @param {string} str 
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Calculate duration between two dates
 * @param {Date|string} from 
 * @param {Date|string} to 
 * @returns {number}
 */
export const calculateDays = (from, to) => {
  const start = new Date(from);
  const end = new Date(to);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};
