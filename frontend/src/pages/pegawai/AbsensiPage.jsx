import { useEffect, useState } from 'react';
import {
  Clock, LogIn, LogOut, CheckCircle, AlertCircle,
  Calendar, ShieldCheck, Info, CheckCircle2, AlertTriangle
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

  const handleAbsenMasuk = async () => {
    setSubmitting('masuk');
    setMessage(null);
    try {
      const { data } = await api.post('/absensi/masuk');
      setMessage({
        type: 'success',
        text: data.message + (data.status_masuk === 'terlambat' ? ` (Terlambat ${data.menit_terlambat} menit)` : ' — Tepat Waktu!')
      });
      cache.remove('dashboard_pegawai');
      fetchHariIni();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal melakukan absen masuk' });
    } finally {
      setSubmitting(null);
    }
  };

  const handleAbsenPulang = async () => {
    setSubmitting('pulang');
    setMessage(null);
    try {
      const { data } = await api.post('/absensi/pulang');
      setMessage({ type: 'success', text: data.message });
      cache.remove('dashboard_pegawai');
      fetchHariIni();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal melakukan absen pulang' });
    } finally {
      setSubmitting(null);
    }
  };

  const absensi = hariIni?.absensi;
  const jadwal = hariIni?.jadwal;

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

          {jadwal && (
            <div className="clock-jadwal">
              <Calendar size={14} />
              <span>Jadwal Aktif: <strong>{jadwal.nama}</strong> ({jadwal.jam_masuk} — {jadwal.jam_pulang} WIB)</span>
              <span style={{ opacity: 0.6 }}>&bull;</span>
              <span>Toleransi: <strong>{jadwal.toleransi_menit} Menit</strong></span>
            </div>
          )}
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
          <div className={`absensi-card ${absensi?.jam_masuk ? 'done' : ''}`}>
            <div className="absensi-card-icon">
              {absensi?.jam_masuk ? <CheckCircle size={32} /> : <LogIn size={32} />}
            </div>

            <div>
              <h3>Presensi Masuk</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {absensi?.jam_masuk ? 'Telah tercatat pada sistem' : 'Tekan tombol untuk mencatat waktu tiba'}
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
                    <AlertTriangle size={14} /> Terlambat {absensi.menit_terlambat} Menit
                  </span>
                )}
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <button
                  className="btn btn-primary btn-absen btn-full"
                  onClick={handleAbsenMasuk}
                  disabled={submitting === 'masuk'}
                >
                  {submitting === 'masuk' ? (
                    <>
                      <span className="spinner-sm" />
                      Mencatat Kehadiran...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Catat Masuk Sekarang
                    </>
                  )}
                </button>
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
                {absensi?.jam_pulang ? 'Telah tercatat pada sistem' : 'Tekan tombol saat jam kerja berakhir'}
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
                  disabled={submitting === 'pulang' || !absensi?.jam_masuk}
                  style={absensi?.jam_masuk ? {
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    borderColor: 'rgba(37, 99, 235, 0.3)'
                  } : {}}
                >
                  {submitting === 'pulang' ? (
                    <>
                      <span className="spinner-sm" />
                      Mencatat Kepulangan...
                    </>
                  ) : (
                    <>
                      <LogOut size={18} />
                      Catat Pulang Sekarang
                    </>
                  )}
                </button>
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
          2. Presensi tepat waktu dicatat apabila masuk sebelum toleransi jadwal kerja terlampaui.
          <br />
          3. Jika berhalangan hadir karena dinas, sakit, atau keperluan izin lainnya, silakan ajukan melalui menu <strong>Pengajuan</strong>.
        </div>
      </div>
    </div>
  );
}
