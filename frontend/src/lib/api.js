import axios from 'axios';
import authStorage from './authStorage';

export const BACKEND_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
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
