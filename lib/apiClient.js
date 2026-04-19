/**
 * lib/apiClient.js
 * Axios instance pre-configured with base URL and auto JWT injection.
 * Used by all frontend components to call app API routes.
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach JWT token from localStorage on every request
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('wh_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Let browser set the boundary for FormData automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401/403 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wh_token');
        localStorage.removeItem('wh_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
