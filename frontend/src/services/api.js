import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create configured Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Bearer Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error and Token Expiry Handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // If 401 Unauthorized, token has expired or is invalid
      if (error.response.status === 401 && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));
      }
      // Return server-provided error payload
      return Promise.reject(error.response.data || { message: error.message });
    }
    return Promise.reject({ message: 'Network or server error. Please ensure the backend is running.' });
  }
);

// Auth Service
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// Book Service
export const bookService = {
  getBooks: (params) => api.get('/books', { params }),
  getBookById: (id) => api.get(`/books/${id}`),
  createBook: (data) => api.post('/books', data),
  updateBook: (id, data) => api.put(`/books/${id}`, data),
  deleteBook: (id) => api.delete(`/books/${id}`),
};

// Member Service
export const memberService = {
  getMembers: (params) => api.get('/members', { params }),
  getMemberById: (id) => api.get(`/members/${id}`),
  createMember: (data) => api.post('/members', data),
  updateMember: (id, data) => api.put(`/members/${id}`, data),
  deleteMember: (id) => api.delete(`/members/${id}`),
};

// Issue and Return Service
export const issueService = {
  getIssues: (params) => api.get('/issues', { params }),
  getIssueById: (id) => api.get(`/issues/${id}`),
  createIssue: (data) => api.post('/issues', data),
  returnIssue: (id, data) => api.put(`/issues/${id}/return`, data || {}),
};

// Dashboard Service
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
