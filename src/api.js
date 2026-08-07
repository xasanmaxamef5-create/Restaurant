import axios from 'axios';
import API_BASE_URL from './apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the auth token in all requests
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

// Add a response interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Check if the error is a 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Clear user data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      
      // Redirect to login page by reloading the window.
      // The AuthContext will handle showing the Login component.
      window.location.reload();
    }
    return Promise.reject(error); // Propagate other errors
  }
);

export default api;