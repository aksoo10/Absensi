import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  FileText, LogOut, Building2, Menu, X, Bell, ChevronDown
} from 'lucide-react';

import NotificationDropdown from '../components/NotificationDropdown';

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/pegawai', icon: Users, label: 'Pegawai' },
  { to: '/admin/jadwal', icon: Calendar, label: 'Jadwal Kerja' },
  { to: '/admin/absensi', icon: ClipboardList, label: 'Absensi' },
  { to: '/admin/pengajuan', icon: FileText, label: 'Pengajuan' },
  { to: '/admin/laporan', icon: FileText, label: 'Laporan' },
];

export default function AdminLayout() {
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
      {/* Sidebar */}
      <aside className="sidebar">
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
          {adminNavItems.map(({ to, icon: Icon, label, end }) => (
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

      {/* Main Content */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-breadcrumb">Admin</h2>
          </div>
          <div className="topbar-right">
            <NotificationDropdown />
            <div className="profile-dropdown">
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
                <div className="profile-info">
                  <span className="profile-name">{user?.name}</span>
                  <span className="profile-role">Administrator</span>
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

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
