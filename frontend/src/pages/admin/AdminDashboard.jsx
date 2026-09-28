import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, UserCheck, FileWarning,
  TrendingUp, CheckCircle, XCircle, AlertCircle,
  ArrowRight, Shield, Calendar, UserX, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import api from '../../lib/api';
import cache from '../../lib/cache';

// Custom Tooltip for Recharts
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
        fontSize: '12.5px',
        minWidth: '150px'
      }}>
        <div style={{ fontWeight: '700', marginBottom: '8px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
          Hari: {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: entry.color, fontWeight: '600', marginBottom: '3px' }}>
            <span>{entry.name}:</span>
            <span style={{ color: '#0f172a' }}>{entry.value} pegawai</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AdminDashboard() {
  const cached = cache.get('admin_dashboard');
  const [data, setData] = useState(() => cached);
  const [loading, setLoading] = useState(() => cached === null);
  const navigate = useNavigate();

  useEffect(() => {
    cache.fetchDedup('admin_dashboard', () => api.get('/laporan/dashboard'))
      .then(({ data }) => {
        setData(data);
        cache.set('admin_dashboard', data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) return <div className="page-loader"><div className="spinner" /></div>;

  const total = data?.total_pegawai || 0;
  const hadir = data?.hadir_hari_ini || 0;
  const terlambat = data?.terlambat_hari_ini || 0;
  const pending = data?.pengajuan_pending || 0;
  const tidakHadir = data?.tidak_hadir_hari_ini || 0;
  const kehadiranPercent = total > 0 ? Math.round((hadir / total) * 100) : 0;
  const tepatWaktu = Math.max(0, hadir - terlambat);

  const stats = [
    {
      label: 'Total Pegawai Aktif',
      value: total,
      subtext: 'Terdaftar di instansi',
      icon: Users,
      color: 'blue',
      action: () => navigate('/admin/pegawai')
    },
    {
      label: 'Hadir Hari Ini',
      value: hadir,
      subtext: `${kehadiranPercent}% tingkat presensi`,
      icon: UserCheck,
      color: 'green',
      action: () => navigate('/admin/absensi')
    },
    {
      label: 'Terlambat Hari Ini',
      value: terlambat,
      subtext: 'Melebihi toleransi jadwal',
      icon: Clock,
      color: 'amber',
      action: () => navigate('/admin/absensi')
    },
    {
      label: 'Pengajuan Pending',
      value: pending,
      subtext: pending > 0 ? 'Perlu tindakan verifikasi' : 'Semua telah diverifikasi',
      icon: FileWarning,
      color: 'red',
      action: () => navigate('/admin/pengajuan')
    },
  ];

  const formattedDate = data?.tanggal
    ? new Date(data.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="page">
      {/* Hero Welcome Banner */}
      <div className="hero-banner">
        <div>
          <div className="hero-badge-tag">
            <Shield size={12} />
            Panel Eksekutif Presensi
          </div>
          <h1 className="hero-banner-title">
            Selamat Datang di Portal Presensi Desa Bailangu Timur
          </h1>
          <p className="hero-banner-subtitle">
            Pantau kehadiran aparatur dan pegawai desa secara real-time. Hari ini: <strong>{data?.hari_ini}, {formattedDate}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', zIndex: 2 }}>
          <button
            onClick={() => navigate('/admin/absensi')}
            className="btn btn-primary"
            style={{ background: '#ffffff', color: 'var(--primary)', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)' }}
          >
            <Activity size={16} /> Pantau Absensi
          </button>
          <button
            onClick={() => navigate('/admin/laporan')}
            className="btn btn-secondary"
            style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)' }}
          >
            <Calendar size={16} /> Unduh Laporan
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        {stats.map(({ label, value, subtext, icon: Icon, color, action }) => (
          <div
            key={label}
            className={`stat-card stat-${color} ${action ? 'clickable' : ''}`}
            onClick={action}
          >
            <div className="stat-icon"><Icon size={26} /></div>
            <div className="stat-body" style={{ flex: 1 }}>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
                {subtext}
              </div>
            </div>
            {action && (
              <div style={{ color: 'var(--text-light)', opacity: 0.6 }}>
                <ArrowRight size={16} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grid: Chart & Today's Attendance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Weekly Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} />
              Tren Kehadiran 7 Hari Terakhir
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
              Data otomatis diperbarui harian
            </span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data?.grafik_mingguan ?? []}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="hari"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '14px', fontSize: '12.5px' }}
                  iconType="circle"
                />
                <Bar dataKey="hadir" name="Hadir" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="terlambat" name="Terlambat" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Summary Card: Kehadiran Hari Ini */}
        <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Activity size={18} />
              Ringkasan Hari Ini
            </h3>
          </div>
          <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Progress Bar Rate */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Tingkat Kehadiran</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>{kehadiranPercent}%</span>
                </div>
                <div style={{ height: '9px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${kehadiranPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                    borderRadius: '999px',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>

              {/* Status Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: '8px', fontSize: '13px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={15} style={{ color: 'var(--success)' }} /> Tepat Waktu
                  </span>
                  <strong>{tepatWaktu} orang</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: '8px', fontSize: '13px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Clock size={15} style={{ color: 'var(--warning)' }} /> Terlambat
                  </span>
                  <strong>{terlambat} orang</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: '8px', fontSize: '13px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <UserX size={15} style={{ color: 'var(--danger)' }} /> Belum / Tidak Hadir
                  </span>
                  <strong>{tidakHadir} orang</strong>
                </div>
              </div>
            </div>

            {/* Quick Link Footer */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => navigate('/admin/absensi')}
                style={{ fontSize: '12.5px' }}
              >
                Lihat Detail Presensi Hari Ini
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
