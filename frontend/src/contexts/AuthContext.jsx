import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import cache from '../lib/cache';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Fast boot: Don't block render with full spinner if user credentials are already cached
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    return Boolean(token && !saved);
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');

    if (token) {
      if (!saved) {
        // No cached user profile: fetch immediately
        api.get('/user')
          .then(({ data }) => {
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
          })
          .catch((err) => {
            if (err.response?.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              cache.clear();
              setUser(null);
            }
          })
          .finally(() => setLoading(false));
      } else {
        // User already cached: slight delay so critical page request executes first
        setLoading(false);
        const timer = setTimeout(() => {
          api.get('/user')
            .then(({ data }) => {
              setUser(data);
              localStorage.setItem('user', JSON.stringify(data));
            })
            .catch((err) => {
              if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                cache.clear();
                setUser(null);
              }
            });
        }, 1000);
        return () => clearTimeout(timer);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/register', formData);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      cache.clear();
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
