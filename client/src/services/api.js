import axios from 'axios';

// Rate limit event bus for UI synchronization
const rateLimitListeners = new Set();

export function onRateLimitUpdate(listener) {
  rateLimitListeners.add(listener);
  return () => rateLimitListeners.delete(listener);
}

function notifyRateLimit(headers, status, errorData) {
  const limit = headers['x-ratelimit-limit'] ? parseInt(headers['x-ratelimit-limit'], 10) : null;
  const remaining = headers['x-ratelimit-remaining'] !== undefined ? parseInt(headers['x-ratelimit-remaining'], 10) : null;
  const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after'], 10) : (errorData?.retryAfter || null);

  rateLimitListeners.forEach(fn => fn({
    limit,
    remaining,
    retryAfter,
    status,
    timestamp: Date.now()
  }));
}

const api = axios.create({
  baseURL: '/api'
});

// Request interceptor: attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bugvault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: monitor rate limit headers
api.interceptors.response.use(
  (response) => {
    notifyRateLimit(response.headers, response.status, null);
    return response;
  },
  (error) => {
    if (error.response) {
      notifyRateLimit(error.response.headers, error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('bugvault_token', res.data.token);
      localStorage.setItem('bugvault_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('bugvault_token');
    localStorage.removeItem('bugvault_user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('bugvault_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  getToken: () => {
    return localStorage.getItem('bugvault_token');
  }
};

export const profileService = {
  getProfile: async () => {
    const res = await api.get('/profile');
    return res.data;
  },
  getProfileById: async (id) => {
    const res = await api.get(`/profile/${id}`);
    return res.data;
  }
};

export const usersService = {
  getUsers: async (page = 1, limit = 10, search = '') => {
    const res = await api.get('/users', {
      params: { page, limit, search }
    });
    return res.data;
  }
};

export default api;
