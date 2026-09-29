import { useEffect, useState } from 'react';
import {
  Clock, LogIn, LogOut, CheckCircle, AlertCircle,
  Calendar, Info, CheckCircle2, AlertTriangle, Lock
} from 'lucide-react';
import api from '../../lib/api';
import cache from '../../lib/cache';

export default function AbsensiPage() {
  const [hariIni, setHariIni] = useState(() => cache.get('absensi_hari_ini'));
  const [loading, setLoading] = useState(() => !cache.get('absensi_hari_ini'));
  const [submitting, setSubmitting] = useState(null);
  const [message, setMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time ticking digital clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHariIni = () => {
    api.get('/absensi/hari-ini')
      .then(({ data }) => {
        setHariIni(data);
        cache.set('absensi_hari_ini', data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHariIni();
  }, []);

  const absensi = hariIni?.absensi !== undefined ? hariIni.absensi : (hariIni?.jam_masuk !== undefined ? hariIni : null);
  const jadwal = (hariIni?.jadwal && hariIni.jadwal.nama) ? hariIni.jadwal : {
    nama: 'Jadwal Reguler',
    jam_masuk: '08:00:00',
    jam_pulang: '16:00:00',
    toleransi_menit: 15
  };

  const formatJamMasuk = jadwal?.jam_masuk ? jadwal.jam_masuk.slice(0, 5) : '08:00';
  const formatJamPulang = jadwal?.jam_pulang ? jadwal.jam_pulang.slice(0, 5) : '16:00';
  const toleransiMenit = Number(jadwal?.toleransi_menit) || 15;

  const getBatasMasuk = () => {
    const rawJamMasuk = jadwal?.jam_masuk || '08:00:00';
    const parts = rawJamMasuk.split(':');
    const startH = parseInt(parts[0], 10);
    const startM = parseInt(parts[1], 10);

    const totalEndM = startM + toleransiMenit;
    const endH = startH + Math.floor(totalEndM / 60);
    const endM = totalEndM % 60;

    return { startH, startM, endH, endM };
  };

  const isBeforeJamMasuk = () => {
    const { startH, startM } = getBatasMasuk();
    const nowH = currentTime.getHours();
    const nowM = currentTime.getMinutes();
    return nowH < startH || (nowH === startH && nowM < startM);
  };

  const isAfterToleransiMasuk = () => {
    const { endH, endM } = getBatasMasuk();
    const nowH = currentTime.getHours();
    const nowM = currentTime.getMinutes();
    return nowH > endH || (nowH === endH && nowM > endM);
  };

  const formatBatasToleransi = () => {
    const { endH, endM } = getBatasMasuk();
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const isBeforeJamPulang = () => {
    if (!jadwal?.jam_pulang) return false;
    const parts = jadwal.jam_pulang.split(':');
    const targetH = parseInt(parts[0], 10);
    const targetM = parseInt(parts[1], 10);
    const nowH = currentTime.getHours();
    const nowM = currentTime.getMinutes();
    return nowH < targetH || (nowH === targetH && nowM < targetM);
  };

  const handleAbsenMasuk = async () => {
    if (isBeforeJamMasuk()) {
      setMessage({
        type: 'error',
        text: `Presensi masuk belum dibuka. Tombol baru dapat ditekan tepat pada pukul ${formatJamMasuk} WIB.`
      });
      return;
    }

    if (isAfterToleransiMasuk()) {
      setMessage({
        type: 'error',
        text: `Waktu presensi masuk telah berakhir. Batas maksimal kehadiran adalah pukul ${formatBatasToleransi()} WIB.`
      });
      return;
    }

    setSubmitting('masuk');
    setMessage(null);
    try {
      const { data } = await api.post('/absensi/masuk');
      setMessage({
        type: 'success',
        text: data.message + ' — Presensi Tepat Waktu!'
      });
      cache.remove('dashboard_pegawai');
      cache.remove('admin_absensi_today');
      fetchHariIni();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal melakukan absen masuk' });
    } finally {
      setSubmitting(null);
    }
  };

  const handleAbsenPulang = async () => {
    // Larangan mutlak: tombol tidak bisa ditekan sebelum jam pulang
    if (isBeforeJamPulang()) {
      setMessage({
        type: 'error',
        text: `Presensi pulang belum dibuka. Tombol baru dapat ditekan tepat pada pukul ${formatJamPulang} WIB.`
      });
      return;
    }

    setSubmitting('pulang');
    setMessage(null);
    try {
      const { data } = await api.post('/absensi/pulang');
      setMessage({ type: 'success', text: data.message });
      cache.remove('dashboard_pegawai');
      cache.remove('admin_absensi_today');
      fetchHariIni();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal melakukan absen pulang' });
    } finally {
      setSubmitting(null);
    }
  };

  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  const dateStr = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pencatatan Presensi Harian</h1>
          <p className="page-desc">Silakan lakukan pencatatan waktu masuk dan pulang kerja sesuai jadwal</p>
        </div>
      </div>

      {/* Real-Time Live Clock Card */}
      <div className="card clock-card">
        <div className="card-body text-center" style={{ padding: '40px 24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#38bdf8',
            marginBottom: '12px',
            background: 'rgba(56, 189, 248, 0.12)',
            padding: '4px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}>
            <Clock size={13} /> Waktu Server Real-Time (WIB)
          </div>

          <div className="clock-display">
            <span>{hours}</span>
            <span style={{ opacity: currentTime.getSeconds() % 2 === 0 ? 1 : 0.4 }}>:</span>
            <span>{minutes}</span>
            <span style={{ fontSize: '36px', opacity: 0.8, marginLeft: '6px', fontWeight: '600' }}>
              :{seconds}
            </span>
          </div>

          <div className="clock-date">
            {dateStr}
          </div>

          <div className="clock-jadwal">
            <Calendar size={14} />
            <span>Jadwal Aktif: <strong>{jadwal.nama}</strong> ({formatJamMasuk} — {formatJamPulang} WIB)</span>
            <span style={{ opacity: 0.6 }}>&bull;</span>
            <span>Toleransi: <strong>{toleransiMenit} Menit</strong> (s/d {formatBatasToleransi()} WIB)</span>
          </div>
        </div>
      </div>

      {/* Flash Message Alert */}
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.type === 'success' ? (
            <CheckCircle2 size={20} style={{ flexShrink: 0, color: 'var(--success)' }} />
          ) : (
            <AlertCircle size={20} style={{ flexShrink: 0, color: 'var(--danger)' }} />
          )}
          <span style={{ fontWeight: '600' }}>{message.text}</span>
        </div>
      )}

      {loading && !hariIni ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : (
        <div className="absensi-grid">
          {/* Absen Masuk Card */}
          <div className={`absensi-card ${absensi?.jam_masuk ? 'done' : (isBeforeJamMasuk() || isAfterToleransiMasuk()) ? 'disabled' : ''}`}>
            <div className="absensi-card-icon">
              {absensi?.jam_masuk ? <CheckCircle size={32} /> : <LogIn size={32} />}
            </div>

            <div>
              <h3>Presensi Masuk</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {absensi?.jam_masuk ? 'Telah tercatat pada sistem' : `Jadwal: ${formatJamMasuk} — ${formatBatasToleransi()} WIB`}
              </p>
            </div>

            {absensi?.jam_masuk ? (
              <div className="absensi-done">
                <div className="absensi-time">{absensi.jam_masuk} <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-muted)' }}>WIB</span></div>
                {absensi.status_masuk === 'tepat_waktu' && (
                  <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '13px' }}>
                    <CheckCircle size={14} /> Tepat Waktu
                  </span>
                )}
                {absensi.status_masuk === 'terlambat' && (
                  <span className="badge badge-warning" style={{ padding: '6px 14px', fontSize: '13px' }}>
                    <AlertTriangle size={14} /> Terlambat {Math.abs(Math.round(absensi.menit_terlambat))} Menit
                  </span>
                )}
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <button
                  className="btn btn-primary btn-absen btn-full"
                  onClick={handleAbsenMasuk}
                  disabled={submitting === 'masuk' || isBeforeJamMasuk() || isAfterToleransiMasuk()}
                  style={isBeforeJamMasuk() || isAfterToleransiMasuk() ? {
                    background: '#f1f5f9',
                    color: '#94a3b8',
                    borderColor: '#e2e8f0',
                    cursor: 'not-allowed',
                    opacity: 0.85
                  } : {}}
                >
                  {submitting === 'masuk' ? (
                    <>
                      <span className="spinner-sm" />
                      Mencatat Kehadiran...
                    </>
                  ) : isBeforeJamMasuk() ? (
                    <>
                      <Lock size={17} />
                      Belum Jam Masuk (Pukul {formatJamMasuk} WIB)
                    </>
                  ) : isAfterToleransiMasuk() ? (
                    <>
                      <AlertCircle size={17} />
                      Batas Masuk Berakhir ({formatBatasToleransi()} WIB)
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Catat Masuk Sekarang
                    </>
                  )}
                </button>

                {isBeforeJamMasuk() && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: '500'
                  }}>
                    <Lock size={13} /> Tombol tidak bisa ditekan sebelum pukul {formatJamMasuk} WIB
                  </div>
                )}

                {isAfterToleransiMasuk() && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#b91c1c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: '500',
                    textAlign: 'center'
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} /> Batas toleransi kehadiran ({formatBatasToleransi()} WIB) telah berakhir
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Absen Pulang Card */}
          <div className={`absensi-card ${absensi?.jam_pulang ? 'done' : !absensi?.jam_masuk ? 'disabled' : ''}`}>
            <div className="absensi-card-icon">
              {absensi?.jam_pulang ? <CheckCircle size={32} /> : <LogOut size={32} />}
            </div>

            <div>
              <h3>Presensi Pulang</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {absensi?.jam_pulang ? 'Telah tercatat pada sistem' : 'Tombol aktif pada jam kerja berakhir'}
              </p>
            </div>

            {absensi?.jam_pulang ? (
              <div className="absensi-done">
                <div className="absensi-time">{absensi.jam_pulang} <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-muted)' }}>WIB</span></div>
                <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '13px' }}>
                  <CheckCircle size={14} /> Presensi Hari Ini Lengkap
                </span>
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <button
                  className="btn btn-secondary btn-absen btn-full"
                  onClick={handleAbsenPulang}
                  disabled={submitting === 'pulang' || !absensi?.jam_masuk || isBeforeJamPulang()}
                  style={!absensi?.jam_masuk || isBeforeJamPulang() ? {
                    background: '#f1f5f9',
                    color: '#94a3b8',
                    borderColor: '#e2e8f0',
                    cursor: 'not-allowed',
                    opacity: 0.85
                  } : {
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    borderColor: 'rgba(37, 99, 235, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  {submitting === 'pulang' ? (
                    <>
                      <span className="spinner-sm" />
                      Mencatat Kepulangan...
                    </>
                  ) : isBeforeJamPulang() ? (
                    <>
                      <Lock size={17} />
                      Belum Jam Pulang (Pukul {formatJamPulang} WIB)
                    </>
                  ) : (
                    <>
                      <LogOut size={18} />
                      Catat Pulang Sekarang
                    </>
                  )}
                </button>

                {absensi?.jam_masuk && isBeforeJamPulang() && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: '500'
                  }}>
                    <Lock size={13} /> Tombol tidak bisa ditekan sebelum pukul {formatJamPulang} WIB
                  </div>
                )}

                {!absensi?.jam_masuk && (
                  <p className="absensi-note" style={{ marginTop: '10px' }}>
                    * Lakukan absen masuk terlebih dahulu sebelum dapat mencatat kepulangan
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guidelines Note */}
      <div style={{
        marginTop: '28px',
        padding: '16px 20px',
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>Ketentuan Presensi Kantor Desa Bailangu Timur:</strong>
          <br />
          1. Waktu pencatatan kehadiran menggunakan basis waktu server Indonesia Barat (WIB).
          <br />
          2. <strong>Presensi Masuk hanya dapat ditekan mulai pukul {formatJamMasuk} WIB hingga batas toleransi ({formatBatasToleransi()} WIB)</strong>. Lewat dari batas waktu tersebut, presensi masuk tidak dapat dilakukan.
          <br />
          3. <strong>Presensi Pulang hanya dapat ditekan tepat pada atau setelah jam kerja berakhir ({formatJamPulang} WIB)</strong> dan terkunci otomatis sebelum jam tersebut.
          <br />
          4. Jika berhalangan hadir karena dinas, sakit, atau keperluan izin lainnya, silakan ajukan melalui menu <strong>Pengajuan Cuti / Izin</strong>.
        </div>
      </div>
    </div>
  );
}

