import { useEffect, useState } from 'react';
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

  useEffect(() => { fetchRiwayat(); }, [bulan, tahun, page]);

  const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Riwayat Absensi</h1>
          <p className="page-desc">Rekap kehadiran Anda</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="filter-bar">
            <select className="form-input w-auto" value={bulan} onChange={(e) => { setBulan(Number(e.target.value)); setPage(1); }}>
              {bulanNames.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
            </select>
            <select className="form-input w-auto" value={tahun} onChange={(e) => { setTahun(Number(e.target.value)); setPage(1); }}>
              {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="table-loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Tanggal</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Status</th><th>Keterlambatan</th></tr>
              </thead>
              <tbody>
                {absensis.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">Tidak ada data absensi</td></tr>
                ) : absensis.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</td>
                    <td>{a.jam_masuk || '-'}</td>
                    <td>{a.jam_pulang || '-'}</td>
                    <td>
                      {a.status_masuk ? (
                        <span className={`badge ${a.status_masuk === 'tepat_waktu' ? 'badge-success' : 'badge-warning'}`}>
                          {a.status_masuk === 'tepat_waktu' ? 'Tepat Waktu' : 'Terlambat'}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{a.menit_terlambat > 0 ? `${a.menit_terlambat} menit` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {meta && meta.last_page > 1 && (
          <div className="pagination">
            <button className="btn btn-sm btn-secondary" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹ Prev</button>
            <span className="page-info">Halaman {meta.current_page} dari {meta.last_page}</span>
            <button className="btn btn-sm btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page === meta.last_page}>Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}
