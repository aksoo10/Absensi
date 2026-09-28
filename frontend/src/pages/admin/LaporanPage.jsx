import { useEffect, useState } from 'react';
import { FileBarChart, Printer, Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import cache from '../../lib/cache';

export default function LaporanPage() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const initialCacheKey = `admin_laporan_${currentMonth}_${currentYear}`;

  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(currentYear);
  const [laporan, setLaporan] = useState(() => cache.get(initialCacheKey) || []);
  const [loading, setLoading] = useState(() => !cache.get(initialCacheKey));

  const fetchLaporan = () => {
    const key = `admin_laporan_${bulan}_${tahun}`;
    const cached = cache.get(key);
    if (cached) {
      setLaporan(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    api.get('/laporan/absensi', { params: { bulan, tahun } })
      .then(({ data }) => {
        const list = data.laporan || [];
        setLaporan(list);
        cache.set(key, list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLaporan();
  }, [bulan, tahun]);

  const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrint = () => {
    window.print();
  };

  const totalHadirAll = laporan.reduce((sum, item) => sum + (Number(item.hadir) || 0), 0);
  const totalTerlambatAll = laporan.reduce((sum, item) => sum + (Number(item.terlambat) || 0), 0);
  const totalTepatWaktuAll = laporan.reduce((sum, item) => sum + (Number(item.tepat_waktu) || 0), 0);
  const totalIzinAll = laporan.reduce((sum, item) => sum + (Number(item.izin) || 0), 0);
  const totalSakitAll = laporan.reduce((sum, item) => sum + (Number(item.sakit) || 0), 0);
  const totalDinasAll = laporan.reduce((sum, item) => sum + (Number(item.dinas_luar) || 0), 0);
  const totalJamAll = laporan.reduce((sum, item) => sum + (Number(item.total_jam_kerja) || 0), 0);
  const totalIzinSakitAll = totalIzinAll + totalSakitAll + totalDinasAll;

  // Tanggal cetak formal
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Data penandatangan (Kepala Desa & Sekretaris Desa)
  const kades = laporan.find(p => p.jabatan?.toLowerCase().includes('kepala desa')) || {
    nama: 'Herman Sawiran',
    nip: '-'
  };

  const sekdes = laporan.find(p => p.jabatan?.toLowerCase().includes('sekretaris')) || {
    nama: 'Budi Santoso',
    nip: '19850101001'
  };

  return (
    <div className="page">
      {/* ─── 1. Tampilan Layar: Header Halaman (Disembunyikan Saat Cetak) ─── */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Rekapitulasi & Laporan Presensi</h1>
          <p className="page-desc">Laporan akumulasi kehadiran bulanan aparatur Pemerintah Desa Bailangu Timur</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handlePrint} disabled={loading || laporan.length === 0}>
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* ─── 2. Tampilan Layar: Filter Periode (Disembunyikan Saat Cetak) ─── */}
      <div className="card no-print">
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

      {/* ─── 3. Tampilan Layar: Kartu Statistik Ringkasan (Disembunyikan Saat Cetak) ─── */}
      <div className="stats-grid no-print" style={{ marginBottom: '20px' }}>
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

      {/* ─── 4. Tampilan Layar: Tabel Interaktif Web (Disembunyikan Saat Cetak) ─── */}
      <div className="card no-print">
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
                  <th>Nama Pegawai</th>
                  <th>NIP</th>
                  <th>NIK</th>
                  <th>Jabatan</th>
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
                {loading && laporan.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="spinner" style={{ margin: '0 auto 10px' }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Memuat data laporan presensi...</span>
                    </td>
                  </tr>
                ) : laporan.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="empty-row">
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
                      </td>
                      <td>
                        {l.nip ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {l.nip}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">-</span>
                        )}
                      </td>
                      <td>
                        {l.nik ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {l.nik}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">-</span>
                        )}
                      </td>
                      <td>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>{l.jabatan}</div>
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

      {/* ─── 5. DOKUMEN CETAK RESMI (HANYA MUNCUL SAAT CETAK / WINDOW.PRINT) ─── */}
      <div className="print-document-sheet print-only">
        {/* Kop Surat Resmi */}
        <div className="kop-surat">
          <h4 className="kop-instansi">PEMERINTAH KABUPATEN MUSI BANYUASIN</h4>
          <h4 className="kop-kecamatan">KECAMATAN SEKAYU</h4>
          <h2 className="kop-desa">PEMERINTAH DESA BAILANGU TIMUR</h2>
          <p className="kop-alamat">
            Alamat: Jalan Sekayu - Betung, Desa Bailangu Timur, Kec. Sekayu, Kab. Musi Banyuasin, Sumatera Selatan 30711
          </p>
        </div>

        {/* Judul Laporan Cetak */}
        <div className="print-report-header">
          <h3 className="print-report-title">REKAPITULASI LAPORAN KEHADIRAN PEGAWAI</h3>
          <p className="print-report-subtitle">
            Periode: Bulan {bulanNames[bulan - 1]} {tahun}
          </p>
        </div>

        {/* Ringkasan Akumulasi Angka */}
        <div className="print-summary-box">
          <div><strong>Total Aparatur:</strong> {laporan.length} Orang</div>
          <div><strong>Total Hari Masuk:</strong> {totalHadirAll} Hari</div>
          <div><strong>Total Tepat Waktu:</strong> {totalTepatWaktuAll} Hari</div>
          <div><strong>Kasus Terlambat:</strong> {totalTerlambatAll} Kali</div>
          <div><strong>Total Izin/Sakit/Dinas:</strong> {totalIzinSakitAll} Hari</div>
        </div>

        {/* Tabel Rekapitulasi Cetak Formal */}
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '30px' }}>No</th>
              <th>Nama Pegawai</th>
              <th>NIP</th>
              <th>NIK</th>
              <th>Jabatan</th>
              <th>Hadir</th>
              <th>Tepat Waktu</th>
              <th>Terlambat</th>
              <th>Izin</th>
              <th>Sakit</th>
              <th>Dinas Luar</th>
              <th>Total Jam Kerja</th>
            </tr>
          </thead>
          <tbody>
            {laporan.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '14px' }}>
                  Tidak ada catatan presensi pada periode {bulanNames[bulan - 1]} {tahun}
                </td>
              </tr>
            ) : (
              laporan.map((l, index) => (
                <tr key={l.pegawai_id}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ fontWeight: '700' }}>{l.nama}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '8.5pt', textAlign: 'center' }}>{l.nip || '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '8.5pt', textAlign: 'center' }}>{l.nik || '-'}</td>
                  <td>{l.jabatan}</td>
                  <td style={{ textAlign: 'center', fontWeight: '700' }}>{l.hadir} Hari</td>
                  <td style={{ textAlign: 'center' }}>{l.tepat_waktu}</td>
                  <td style={{ textAlign: 'center' }}>{l.terlambat}</td>
                  <td style={{ textAlign: 'center' }}>{l.izin || 0}</td>
                  <td style={{ textAlign: 'center' }}>{l.sakit || 0}</td>
                  <td style={{ textAlign: 'center' }}>{l.dinas_luar || 0}</td>
                  <td style={{ textAlign: 'center', fontWeight: '600' }}>{l.total_jam_kerja || 0} Jam</td>
                </tr>
              ))
            )}
          </tbody>
          {laporan.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', fontWeight: 'bold' }}>TOTAL KESELURUHAN</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{totalHadirAll} Hari</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{totalTepatWaktuAll}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{totalTerlambatAll}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{totalIzinAll}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{totalSakitAll}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{totalDinasAll}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{totalJamAll} Jam</td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* Kolom Tanda Tangan Pengesahan (Sejajar Sempurna & Posisi Ditukar) */}
        <table className="print-signature-table">
          <tbody>
            {/* Baris 1: Jabatan & Tanggal (Kades di Kiri, Sekdes di Kanan) */}
            <tr>
              <td className="sig-cell">
                <div className="sig-label">Mengetahui,</div>
                <div className="sig-title">Kepala Desa Bailangu Timur</div>
              </td>
              <td style={{ width: '40%' }}></td>
              <td className="sig-cell">
                <div className="sig-label">Bailangu Timur, {todayFormatted}</div>
                <div className="sig-title">Sekretaris Desa Bailangu Timur</div>
              </td>
            </tr>

            {/* Baris 2: Ruang Tanda Tangan & Cap Stempel (Tinggi Persis Sama) */}
            <tr style={{ height: '70px' }}>
              <td colSpan={3}></td>
            </tr>

            {/* Baris 3: Nama & NIP/NIK Pejabat (Garis Sejajar Rata Sempurna) */}
            <tr>
              <td className="sig-cell">
                <div className="sig-name">{kades.nama}</div>
                <div className="sig-nip">
                  {kades.nip && kades.nip !== '-' ? <div>NIP. {kades.nip}</div> : null}
                  {kades.nik ? <div>NIK. {kades.nik}</div> : null}
                  {!kades.nip && !kades.nik ? <div>Kepala Desa</div> : null}
                </div>
              </td>
              <td></td>
              <td className="sig-cell">
                <div className="sig-name">{sekdes.nama}</div>
                <div className="sig-nip">
                  {sekdes.nip && sekdes.nip !== '-' ? <div>NIP. {sekdes.nip}</div> : null}
                  {sekdes.nik ? <div>NIK. {sekdes.nik}</div> : null}
                  {!sekdes.nip && !sekdes.nik ? <div>Sekretaris Desa</div> : null}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
