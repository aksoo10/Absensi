import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import api from '../../lib/api';

const STATUS_MAP = {
  pending: { label: 'Menunggu', class: 'badge-warning', icon: Clock },
  disetujui: { label: 'Disetujui', class: 'badge-success', icon: CheckCircle },
  ditolak: { label: 'Ditolak', class: 'badge-danger', icon: XCircle },
};

const JENIS_MAP = {
  izin: 'Izin',
  sakit: 'Sakit',
  dinas_luar: 'Dinas Luar',
};

export default function PengajuanAdminPage() {
  const [pengajuans, setPengajuans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPengajuan = (status = '') => {
    setLoading(true);
    api.get('/pengajuan', { params: { status } })
      .then(({ data }) => setPengajuans(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPengajuan(filterStatus); }, [filterStatus]);

  const handleProses = async (pengajuan, status) => {
    setSubmitting(true);
    try {
      await api.patch(`/pengajuan/${pengajuan.id}/proses`, { status, catatan_admin: catatan });
      setSelected(null);
      setCatatan('');
      fetchPengajuan(filterStatus);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses pengajuan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengajuan Ketidakhadiran</h1>
          <p className="page-desc">Kelola pengajuan izin, sakit, dan dinas luar</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="card-body">
          <div className="filter-bar">
            <Filter size={16} />
            <span>Filter Status:</span>
            {['', 'pending', 'disetujui', 'ditolak'].map((s) => (
              <button
                key={s}
                className={`btn-filter ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === '' ? 'Semua' : STATUS_MAP[s]?.label}
              </button>
            ))}
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
                <tr>
                  <th>Pegawai</th>
                  <th>Jenis</th>
                  <th>Periode</th>
                  <th>Alasan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pengajuans.length === 0 ? (
                  <tr><td colSpan={6} className="empty-row">Tidak ada pengajuan</td></tr>
                ) : pengajuans.map((p) => {
                  const status = STATUS_MAP[p.status];
                  const StatusIcon = status.icon;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="table-user">
                          <div className="avatar-sm">{p.pegawai?.nama?.[0]}</div>
                          <div>
                            <div className="font-medium">{p.pegawai?.nama}</div>
                            <div className="text-muted text-sm">{p.pegawai?.jabatan}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-info">{JENIS_MAP[p.jenis]}</span></td>
                      <td>
                        <div className="text-sm">
                          {new Date(p.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          {p.tanggal_mulai !== p.tanggal_selesai && (
                            <> — {new Date(p.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</>
                          )}
                        </div>
                      </td>
                      <td className="max-w-xs truncate">{p.alasan}</td>
                      <td>
                        <span className={`badge ${status.class}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        {p.status === 'pending' ? (
                          <button className="btn btn-sm btn-primary" onClick={() => { setSelected(p); setCatatan(''); }}>
                            Proses
                          </button>
                        ) : (
                          <span className="text-muted text-sm">
                            {p.diproses_pada ? new Date(p.diproses_pada).toLocaleDateString('id-ID') : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Proses Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Proses Pengajuan</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-rows">
                <div className="detail-row"><span>Pegawai</span><strong>{selected.pegawai?.nama}</strong></div>
                <div className="detail-row"><span>Jenis</span><strong>{JENIS_MAP[selected.jenis]}</strong></div>
                <div className="detail-row">
                  <span>Periode</span>
                  <strong>
                    {new Date(selected.tanggal_mulai).toLocaleDateString('id-ID')}
                    {selected.tanggal_mulai !== selected.tanggal_selesai && ` s/d ${new Date(selected.tanggal_selesai).toLocaleDateString('id-ID')}`}
                  </strong>
                </div>
                <div className="detail-row"><span>Alasan</span><strong>{selected.alasan}</strong></div>
              </div>
              <div className="form-group mt-4">
                <label className="form-label">Catatan Admin (opsional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tambahkan catatan..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Batal</button>
              <button
                className="btn btn-danger"
                disabled={submitting}
                onClick={() => handleProses(selected, 'ditolak')}
              >
                <XCircle size={16} /> Tolak
              </button>
              <button
                className="btn btn-success"
                disabled={submitting}
                onClick={() => handleProses(selected, 'disetujui')}
              >
                <CheckCircle size={16} /> Setujui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
