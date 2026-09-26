import { useEffect, useState } from 'react';
import { Download, FileBarChart } from 'lucide-react';
import api from '../../lib/api';

export default function LaporanPage() {
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLaporan = () => {
    setLoading(true);
    api.get('/laporan/absensi', { params: { bulan, tahun } })
      .then(({ data }) => setLaporan(data.laporan || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLaporan(); }, []);

  const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Absensi</h1>
          <p className="page-desc">Rekap kehadiran pegawai per periode</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="card-body">
          <div className="filter-bar">
            <FileBarChart size={16} />
            <select className="form-input w-auto" value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
              {bulanNames.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
            </select>
            <select className="form-input w-auto" value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
              {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-primary" onClick={fetchLaporan} disabled={loading}>
              {loading ? <span className="spinner-sm" /> : 'Tampilkan'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Laporan {bulanNames[bulan - 1]} {tahun}</h3>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="table-loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pegawai</th>
                  <th className="text-center">Hadir</th>
                  <th className="text-center">Tepat Waktu</th>
                  <th className="text-center">Terlambat</th>
                  <th className="text-center">Izin</th>
                  <th className="text-center">Sakit</th>
                  <th className="text-center">Dinas Luar</th>
                  <th className="text-center">Jam Kerja</th>
                </tr>
              </thead>
              <tbody>
                {laporan.length === 0 ? (
                  <tr><td colSpan={8} className="empty-row">Tidak ada data untuk periode ini</td></tr>
                ) : laporan.map((l) => (
                  <tr key={l.pegawai_id}>
                    <td>
                      <div className="font-medium">{l.nama}</div>
                      <div className="text-muted text-sm">{l.jabatan}</div>
                    </td>
                    <td className="text-center"><span className="badge badge-success">{l.hadir}</span></td>
                    <td className="text-center">{l.tepat_waktu}</td>
                    <td className="text-center">
                      <span className={`badge ${l.terlambat > 0 ? 'badge-warning' : ''}`}>{l.terlambat}</span>
                    </td>
                    <td className="text-center">{l.izin}</td>
                    <td className="text-center">{l.sakit}</td>
                    <td className="text-center">{l.dinas_luar}</td>
                    <td className="text-center">{l.total_jam_kerja} jam</td>
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
