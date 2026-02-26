import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

// Leave APIs
export const leaveAPI = {
  applyLeave: (data) => api.post('/leaves', data),
  getMyLeaves: (params) => api.get('/leaves/my-leaves', { params }),
  getAllLeaves: (params) => api.get('/leaves', { params }),
  getPendingLeaves: () => api.get('/leaves/pending'),
  updateLeaveStatus: (id, data) => api.put(`/leaves/${id}/status`, data),
  cancelLeave: (id) => api.put(`/leaves/${id}/cancel`),
  getLeaveStats: () => api.get('/leaves/stats')
};

// User APIs
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  getUserStats: () => api.get('/users/stats'),
  exportUsers: () => api.get('/users/export')
};

// Reimbursement APIs
export const reimbursementAPI = {
  submitReimbursement: (data) => api.post('/reimbursements', data),
  getAllReimbursements: (params) => api.get('/reimbursements', { params }),
  getMyReimbursements: (params) => api.get('/reimbursements/my-reimbursements', { params }),
  getPendingReimbursements: () => api.get('/reimbursements/pending'),
  getReimbursement: (id) => api.get(`/reimbursements/${id}`),
  updateStatus: (id, data) => api.put(`/reimbursements/${id}/status`, data),
  markAsPaid: (id, data) => api.put(`/reimbursements/${id}/pay`, data),
  updateReimbursement: (id, data) => api.put(`/reimbursements/${id}`, data),
  deleteReimbursement: (id) => api.delete(`/reimbursements/${id}`),
  getStats: () => api.get('/reimbursements/stats')
};

export default api;