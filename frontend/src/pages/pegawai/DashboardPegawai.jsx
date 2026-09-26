import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, Clock, Calendar, FileText, CheckCircle,
  AlertCircle, ArrowRight, ShieldCheck, Sparkles, LogIn
} from 'lucide-react';
import api from '../../lib/api';

export default function DashboardPegawai() {
  const [data, setData] = useState(null);
  const [absensiHariIni, setAbsensiHariIni] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    { label: 'Hadir Bulan Ini', value: data?.bulan_ini?.hadir ?? 0, subtext: 'Hari kerja tercatat', icon: UserCheck, color: 'green' },
    { label: 'Terlambat', value: data?.bulan_ini?.terlambat ?? 0, subtext: 'Keterlambatan bulan ini', icon: Clock, color: 'amber' },
    { label: 'Izin & Sakit', value: (data?.bulan_ini?.izin ?? 0) + (data?.bulan_ini?.sakit ?? 0), subtext: 'Disetujui admin', icon: Calendar, color: 'blue' },
    { label: 'Pengajuan Pending', value: data?.bulan_ini?.pengajuan_pending ?? 0, subtext: 'Menunggu persetujuan', icon: FileText, color: 'red' },
  ];

  const absensi = absensiHariIni?.absensi;
  const jadwal = absensiHariIni?.jadwal;
  const pegawaiNama = data?.pegawai?.nama || 'Pegawai';
  const pegawaiJabatan = data?.pegawai?.jabatan || 'Aparatur Desa';

  const formattedDate = absensiHariIni?.tanggal
    ? new Date(absensiHariIni.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="page">
      {/* Hero Welcome Card */}
      <div className="hero-banner" style={{ background: 'linear-gradient(135deg, #090d16 0%, #064e3b 55%, #047857 100%)' }}>
        <div>
          <div className="hero-badge-tag" style={{ color: '#6ee7b7', borderColor: 'rgba(110, 231, 183, 0.3)' }}>
            <Sparkles size={13} />
            Portal Layanan Mandiri Pegawai
          </div>
          <h1 className="hero-banner-title">
            Selamat Datang, {pegawaiNama} 👋
          </h1>
          <p className="hero-banner-subtitle">
            {pegawaiJabatan} &bull; Pemerintah Desa Bailangu Timur. Hari ini: <strong>{formattedDate}</strong>
          </p>
        </div>
        <div style={{ zIndex: 2 }}>
          <button
            onClick={() => navigate('/absensi')}
            className="btn btn-primary"
            style={{
              background: '#ffffff',
              color: '#065f46',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              fontWeight: '700',
              padding: '12px 22px'
            }}
          >
            <LogIn size={17} /> Catat Presensi Harian
          </button>
        </div>
      </div>

      {/* Status Kehadiran Hari Ini */}
      <div className="card today-card">
        <div className="card-body">
          <div className="today-header">
            <div>
              <h3>Status Presensi Hari Ini</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Periksa catatan jam masuk dan jam pulang Anda untuk hari ini
              </p>
            </div>
            {jadwal && (
              <div className="jadwal-info">
                <Clock size={15} />
                <span>Jam Kerja: {jadwal.jam_masuk} — {jadwal.jam_pulang} WIB</span>
              </div>
            )}
          </div>

          <div className="today-status">
            {/* Absen Masuk Item */}
            <div className={`status-item ${absensi?.jam_masuk ? 'done' : 'pending'}`}>
              <div className="status-dot" />
              <div>
                <div className="status-label">Presensi Masuk</div>
                <div className="status-val">
                  {absensi?.jam_masuk ? (
                    <>
                      <span>{absensi.jam_masuk} WIB</span>
                      {absensi.status_masuk === 'terlambat' && (
                        <span className="badge badge-warning ml-2">Terlambat {absensi.menit_terlambat} menit</span>
                      )}
                      {absensi.status_masuk === 'tepat_waktu' && (
                        <span className="badge badge-success ml-2"><CheckCircle size={12} /> Tepat Waktu</span>
                      )}
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Belum melakukan absen masuk</span>
                  )}
                </div>
              </div>
            </div>

            <div className="status-line" />

            {/* Absen Pulang Item */}
            <div className={`status-item ${absensi?.jam_pulang ? 'done' : 'pending'}`}>
              <div className="status-dot" />
              <div>
                <div className="status-label">Presensi Pulang</div>
                <div className="status-val">
                  {absensi?.jam_pulang ? (
                    <>
                      <span>{absensi.jam_pulang} WIB</span>
                      <span className="badge badge-success ml-2"><CheckCircle size={12} /> Selesai</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                      {absensi?.jam_masuk ? 'Menunggu jam pulang kerja' : 'Lakukan absen masuk terlebih dahulu'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Stats Cards */}
      <div className="stats-grid">
        {stats.map(({ label, value, subtext, icon: Icon, color }) => (
          <div key={label} className={`stat-card stat-${color}`}>
            <div className="stat-icon"><Icon size={26} /></div>
            <div className="stat-body">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
                {subtext}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Riwayat Absensi Terbaru */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={18} />
            Riwayat Presensi Terbaru
          </h3>
          <button
            onClick={() => navigate('/riwayat')}
            className="btn btn-secondary btn-sm"
          >
            Lihat Semua Riwayat <ArrowRight size={14} />
          </button>
        </div>
        <div className="table-wrapper">
          {(!data?.absensi_terbaru || data.absensi_terbaru.length === 0) ? (
            <div className="empty-row">Belum ada catatan presensi sebelumnya</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jam Masuk</th>
                  <th>Jam Pulang</th>
                  <th>Status Kehadiran</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {data.absensi_terbaru.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="font-semibold">
                        {new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td>{a.jam_masuk ? `${a.jam_masuk} WIB` : '-'}</td>
                    <td>{a.jam_pulang ? `${a.jam_pulang} WIB` : '-'}</td>
                    <td>
                      {a.status_masuk === 'tepat_waktu' && (
                        <span className="badge badge-success"><CheckCircle size={12} /> Tepat Waktu</span>
                      )}
                      {a.status_masuk === 'terlambat' && (
                        <span className="badge badge-warning"><Clock size={12} /> Terlambat {a.menit_terlambat}m</span>
                      )}
                      {!a.status_masuk && '-'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {a.jam_pulang ? 'Presensi lengkap' : a.jam_masuk ? 'Belum absen pulang' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
