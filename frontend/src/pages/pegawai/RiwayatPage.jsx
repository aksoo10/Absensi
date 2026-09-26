import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, UserCheck, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';

export default function RiwayatPage() {
  const [absensis, setAbsensis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const fetchRiwayat = () => {
    setLoading(true);
    api.get('/absensi', { params: { bulan, tahun, page } })
      .then(({ data }) => {
        setAbsensis(data.data || []);
        setMeta(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRiwayat();
  }, [bulan, tahun, page]);

  const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const totalHadir = absensis.filter(a => a.jam_masuk).length;
  const totalTepatWaktu = absensis.filter(a => a.status_masuk === 'tepat_waktu').length;
  const totalTerlambat = absensis.filter(a => a.status_masuk === 'terlambat').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Riwayat & Rekap Presensi Saya</h1>
          <p className="page-desc">Rekam jejak kehadiran harian dan catatan kedisiplinan kerja Anda</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text)' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                <span>Pilih Bulan & Tahun:</span>
              </div>
              <select
                className="form-input w-auto"
                value={bulan}
                onChange={(e) => { setBulan(Number(e.target.value)); setPage(1); }}
              >
                {bulanNames.map((b, i) => (
                  <option key={i} value={i + 1}>{b}</option>
                ))}
              </select>
              <select
                className="form-input w-auto"
                value={tahun}
                onChange={(e) => { setTahun(Number(e.target.value)); setPage(1); }}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
              Periode: <strong>{bulanNames[bulan - 1]} {tahun}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card stat-blue">
          <div className="stat-icon"><UserCheck size={24} /></div>
          <div className="stat-body">
            <div className="stat-value">{totalHadir} Hari</div>
            <div className="stat-label">Hadir Pada Bulan Ini</div>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon"><CheckCircle size={24} /></div>
          <div className="stat-body">
            <div className="stat-value">{totalTepatWaktu} Hari</div>
            <div className="stat-label">Kehadiran Tepat Waktu</div>
          </div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-body">
            <div className="stat-value">{totalTerlambat} Kali</div>
            <div className="stat-label">Tercatat Terlambat</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={18} />
            Daftar Presensi {bulanNames[bulan - 1]} {tahun}
          </h3>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="table-loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hari & Tanggal</th>
                  <th>Jam Masuk</th>
                  <th>Jam Pulang</th>
                  <th>Status Kedisiplinan</th>
                  <th>Keterlambatan</th>
                </tr>
              </thead>
              <tbody>
                {absensis.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-row">
                      Belum ada catatan presensi pada periode {bulanNames[bulan - 1]} {tahun}
                    </td>
                  </tr>
                ) : (
                  absensis.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>
                          {new Date(a.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td>
                        {a.jam_masuk ? (
                          <span style={{ fontWeight: '700', color: 'var(--text)' }}>
                            {a.jam_masuk} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>WIB</span>
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {a.jam_pulang ? (
                          <span style={{ fontWeight: '700', color: 'var(--text)' }}>
                            {a.jam_pulang} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>WIB</span>
                          </span>
                        ) : (
                          <span className="text-muted text-xs">Belum Absen</span>
                        )}
                      </td>
                      <td>
                        {a.status_masuk === 'tepat_waktu' && (
                          <span className="badge badge-success">
                            <CheckCircle size={12} /> Tepat Waktu
                          </span>
                        )}
                        {a.status_masuk === 'terlambat' && (
                          <span className="badge badge-warning">
                            <Clock size={12} /> Terlambat
                          </span>
                        )}
                        {!a.status_masuk && <span className="text-muted">-</span>}
                      </td>
                      <td>
                        {a.menit_terlambat > 0 ? (
                          <span style={{ color: 'var(--danger-text)', fontWeight: '600' }}>
                            {a.menit_terlambat} Menit
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success-text)', fontSize: '12px' }}>0 menit</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {meta && meta.last_page > 1 && (
          <div className="pagination">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              ‹ Halaman Sebelumnya
            </button>
            <span className="page-info">
              Halaman <strong>{meta.current_page}</strong> dari <strong>{meta.last_page}</strong>
            </span>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setPage(p => p + 1)}
              disabled={page === meta.last_page}
            >
              Halaman Berikutnya ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
