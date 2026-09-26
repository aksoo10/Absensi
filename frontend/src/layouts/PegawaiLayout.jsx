import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Clock, FileText, History,
  LogOut, Building2, Menu, X, ChevronDown, Bell
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';

const pegawaiNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/absensi', icon: Clock, label: 'Absensi' },
  { to: '/pengajuan', icon: FileText, label: 'Pengajuan' },
  { to: '/riwayat', icon: History, label: 'Riwayat' },
];

export default function PegawaiLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <aside className="sidebar sidebar-pegawai">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Building2 size={24} />
            {sidebarOpen && <span>Absensi Desa</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {pegawaiNavItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-breadcrumb">Portal Pegawai</h2>
          </div>
          <div className="topbar-right">
            <NotificationDropdown />
            <div className="profile-dropdown">
              <button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="avatar avatar-pegawai">{user?.name?.[0]?.toUpperCase()}</div>
                <div className="profile-info">
                  <span className="profile-name">{user?.name}</span>
                  <span className="profile-role">Pegawai</span>
                </div>
                <ChevronDown size={16} />
              </button>
              {profileOpen && (
                <div className="dropdown-menu">
                  <button onClick={handleLogout} className="dropdown-item danger">
                    <LogOut size={16} /> Keluar
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
