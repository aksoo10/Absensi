import { useEffect, useState } from 'react';
import { UserCheck, Clock, Calendar, FileText, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

export default function DashboardPegawai() {
  const [data, setData] = useState(null);
  const [absensiHariIni, setAbsensiHariIni] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/laporan/dashboard-pegawai'),
      api.get('/absensi/hari-ini'),
    ])
      .then(([res1, res2]) => {
        setData(res1.data);
        setAbsensiHariIni(res2.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const stats = [
    { label: 'Hadir Bulan Ini', value: data?.bulan_ini?.hadir ?? 0, icon: UserCheck, color: 'green' },
    { label: 'Terlambat', value: data?.bulan_ini?.terlambat ?? 0, icon: Clock, color: 'amber' },
    { label: 'Izin & Sakit', value: (data?.bulan_ini?.izin ?? 0) + (data?.bulan_ini?.sakit ?? 0), icon: Calendar, color: 'blue' },
    { label: 'Pengajuan Pending', value: data?.bulan_ini?.pengajuan_pending ?? 0, icon: FileText, color: 'red' },
  ];

  const absensi = absensiHariIni?.absensi;
  const jadwal = absensiHariIni?.jadwal;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Selamat Datang, {data?.pegawai?.nama?.split(' ')[0]} 👋</h1>
          <p className="page-desc">{absensiHariIni?.hari}, {new Date(absensiHariIni?.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Status hari ini */}
      <div className="card today-card">
        <div className="card-body">
          <div className="today-header">
            <h3>Status Kehadiran Hari Ini</h3>
            {jadwal && (
              <div className="jadwal-info">
                <Clock size={14} /> Jam Kerja: {jadwal.jam_masuk} — {jadwal.jam_pulang}
              </div>
            )}
          </div>
          <div className="today-status">
            <div className={`status-item ${absensi?.jam_masuk ? 'done' : 'pending'}`}>
              <div className="status-dot" />
              <div>
                <div className="status-label">Absen Masuk</div>
                <div className="status-val">
                  {absensi?.jam_masuk ? (
                    <>
                      {absensi.jam_masuk}
                      {absensi.status_masuk === 'terlambat' && (
                        <span className="badge badge-warning ml-2">Terlambat {absensi.menit_terlambat} menit</span>
                      )}
                      {absensi.status_masuk === 'tepat_waktu' && (
                        <span className="badge badge-success ml-2"><CheckCircle size={11} /> Tepat Waktu</span>
                      )}
                    </>
                  ) : 'Belum absen'}
                </div>
              </div>
            </div>
            <div className="status-line" />
            <div className={`status-item ${absensi?.jam_pulang ? 'done' : 'pending'}`}>
              <div className="status-dot" />
              <div>
                <div className="status-label">Absen Pulang</div>
                <div className="status-val">{absensi?.jam_pulang || 'Belum absen'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`stat-card stat-${color}`}>
            <div className="stat-icon"><Icon size={24} /></div>
            <div className="stat-body">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Riwayat terbaru */}
      {data?.absensi_terbaru?.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Riwayat Absensi Terbaru</h3></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.absensi_terbaru.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                    <td>{a.jam_masuk || '-'}</td>
                    <td>{a.jam_pulang || '-'}</td>
                    <td>
                      {a.status_masuk && (
                        <span className={`badge ${a.status_masuk === 'tepat_waktu' ? 'badge-success' : 'badge-warning'}`}>
                          {a.status_masuk === 'tepat_waktu' ? 'Tepat Waktu' : `Terlambat ${a.menit_terlambat}m`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
