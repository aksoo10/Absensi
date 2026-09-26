import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, UserCheck, FileWarning,
  TrendingUp, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import api from '../../lib/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/laporan/dashboard')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const stats = [
    { label: 'Total Pegawai', value: data?.total_pegawai ?? 0, icon: Users, color: 'blue', action: () => navigate('/admin/pegawai') },
    { label: 'Hadir Hari Ini', value: data?.hadir_hari_ini ?? 0, icon: UserCheck, color: 'green', action: () => navigate('/admin/absensi') },
    { label: 'Terlambat', value: data?.terlambat_hari_ini ?? 0, icon: Clock, color: 'amber', action: null },
    { label: 'Pengajuan Pending', value: data?.pengajuan_pending ?? 0, icon: FileWarning, color: 'red', action: () => navigate('/admin/pengajuan') },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Admin</h1>
          <p className="page-desc">{data?.hari_ini}, {new Date(data?.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, color, action }) => (
          <div
            key={label}
            className={`stat-card stat-${color} ${action ? 'clickable' : ''}`}
            onClick={action}
          >
            <div className="stat-icon"><Icon size={24} /></div>
            <div className="stat-body">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><TrendingUp size={18} /> Tren Kehadiran 7 Hari Terakhir</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.grafik_mingguan ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hari" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <Legend />
              <Bar dataKey="hadir" name="Hadir" fill="var(--success)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="terlambat" name="Terlambat" fill="var(--warning)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="var(--danger)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
