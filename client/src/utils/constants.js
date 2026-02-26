// Leave Types
export const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave', icon: '🗓️', color: 'blue' },
  { value: 'sick', label: 'Sick Leave', icon: '🤒', color: 'green' },
  { value: 'casual', label: 'Casual Leave', icon: '🎯', color: 'purple' },
  { value: 'unpaid', label: 'Unpaid Leave', icon: '💰', color: 'orange' }
];

// Leave Status
export const LEAVE_STATUS = {
  pending: { label: 'Pending', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: '⏳' },
  approved: { label: 'Approved', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: '✅' },
  rejected: { label: 'Rejected', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: '❌' },
  cancelled: { label: 'Cancelled', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '❌' }
};

// Reimbursement categories
export const REIMBURSEMENT_CATEGORIES = [
  { value: 'travel', label: 'Travel', icon: '✈️', color: 'blue' },
  { value: 'food', label: 'Food & Meals', icon: '🍔', color: 'green' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨', color: 'purple' },
  { value: 'medical', label: 'Medical', icon: '🏥', color: 'red' },
  { value: 'office_supplies', label: 'Office Supplies', icon: '📎', color: 'yellow' },
  { value: 'training', label: 'Training & Education', icon: '📚', color: 'indigo' },
  { value: 'other', label: 'Other', icon: '📦', color: 'gray' }
];

// Currencies
export const CURRENCIES = [
  { value: 'INR', label: 'INR (₹)', symbol: '₹' }
];

// Reimbursement status
export const REIMBURSEMENT_STATUS = {
  pending: { label: 'Pending', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: '⏳' },
  approved: { label: 'Approved', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: '✅' },
  rejected: { label: 'Rejected', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: '❌' },
  paid: { label: 'Paid', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: '💰' }
};

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' }
];

// User Roles
export const USER_ROLES = [
  { value: 'employee', label: 'Employee', color: 'blue' },
  { value: 'manager', label: 'Manager', color: 'green' },
  { value: 'admin', label: 'Admin', color: 'purple' }
];

// Departments
export const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'Research & Development',
  'General'
];