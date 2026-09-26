import { useEffect, useState } from 'react';
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

export default function AbsensiPage() {
  const [hariIni, setHariIni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchHariIni = () => {
    api.get('/absensi/hari-ini')
      .then(({ data }) => setHariIni(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHariIni(); }, []);

  const handleAbsenMasuk = async () => {
    setSubmitting('masuk');
    setMessage(null);
    try {
      const { data } = await api.post('/absensi/masuk');
      setMessage({ type: 'success', text: data.message + (data.status_masuk === 'terlambat' ? ` (Terlambat ${data.menit_terlambat} menit)` : ' — Tepat Waktu!') });
      fetchHariIni();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal absen masuk' });
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
      fetchHariIni();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal absen pulang' });
    } finally {
      setSubmitting(null);
    }
  };

  const absensi = hariIni?.absensi;
  const jadwal = hariIni?.jadwal;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Absensi Harian</h1>
          <p className="page-desc">Catat kehadiran Anda hari ini</p>
        </div>
      </div>

      {/* Clock Card */}
      <div className="card clock-card">
        <div className="card-body text-center">
          <div className="clock-display">{timeStr}</div>
          <div className="clock-date">{dateStr}</div>
          {jadwal && (
            <div className="clock-jadwal">
              Jadwal: {jadwal.jam_masuk} — {jadwal.jam_pulang} | Toleransi: {jadwal.toleransi_menit} menit
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : (
        <div className="absensi-grid">
          {/* Absen Masuk */}
          <div className={`absensi-card ${absensi?.jam_masuk ? 'done' : ''}`}>
            <div className="absensi-card-icon">
              <LogIn size={32} />
            </div>
            <h3>Absen Masuk</h3>
            {absensi?.jam_masuk ? (
              <div className="absensi-done">
                <div className="absensi-time">{absensi.jam_masuk}</div>
                <span className={`badge ${absensi.status_masuk === 'tepat_waktu' ? 'badge-success' : 'badge-warning'}`}>
                  {absensi.status_masuk === 'tepat_waktu' ? '✓ Tepat Waktu' : `⚠ Terlambat ${absensi.menit_terlambat} menit`}
                </span>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-absen"
                onClick={handleAbsenMasuk}
                disabled={submitting === 'masuk'}
              >
                {submitting === 'masuk' ? <span className="spinner-sm" /> : <><LogIn size={18} /> Absen Masuk</>}
              </button>
            )}
          </div>

          {/* Absen Pulang */}
          <div className={`absensi-card ${absensi?.jam_pulang ? 'done' : !absensi?.jam_masuk ? 'disabled' : ''}`}>
            <div className="absensi-card-icon">
              <LogOut size={32} />
            </div>
            <h3>Absen Pulang</h3>
            {absensi?.jam_pulang ? (
              <div className="absensi-done">
                <div className="absensi-time">{absensi.jam_pulang}</div>
                <span className="badge badge-success">✓ Sudah Absen</span>
              </div>
            ) : (
              <button
                className="btn btn-secondary btn-absen"
                onClick={handleAbsenPulang}
                disabled={submitting === 'pulang' || !absensi?.jam_masuk}
              >
                {submitting === 'pulang' ? <span className="spinner-sm" /> : <><LogOut size={18} /> Absen Pulang</>}
              </button>
            )}
            {!absensi?.jam_masuk && <p className="absensi-note">Lakukan absen masuk terlebih dahulu</p>}
          </div>
        </div>
      )}
    </div>
  );
}
