import axios from 'axios';
import authStorage from './authStorage';

// When deployed on Vercel with multiple services or using Vite proxy, BACKEND_URL is empty (relative /api).
// If an external backend is used, set VITE_BACKEND_URL in .env.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const api = axios.create({
  baseURL: BACKEND_URL ? `${BACKEND_URL}/api` : '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogoutReq = error.config?.url?.includes('/logout');
    if (error.response?.status === 401 && !isLogoutReq && !window.location.pathname.includes('/login')) {
      authStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
