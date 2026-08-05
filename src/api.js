import axios from 'axios';
import API_BASE_URL from './apiConfig';

// Create a single, configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to automatically add the token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // This will trigger the logout logic in AuthContext and redirect to login
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;