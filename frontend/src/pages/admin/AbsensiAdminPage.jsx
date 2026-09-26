import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function AbsensiAdminPage() {
  const [absensis, setAbsensis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const fetchAbsensi = () => {
    setLoading(true);
    api.get('/absensi', { params: { tanggal } })
      .then(({ data }) => setAbsensis(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAbsensi(); }, [tanggal]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Monitoring Absensi</h1>
          <p className="page-desc">Pantau kehadiran pegawai</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="filter-bar">
            <span>Tanggal:</span>
            <input
              type="date"
              className="form-input w-auto"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
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
                <tr><th>Pegawai</th><th>Jabatan</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Status</th><th>Terlambat</th></tr>
              </thead>
              <tbody>
                {absensis.length === 0 ? (
                  <tr><td colSpan={6} className="empty-row">Tidak ada data absensi untuk tanggal ini</td></tr>
                ) : absensis.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="font-medium">{a.pegawai?.nama}</div>
                    </td>
                    <td>{a.pegawai?.jabatan}</td>
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
      </div>
    </div>
  );
}
