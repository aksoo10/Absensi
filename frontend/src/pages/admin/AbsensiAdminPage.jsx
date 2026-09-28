import { useEffect, useState } from 'react';
import {
  Calendar, CheckCircle, Clock, UserCheck,
  AlertTriangle, Filter, Search, ShieldCheck
} from 'lucide-react';
import api from '../../lib/api';
import cache from '../../lib/cache';

export default function AbsensiAdminPage() {
  const isInitialToday = true;
  const cachedToday = cache.get('admin_absensi_today');
  const [absensis, setAbsensis] = useState(() => cachedToday || []);
  const [loading, setLoading] = useState(() => cachedToday === null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAbsensi = () => {
    const isToday = tanggal === new Date().toISOString().split('T')[0];
    const cacheKey = isToday ? 'admin_absensi_today' : `admin_absensi_${tanggal}`;
    const cached = cache.get(cacheKey);

    if (cached !== null) {
      setAbsensis(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    cache.fetchDedup(`absensi_${tanggal}`, () => api.get('/absensi', { params: { tanggal } }))
      .then(({ data }) => {
        const list = data.data || [];
        setAbsensis(list);
        cache.set(cacheKey, list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAbsensi();
  }, [tanggal]);

  const setToday = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setTanggal(d.toISOString().split('T')[0]);
  };

  // Filtered absensi based on quick status chip
  const filteredAbsensi = absensis.filter((a) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'tepat_waktu') return a.status_masuk === 'tepat_waktu';
    if (filterStatus === 'terlambat') return a.status_masuk === 'terlambat';
    return true;
  });

  const totalHadir = absensis.filter(a => a.jam_masuk).length;
  const totalTepatWaktu = absensis.filter(a => a.status_masuk === 'tepat_waktu').length;
  const totalTerlambat = absensis.filter(a => a.status_masuk === 'terlambat').length;

  const formattedDate = new Date(tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Monitoring Presensi Pegawai</h1>
          <p className="page-desc">Pantau catatan waktu masuk dan pulang harian aparatur desa</p>
        </div>
      </div>

      {/* Date & Filter Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text)' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                <span>Pilih Tanggal:</span>
              </div>
              <input
                type="date"
                className="form-input w-auto"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
              <button
                type="button"
                className={`btn-filter ${tanggal === new Date().toISOString().split('T')[0] ? 'active' : ''}`}
                onClick={setToday}
              >
                Hari Ini
              </button>
              <button
                type="button"
                className="btn-filter"
                onClick={setYesterday}
              >
                Kemarin
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <button
                type="button"
                className={`btn-filter ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Semua ({absensis.length})
              </button>
              <button
                type="button"
                className={`btn-filter ${filterStatus === 'tepat_waktu' ? 'active' : ''}`}
                onClick={() => setFilterStatus('tepat_waktu')}
              >
                Tepat Waktu ({totalTepatWaktu})
              </button>
              <button
                type="button"
                className={`btn-filter ${filterStatus === 'terlambat' ? 'active' : ''}`}
                onClick={() => setFilterStatus('terlambat')}
              >
                Terlambat ({totalTerlambat})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Metrics Summary */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card stat-blue">
          <div className="stat-icon"><UserCheck size={24} /></div>
          <div className="stat-body">
            <div className="stat-value">{totalHadir}</div>
            <div className="stat-label">Total Kehadiran Tercatat</div>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon"><CheckCircle size={24} /></div>
          <div className="stat-body">
            <div className="stat-value">{totalTepatWaktu}</div>
            <div className="stat-label">Tepat Waktu</div>
          </div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-body">
            <div className="stat-value">{totalTerlambat}</div>
            <div className="stat-label">Terlambat</div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={18} />
            Data Presensi: {formattedDate}
          </h3>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
            Menampilkan {filteredAbsensi.length} baris data
          </span>
        </div>

        <div className="table-wrapper">
          {loading && cache.get(tanggal === new Date().toISOString().split('T')[0] ? 'admin_absensi_today' : `admin_absensi_${tanggal}`) === null ? (
            <div className="table-loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pegawai</th>
                  <th>Jabatan</th>
                  <th>Jam Masuk</th>
                  <th>Jam Pulang</th>
                  <th>Status Masuk</th>
                  <th>Keterlambatan</th>
                </tr>
              </thead>
              <tbody>
                {filteredAbsensi.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      Tidak ada catatan presensi untuk tanggal {formattedDate}
                    </td>
                  </tr>
                ) : (
                  filteredAbsensi.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="table-user">
                          <div className="avatar avatar-sm">
                            {a.pegawai?.nama?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className="font-semibold">{a.pegawai?.nama}</div>
                            <div className="text-muted text-xs">NIP: {a.pegawai?.nip || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-medium">{a.pegawai?.jabatan || '-'}</span>
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
                          <span style={{ color: 'var(--danger-text)', fontWeight: '600', fontSize: '13px' }}>
                            + {a.menit_terlambat} Menit
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
      </div>
    </div>
  );
}
