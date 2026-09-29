import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import cache from '../lib/cache';
import authStorage from '../lib/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return authStorage.getUser();
  });

  // Fast boot: Don't block render with full spinner if user credentials are already cached
  const [loading, setLoading] = useState(() => {
    const token = authStorage.getToken();
    const saved = authStorage.getUser();
    return Boolean(token && !saved);
  });

  useEffect(() => {
    const token = authStorage.getToken();
    const saved = authStorage.getUser();

    if (token) {
      if (!saved) {
        // No cached user profile: fetch immediately
        api.get('/user')
          .then(({ data }) => {
            if (!authStorage.getToken()) return;
            setUser(data);
            authStorage.setUser(data);
          })
          .catch((err) => {
            if (err.response?.status === 401) {
              authStorage.clear();
              cache.clear();
              setUser(null);
            }
          })
          .finally(() => setLoading(false));
      } else {
        // User already cached: slight delay so critical page request executes first
        setLoading(false);
        const timer = setTimeout(() => {
          if (!authStorage.getToken()) return;
          api.get('/user')
            .then(({ data }) => {
              if (!authStorage.getToken()) return;
              setUser(data);
              authStorage.setUser(data);
            })
            .catch((err) => {
              if (err.response?.status === 401) {
                authStorage.clear();
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
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    setUser(data.user);

    // Pre-warm bootstrap in background immediately upon login so all menus are pre-cached
    const bootstrapUrl = data.user?.role === 'admin' ? '/bootstrap/admin' : '/bootstrap/pegawai';
    const dedupKey = data.user?.role === 'admin' ? 'admin_bootstrap' : 'pegawai_bootstrap';
    cache.fetchDedup(dedupKey, () => api.get(bootstrapUrl, {
      headers: { Authorization: `Bearer ${data.token}` }
    })).then(({ data: boot }) => {
      if (data.user?.role === 'admin') {
        if (boot.dashboard) cache.set('admin_dashboard', boot.dashboard);
        if (boot.absensi_today) cache.set('admin_absensi_today', boot.absensi_today);
        if (boot.pegawais) cache.set('admin_pegawais', boot.pegawais);
        if (boot.akun_pegawai) cache.set('admin_akun_pegawai', boot.akun_pegawai);
        if (boot.akun_admin) cache.set('admin_akun_admin', boot.akun_admin);
        if (boot.jadwals) cache.set('admin_jadwals', boot.jadwals);
        if (boot.pengajuans) cache.set('admin_pengajuans', boot.pengajuans);
        if (boot.notifikasi) cache.set('notifikasi', boot.notifikasi);
        if (boot.laporan && Array.isArray(boot.laporan)) {
          const m = new Date().getMonth() + 1;
          const y = new Date().getFullYear();
          cache.set(`admin_laporan_${m}_${y}`, boot.laporan);
        }
      } else {
        if (boot.dashboard_pegawai) cache.set('dashboard_pegawai', boot.dashboard_pegawai);
        if (boot.absensi_hari_ini) cache.set('absensi_hari_ini', boot.absensi_hari_ini);
        if (boot.pengajuans) cache.set('pengajuan_list', boot.pengajuans);
        if (boot.notifikasi) cache.set('notifikasi', boot.notifikasi);
      }
    }).catch(() => {});

    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/register', formData);
    return data;
  };

  const logout = async () => {
    const token = authStorage.getToken();

    // 1. Immediately wipe client credentials & cache so UI updates instantly
    authStorage.clear();
    cache.clear();
    setUser(null);

    // 2. Best-effort server token revocation in background
    if (token) {
      api.post('/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {
        // Silently ignore; client is already cleanly logged out
      });
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    authStorage.setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
