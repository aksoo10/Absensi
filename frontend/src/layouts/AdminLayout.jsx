import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  FileText, LogOut, Building2, Menu, X, ChevronDown, UserCog, ShieldCheck
} from 'lucide-react';

import NotificationDropdown from '../components/NotificationDropdown';
import api from '../lib/api';
import cache from '../lib/cache';

const navSections = [
  {
    title: 'Menu Utama',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/admin/absensi', icon: ClipboardList, label: 'Monitoring Absensi' },
    ]
  },
  {
    title: 'Manajemen Data',
    items: [
      { to: '/admin/pegawai', icon: Users, label: 'Data Pegawai' },
      { to: '/admin/akun', icon: UserCog, label: 'Akun Pegawai' },
      { to: '/admin/akun-admin', icon: ShieldCheck, label: 'Akun Administrator' },
      { to: '/admin/jadwal', icon: Calendar, label: 'Jadwal Kerja' },
      { to: '/admin/pengajuan', icon: FileText, label: 'Pengajuan Cuti / Izin' },
      { to: '/admin/laporan', icon: FileText, label: 'Laporan & Rekap' },
    ]
  }
];

const routeBreadcrumbMap = {
  '/admin': 'Dashboard Overview',
  '/admin/pegawai': 'Manajemen Pegawai',
  '/admin/akun': 'Kelola Akun Pegawai',
  '/admin/akun-admin': 'Kelola Akun Administrator',
  '/admin/jadwal': 'Pengaturan Jadwal',
  '/admin/absensi': 'Monitoring Absensi Harian',
  '/admin/pengajuan': 'Verifikasi Pengajuan',
  '/admin/laporan': 'Rekapitulasi & Laporan',
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const activeBreadcrumb = routeBreadcrumbMap[location.pathname] || 'Admin Portal';

  const prefetchRoute = (to) => {
    try {
      if (to === '/admin' && !cache.get('admin_dashboard')) {
        api.get('/laporan/dashboard').then(({ data }) => cache.set('admin_dashboard', data)).catch(() => {});
      } else if (to === '/admin/absensi' && !cache.get('admin_absensi_today')) {
        const todayStr = new Date().toISOString().split('T')[0];
        api.get('/absensi', { params: { tanggal: todayStr } }).then(({ data }) => cache.set('admin_absensi_today', data.data || [])).catch(() => {});
      } else if (to === '/admin/pegawai' && !cache.get('admin_pegawais')) {
        api.get('/pegawai').then(({ data }) => cache.set('admin_pegawais', data.data || [])).catch(() => {});
      } else if (to === '/admin/akun' && !cache.get('admin_akun_pegawai')) {
        api.get('/users', { params: { role: 'pegawai' } }).then(({ data }) => cache.set('admin_akun_pegawai', data.data || [])).catch(() => {});
      } else if (to === '/admin/akun-admin' && !cache.get('admin_akun_admin')) {
        api.get('/users', { params: { role: 'admin' } }).then(({ data }) => cache.set('admin_akun_admin', data.data || [])).catch(() => {});
      } else if (to === '/admin/jadwal' && !cache.get('admin_jadwals')) {
        api.get('/jadwal').then(({ data }) => cache.set('admin_jadwals', data || [])).catch(() => {});
      } else if (to === '/admin/pengajuan' && !cache.get('admin_pengajuans')) {
        api.get('/pengajuan').then(({ data }) => cache.set('admin_pengajuans', data.data || [])).catch(() => {});
      } else if (to === '/admin/laporan') {
        const m = new Date().getMonth() + 1;
        const y = new Date().getFullYear();
        const key = `admin_laporan_${m}_${y}`;
        if (!cache.get(key)) {
          api.get('/laporan/absensi', { params: { bulan: m, tahun: y } }).then(({ data }) => cache.set(key, data.laporan || [])).catch(() => {});
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

  // Close profile dropdown when clicking outside
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
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon-wrap">
              <Building2 size={20} />
            </div>
            {sidebarOpen && (
              <div className="sidebar-logo-text">
                <span className="sidebar-logo-title">Bailangu Timur</span>
                <span className="sidebar-logo-subtitle">Portal Admin Presensi</span>
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
          {navSections.map((section, sIdx) => (
            <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {sidebarOpen && (
                <div className="sidebar-section-label">{section.title}</div>
              )}
              {section.items.map(({ to, icon: Icon, label, end }) => (
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
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="sidebar-user-preview">
              <div className="avatar avatar-sm">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name || 'Administrator'}</div>
                <div className="sidebar-user-role">Administrator</div>
              </div>
            </div>
          )}
          <button type="button" className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            {sidebarOpen && <span>Keluar Sistem</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-breadcrumb-wrap">
              <h2 className="page-breadcrumb">{activeBreadcrumb}</h2>
            </div>
          </div>

          <div className="topbar-right">
            <NotificationDropdown />
            <div className="profile-dropdown" ref={profileRef}>
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
                <div className="profile-info">
                  <span className="profile-name">{user?.name || 'Administrator'}</span>
                  <span className="profile-role">Administrator Desa</span>
                </div>
                <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
              </button>
              {profileOpen && (
                <div className="dropdown-menu" onMouseDown={(e) => e.stopPropagation()}>
                  <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text)' }}>{user?.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email}</div>
                  </div>
                  <NavLink
                    to="/admin/akun-admin"
                    className="dropdown-item"
                    onClick={() => setProfileOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                  >
                    <ShieldCheck size={15} /> Pengaturan Akun Admin
                  </NavLink>
                  <button type="button" onClick={handleLogout} className="dropdown-item danger" style={{ marginTop: '4px' }}>
                    <LogOut size={15} /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
