import { useEffect, useState } from 'react';
import { Download, FileBarChart, Printer, Calendar, Users, Clock, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    fetchLaporan();
  }, []);

  const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrint = () => {
    window.print();
  };

  const totalHadirAll = laporan.reduce((sum, item) => sum + (Number(item.hadir) || 0), 0);
  const totalTerlambatAll = laporan.reduce((sum, item) => sum + (Number(item.terlambat) || 0), 0);
  const totalIzinSakitAll = laporan.reduce((sum, item) => sum + (Number(item.izin) || 0) + (Number(item.sakit) || 0) + (Number(item.dinas_luar) || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rekapitulasi & Laporan Presensi</h1>
          <p className="page-desc">Laporan akumulasi kehadiran bulanan aparatur Pemerintah Desa Bailangu Timur</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter Period Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text)' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                <span>Pilih Periode:</span>
              </div>
              <select
                className="form-input w-auto"
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
              >
                {bulanNames.map((b, i) => (
                  <option key={i} value={i + 1}>{b}</option>
                ))}
              </select>
              <select
                className="form-input w-auto"
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={fetchLaporan} disabled={loading}>
                {loading ? <span className="spinner-sm" /> : 'Tampilkan Data'}
              </button>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
              Periode Aktif: <strong>{bulanNames[bulan - 1]} {tahun}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Period Summary Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card stat-blue">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-body">
            <div className="stat-value">{laporan.length}</div>
            <div className="stat-label">Total Pegawai Terdaftar</div>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon"><CheckCircle size={24} /></div>
          <div className="stat-body">
            <div className="stat-value">{totalHadirAll}</div>
            <div className="stat-label">Total Hari Masuk Kerja</div>
          </div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-body">
            <div className="stat-value">{totalTerlambatAll}</div>
            <div className="stat-label">Kasus Keterlambatan</div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileBarChart size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>
              Rekapitulasi Kehadiran Bulan {bulanNames[bulan - 1]} {tahun}
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Kantor Kepala Desa Bailangu Timur
          </span>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="table-loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Pegawai & Jabatan</th>
                  <th className="text-center">Total Hadir</th>
                  <th className="text-center">Tepat Waktu</th>
                  <th className="text-center">Terlambat</th>
                  <th className="text-center">Izin</th>
                  <th className="text-center">Sakit</th>
                  <th className="text-center">Dinas Luar</th>
                  <th className="text-center">Akumulasi Jam Kerja</th>
                </tr>
              </thead>
              <tbody>
                {laporan.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-row">
                      Tidak ada catatan presensi pada periode {bulanNames[bulan - 1]} {tahun}
                    </td>
                  </tr>
                ) : (
                  laporan.map((l, index) => (
                    <tr key={l.pegawai_id}>
                      <td style={{ width: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {index + 1}
                      </td>
                      <td>
                        <div className="font-semibold" style={{ color: 'var(--text)' }}>{l.nama}</div>
                        <div className="text-muted text-xs">{l.jabatan}</div>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-success" style={{ fontWeight: '700' }}>
                          {l.hadir} Hari
                        </span>
                      </td>
                      <td className="text-center" style={{ fontWeight: '600' }}>
                        {l.tepat_waktu}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${l.terlambat > 0 ? 'badge-warning' : ''}`}>
                          {l.terlambat}
                        </span>
                      </td>
                      <td className="text-center">{l.izin || 0}</td>
                      <td className="text-center">{l.sakit || 0}</td>
                      <td className="text-center">{l.dinas_luar || 0}</td>
                      <td className="text-center">
                        <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                          {l.total_jam_kerja || 0}
                        </span> <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Jam</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
