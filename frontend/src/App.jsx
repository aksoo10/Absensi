import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute, AdminRoute } from './components/PrivateRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import PegawaiLayout from './layouts/PegawaiLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PegawaiPage from './pages/admin/PegawaiPage';
import AkunPage from './pages/admin/AkunPage';
import AkunAdminPage from './pages/admin/AkunAdminPage';
import JadwalPage from './pages/admin/JadwalPage';
import AbsensiAdminPage from './pages/admin/AbsensiAdminPage';
import PengajuanAdminPage from './pages/admin/PengajuanAdminPage';
import LaporanPage from './pages/admin/LaporanPage';

// Pegawai pages
import DashboardPegawai from './pages/pegawai/DashboardPegawai';
import AbsensiPage from './pages/pegawai/AbsensiPage';
import PengajuanPegawaiPage from './pages/pegawai/PengajuanPegawaiPage';
import RiwayatPage from './pages/pegawai/RiwayatPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="pegawai" element={<PegawaiPage />} />
            <Route path="akun" element={<AkunPage />} />
            <Route path="akun-admin" element={<AkunAdminPage />} />
            <Route path="jadwal" element={<JadwalPage />} />
            <Route path="absensi" element={<AbsensiAdminPage />} />
            <Route path="pengajuan" element={<PengajuanAdminPage />} />
            <Route path="laporan" element={<LaporanPage />} />
          </Route>

          {/* Pegawai Routes */}
          <Route element={<PrivateRoute><PegawaiLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<DashboardPegawai />} />
            <Route path="/absensi" element={<AbsensiPage />} />
            <Route path="/pengajuan" element={<PengajuanPegawaiPage />} />
            <Route path="/riwayat" element={<RiwayatPage />} />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
