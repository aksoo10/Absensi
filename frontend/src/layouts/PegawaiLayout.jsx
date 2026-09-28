import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Clock, FileText, History,
  LogOut, Building2, Menu, X, ChevronDown
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import api from '../lib/api';
import cache from '../lib/cache';

const pegawaiNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Utama', end: true },
  { to: '/absensi', icon: Clock, label: 'Presensi Harian' },
  { to: '/pengajuan', icon: FileText, label: 'Pengajuan Cuti / Izin' },
  { to: '/riwayat', icon: History, label: 'Riwayat Kehadiran' },
];

const routeBreadcrumbMap = {
  '/dashboard': 'Dashboard Pegawai',
  '/absensi': 'Presensi Harian',
  '/pengajuan': 'Pengajuan Ketidakhadiran',
  '/riwayat': 'Riwayat & Rekap Saya',
};

export default function PegawaiLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const activeBreadcrumb = routeBreadcrumbMap[location.pathname] || 'Portal Pegawai';

  // Pre-warm critical pages cache quietly after initial mount for 0ms transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cache.get('pengajuan_list') === null) {
        cache.fetchDedup('pengajuan_list', () => api.get('/pengajuan')).then(({ data }) => {
          cache.set('pengajuan_list', data.data || []);
        }).catch(() => {});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const prefetchRoute = (to) => {
    try {
      if (to === '/dashboard' && !cache.get('dashboard_pegawai')) {
        api.get('/laporan/dashboard-pegawai').then(({ data }) => {
          cache.set('dashboard_pegawai', data);
          if (data.hari_ini) cache.set('absensi_hari_ini', data.hari_ini);
        }).catch(() => {});
      } else if (to === '/absensi' && !cache.get('absensi_hari_ini')) {
        api.get('/absensi/hari-ini').then(({ data }) => {
          cache.set('absensi_hari_ini', data);
        }).catch(() => {});
      } else if (to === '/pengajuan' && cache.get('pengajuan_list') === null) {
        cache.fetchDedup('pengajuan_list', () => api.get('/pengajuan')).then(({ data }) => {
          cache.set('pengajuan_list', data.data || []);
        }).catch(() => {});
      } else if (to === '/riwayat') {
        const m = new Date().getMonth() + 1;
        const y = new Date().getFullYear();
        const key = `riwayat_${m}_${y}_1`;
        if (!cache.get(key)) {
          api.get('/absensi', { params: { bulan: m, tahun: y, page: 1 } }).then(({ data }) => {
            cache.set(key, data);
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleLogout = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setProfileOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);


  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <aside className="sidebar sidebar-pegawai">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon-wrap" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <Building2 size={20} />
            </div>
            {sidebarOpen && (
              <div className="sidebar-logo-text">
                <span className="sidebar-logo-title">Bailangu Timur</span>
                <span className="sidebar-logo-subtitle" style={{ color: '#34d399' }}>Portal Pegawai</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Perkecil Menu' : 'Perbesar Menu'}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarOpen && (
            <div className="sidebar-section-label">Aktivitas Pegawai</div>
          )}
          {pegawaiNavItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={!sidebarOpen ? label : undefined}
              onMouseEnter={() => prefetchRoute(to)}
              onTouchStart={() => prefetchRoute(to)}
            >
              <Icon size={19} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="sidebar-user-preview">
              <div className="avatar avatar-sm avatar-pegawai">
                {user?.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name || 'Pegawai'}</div>
                <div className="sidebar-user-role" style={{ color: '#34d399' }}>Aparatur Desa</div>
              </div>
            </div>
          )}
          <button type="button" className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            {sidebarOpen && <span>Keluar Akun</span>}
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-breadcrumb-wrap">
              <h2 className="page-breadcrumb">{activeBreadcrumb}</h2>
            </div>
          </div>

          <div className="topbar-right">
            <NotificationDropdown />
            <div className="profile-dropdown" ref={profileRef}>
              <button type="button" className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="avatar avatar-pegawai">{user?.name?.[0]?.toUpperCase() || 'P'}</div>
                <div className="profile-info">
                  <span className="profile-name">{user?.name}</span>
                  <span className="profile-role">Pegawai Desa</span>
                </div>
                <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
              </button>
              {profileOpen && (
                <div className="dropdown-menu" onMouseDown={(e) => e.stopPropagation()}>
                  <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text)' }}>{user?.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email}</div>
                  </div>
                  <button type="button" onClick={handleLogout} className="dropdown-item danger" style={{ marginTop: '4px' }}>
                    <LogOut size={15} /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
