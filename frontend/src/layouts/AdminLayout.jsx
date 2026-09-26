import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  FileText, LogOut, Building2, Menu, X, ChevronDown
} from 'lucide-react';

import NotificationDropdown from '../components/NotificationDropdown';

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
      { to: '/admin/jadwal', icon: Calendar, label: 'Jadwal Kerja' },
      { to: '/admin/pengajuan', icon: FileText, label: 'Pengajuan Cuti / Izin' },
      { to: '/admin/laporan', icon: FileText, label: 'Laporan & Rekap' },
    ]
  }
];

const routeBreadcrumbMap = {
  '/admin': 'Dashboard Overview',
  '/admin/pegawai': 'Manajemen Pegawai',
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
          <button className="nav-item logout-btn" onClick={handleLogout}>
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
                <div className="dropdown-menu">
                  <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text)' }}>{user?.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email}</div>
                  </div>
                  <button onClick={handleLogout} className="dropdown-item danger" style={{ marginTop: '4px' }}>
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
