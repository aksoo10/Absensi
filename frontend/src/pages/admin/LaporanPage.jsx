import { useEffect, useState, useMemo } from 'react';
import { FileBarChart, Printer, Calendar, Users, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import cache from '../../lib/cache';

export default function LaporanPage() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const getWeeksInMonth = (m, y) => {
    const totalDays = new Date(y, m, 0).getDate();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthName = bulanNames[m - 1];
    const weeks = [];
    let curDay = 1;
    let weekIndex = 1;

    while (curDay <= totalDays) {
      const d = new Date(y, m - 1, curDay);
      const dayOfWeek = d.getDay(); // 0: Minggu, 1: Senin, ..., 5: Jumat, 6: Sabtu

      // Lewati hari libur kerja kantor (Sabtu & Minggu)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        curDay++;
        continue;
      }

      // Hari kerja awal (Senin s/d Jumat)
      const startDay = curDay;
      const startHari = dayNames[dayOfWeek];

      // Batas akhir hari kerja dalam minggu berjalan adalah Jumat (day 5) atau akhir bulan
      const daysUntilFriday = 5 - dayOfWeek;
      let endDay = Math.min(startDay + daysUntilFriday, totalDays);

      // Jika akhir bulan jatuh di hari Sabtu atau Minggu, mundurkan ke hari Jumat
      const endObj = new Date(y, m - 1, endDay);
      if (endObj.getDay() === 6) {
        endDay -= 1;
      } else if (endObj.getDay() === 0) {
        endDay -= 2;
      }

      const endHari = dayNames[new Date(y, m - 1, endDay).getDay()];
      const pad = (n) => String(n).padStart(2, '0');

      weeks.push({
        id: weekIndex,
        startDay,
        endDay,
        startHari,
        endHari,
        label: `Minggu ${weekIndex} (${startHari}, ${pad(startDay)} ${monthName} - ${endHari}, ${pad(endDay)} ${monthName})`
      });

      curDay = endDay + 1;
      weekIndex++;
    }

    return weeks;
  };

  const getCachedLaporan = (t, m, y, w = 1) => {
    const key = `admin_laporan_${t}_${m}_${y}${t === 'mingguan' ? `_${w}` : ''}`;
    const val = cache.get(key);
    if (val && Array.isArray(val.laporan)) return val;
    // Fallback legacy cache key
    if (t === 'bulanan') {
      const legacy = cache.get(`admin_laporan_${m}_${y}`);
      if (Array.isArray(legacy)) return { laporan: legacy, periode_label: `Bulan ${bulanNames[m - 1]} ${y}` };
    }
    return null;
  };

  const [tipe, setTipe] = useState('bulanan'); // 'bulanan' | 'mingguan'
  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(currentYear);
  const [minggu, setMinggu] = useState(1);
  const [periodeLabel, setPeriodeLabel] = useState(`Bulan ${bulanNames[currentMonth - 1]} ${currentYear}`);

  const currentWeeks = useMemo(() => getWeeksInMonth(bulan, tahun), [bulan, tahun]);

  useEffect(() => {
    if (minggu > currentWeeks.length) {
      setMinggu(1);
    }
  }, [currentWeeks, minggu]);

  const initialCache = getCachedLaporan('bulanan', currentMonth, currentYear);
  const [laporan, setLaporan] = useState(() => initialCache?.laporan || []);
  const [loading, setLoading] = useState(() => initialCache === null);
  const [isSyncing, setIsSyncing] = useState(false);

  const activeLabel = useMemo(() => {
    if (tipe === 'mingguan') {
      const selectedW = currentWeeks.find((w) => w.id === Number(minggu)) || currentWeeks[0];
      if (selectedW) {
        return `Minggu ke-${selectedW.id} (${selectedW.startHari}, ${String(selectedW.startDay).padStart(2, '0')} ${bulanNames[bulan - 1]} - ${selectedW.endHari}, ${String(selectedW.endDay).padStart(2, '0')} ${bulanNames[bulan - 1]} ${tahun})`;
      }
      return periodeLabel || `Minggu ke-${minggu} (${bulanNames[bulan - 1]} ${tahun})`;
    }
    return `Bulan ${bulanNames[bulan - 1]} ${tahun}`;
  }, [tipe, minggu, bulan, tahun, currentWeeks, periodeLabel]);

  const fetchLaporan = (force = false, currentTipe = tipe, currentBulan = bulan, currentTahun = tahun, currentMinggu = minggu) => {
    const key = `admin_laporan_${currentTipe}_${currentBulan}_${currentTahun}${currentTipe === 'mingguan' ? `_${currentMinggu}` : ''}`;
    const cached = getCachedLaporan(currentTipe, currentBulan, currentTahun, currentMinggu);

    if (cached !== null && !force && Array.isArray(cached.laporan)) {
      setLaporan(cached.laporan);
      if (cached.periode_label) setPeriodeLabel(cached.periode_label);
      setLoading(false);
      setIsSyncing(true);
    } else {
      setLoading(true);
    }

    const params = {
      tipe: currentTipe,
      bulan: currentBulan,
      tahun: currentTahun,
      ...(currentTipe === 'mingguan' ? { minggu: currentMinggu } : {})
    };

    cache.fetchDedup(key, () =>
      api.get('/laporan/absensi', { params })
    )
      .then(({ data }) => {
        const list = Array.isArray(data?.laporan) ? data.laporan : [];
        setLaporan(list);
        if (data.periode_label) {
          setPeriodeLabel(data.periode_label);
        }
        cache.set(key, { laporan: list, periode_label: data.periode_label });
      })
      .catch((err) => {
        console.error('Gagal mengambil laporan absensi:', err);
      })
      .finally(() => {
        setLoading(false);
        setIsSyncing(false);
      });
  };

  useEffect(() => {
    fetchLaporan(false, tipe, bulan, tahun, minggu);
  }, [tipe, bulan, tahun, minggu]);

  const handlePrint = () => {
    window.print();
  };

  const laporanList = Array.isArray(laporan) ? laporan : [];

  const totalHadirAll = laporanList.reduce((sum, item) => sum + (Number(item.hadir) || 0), 0);
  const totalTerlambatAll = laporanList.reduce((sum, item) => sum + (Number(item.terlambat) || 0), 0);
  const totalTepatWaktuAll = laporanList.reduce((sum, item) => sum + (Number(item.tepat_waktu) || 0), 0);
  const totalIzinAll = laporanList.reduce((sum, item) => sum + (Number(item.izin) || 0), 0);
  const totalSakitAll = laporanList.reduce((sum, item) => sum + (Number(item.sakit) || 0), 0);
  const totalDinasAll = laporanList.reduce((sum, item) => sum + (Number(item.dinas_luar) || 0), 0);
  const totalJamAll = laporanList.reduce((sum, item) => sum + (Number(item.total_jam_kerja) || 0), 0);
  const totalIzinSakitAll = totalIzinAll + totalSakitAll + totalDinasAll;

  // Tanggal cetak formal
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Data penandatangan (Kepala Desa & Sekretaris Desa)
  const kades = laporanList.find(p => p.jabatan?.toLowerCase().includes('kepala desa')) || {
    nama: 'Herman Sawiran',
    nip: '-'
  };

  const sekdes = laporanList.find(p => p.jabatan?.toLowerCase().includes('sekretaris')) || {
    nama: 'Budi Santoso',
    nip: '19850101001'
  };

  return (
    <div className="page" style={{ maxWidth: '100%' }}>
      {/* ─── 1. Tampilan Layar: Header Halaman (Disembunyikan Saat Cetak) ─── */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Rekapitulasi & Laporan Presensi</h1>
          <p className="page-desc">
            Laporan akumulasi kehadiran {tipe === 'mingguan' ? 'mingguan' : 'bulanan'} aparatur Pemerintah Desa Bailangu Timur
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handlePrint} disabled={loading && laporanList.length === 0}>
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* ─── 2. Tampilan Layar: Filter Periode (Disembunyikan Saat Cetak) ─── */}
      <div className="card no-print" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Switcher Tipe Rekap (Bulanan / Mingguan) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Pilihan Rekap:</span>
                <div style={{
                  display: 'inline-flex',
                  padding: '3px',
                  background: 'var(--bg-alt, #f1f5f9)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)'
                }}>
                  <button
                    type="button"
                    onClick={() => { setTipe('bulanan'); }}
                    style={{
                      padding: '6px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: tipe === 'bulanan' ? 'var(--primary)' : 'transparent',
                      color: tipe === 'bulanan' ? '#ffffff' : 'var(--text-muted)',
                      boxShadow: tipe === 'bulanan' ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none'
                    }}
                  >
                    Rekap Bulanan
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTipe('mingguan'); }}
                    style={{
                      padding: '6px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: tipe === 'mingguan' ? 'var(--primary)' : 'transparent',
                      color: tipe === 'mingguan' ? '#ffffff' : 'var(--text-muted)',
                      boxShadow: tipe === 'mingguan' ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none'
                    }}
                  >
                    Rekap Mingguan
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {isSyncing && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', fontSize: '12px' }}>
                    <RefreshCw size={12} className="animate-spin" /> Memperbarui...
                  </span>
                )}
                <span>Periode Aktif: <strong style={{ color: 'var(--primary)' }}>{activeLabel}</strong></span>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text)', fontSize: '13.5px' }}>
                  <Calendar size={17} style={{ color: 'var(--primary)' }} />
                  <span>{tipe === 'mingguan' ? 'Pilih Minggu & Bulan:' : 'Pilih Periode Bulan:'}</span>
                </div>

                {/* Dropdown Minggu (khusus saat mode Mingguan) */}
                {tipe === 'mingguan' && (
                  <select
                    className="form-input w-auto"
                    value={minggu}
                    onChange={(e) => setMinggu(Number(e.target.value))}
                    style={{ fontWeight: '600', color: 'var(--text)' }}
                  >
                    {currentWeeks.map((w) => (
                      <option key={w.id} value={w.id}>{w.label}</option>
                    ))}
                  </select>
                )}

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

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fetchLaporan(true, tipe, bulan, tahun, minggu)}
                  disabled={loading}
                >
                  {loading ? <span className="spinner-sm" /> : 'Tampilkan Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Tampilan Layar: Kartu Statistik Ringkasan (Disembunyikan Saat Cetak) ─── */}
      <div className="stats-grid no-print" style={{ marginBottom: '20px' }}>
        <div className="stat-card stat-blue">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-body">
            <div className="stat-value">{laporanList.length}</div>
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
              Rekapitulasi Kehadiran {activeLabel}
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Kantor Kepala Desa Bailangu Timur &bull; {tipe === 'mingguan' ? 'Rekap Mingguan' : 'Rekap Bulanan'}
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table table-rekap">
            <thead>
              <tr>
                <th style={{ width: '36px', textAlign: 'center' }}>No</th>
                <th style={{ minWidth: '135px' }}>Nama Pegawai</th>
                <th style={{ minWidth: '105px' }}>NIP</th>
                <th style={{ minWidth: '110px' }}>NIK</th>
                <th style={{ minWidth: '100px' }}>Jabatan</th>
                <th className="text-center" style={{ minWidth: '65px' }}>Hadir</th>
                <th className="text-center" style={{ minWidth: '50px' }}>Tepat</th>
                <th className="text-center" style={{ minWidth: '60px' }}>Terlambat</th>
                <th className="text-center" style={{ minWidth: '40px' }}>Izin</th>
                <th className="text-center" style={{ minWidth: '40px' }}>Sakit</th>
                <th className="text-center" style={{ minWidth: '45px' }}>Dinas</th>
                <th className="text-center" style={{ minWidth: '65px' }}>Total Jam</th>
              </tr>
            </thead>
            <tbody>
              {loading && laporanList.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '30px' }}>
                    <div className="spinner" style={{ margin: '0 auto 10px' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Memuat data laporan presensi...</span>
                  </td>
                </tr>
              ) : laporanList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="empty-row" style={{ padding: '36px !important' }}>
                    Tidak ada catatan presensi pada {activeLabel}
                  </td>
                </tr>
              ) : (
                laporanList.map((l, index) => (
                  <tr key={l.pegawai_id}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px', padding: '7px 4px' }}>
                      {index + 1}
                    </td>
                    <td>
                      <div className="font-semibold" style={{ color: 'var(--text)', fontSize: '12px', whiteSpace: 'nowrap' }}>{l.nama}</div>
                    </td>
                    <td>
                      {l.nip ? (
                        <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {l.nip}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">-</span>
                      )}
                    </td>
                    <td>
                      {l.nik ? (
                        <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {l.nik}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ color: 'var(--text)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>{l.jabatan}</div>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-success" style={{ fontWeight: '700', padding: '2px 6px', fontSize: '11px' }}>
                        {l.hadir} Hari
                      </span>
                    </td>
                    <td className="text-center" style={{ fontWeight: '600', fontSize: '11.5px' }}>
                      {l.tepat_waktu}
                    </td>
                    <td className="text-center">
                      {l.terlambat > 0 ? (
                        <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: '11px' }}>
                          {l.terlambat}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>0</span>
                      )}
                    </td>
                    <td className="text-center" style={{ fontSize: '11.5px' }}>{l.izin || 0}</td>
                    <td className="text-center" style={{ fontSize: '11.5px' }}>{l.sakit || 0}</td>
                    <td className="text-center" style={{ fontSize: '11.5px' }}>{l.dinas_luar || 0}</td>
                    <td className="text-center">
                      <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '11.5px' }}>
                        {l.total_jam_kerja || 0}
                      </span> <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Jam</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          <h3 className="print-report-title">
            REKAPITULASI LAPORAN KEHADIRAN PEGAWAI {tipe === 'mingguan' ? '(MINGGUAN)' : '(BULANAN)'}
          </h3>
          <p className="print-report-subtitle">
            Periode: {activeLabel}
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
                  Tidak ada catatan presensi pada {activeLabel}
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
