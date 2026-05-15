// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  //  NO trailing slash
  // baseURL: import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.19:8002',

  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://kodi-phase2.onrender.com/',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/* REQUEST INTERCEPTOR */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================
   RESPONSE INTERCEPTOR
============================ */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if it's already been retried or if it's a refresh token request
    if (
      (error.response?.status === 401 && !originalRequest._retry) ||
      (error.response?.status === 401 && !originalRequest.url?.includes('/token/refresh/'))
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.error('No refresh token available');
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Create a new instance for refresh to avoid infinite loop
        const refreshResponse = await api.post('/api/token/refresh/', {
          refresh: refreshToken,
        });

        const newAccessToken = refreshResponse.data.access;
        localStorage.setItem('accessToken', newAccessToken);

        // Update the default header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear all auth data and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;