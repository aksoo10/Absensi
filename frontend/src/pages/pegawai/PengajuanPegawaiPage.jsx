import { useEffect, useState } from 'react';
import { Plus, CheckCircle, XCircle, Clock, Upload, FileText, Calendar, AlertCircle, X } from 'lucide-react';
import api from '../../lib/api';

const JENIS_MAP = {
  izin: 'Izin Keperluan Pribadi',
  sakit: 'Surat Keterangan Sakit',
  dinas_luar: 'Tugas / Dinas Luar'
};

const STATUS_MAP = {
  pending: { label: 'Menunggu Verifikasi', class: 'badge-warning', icon: Clock },
  disetujui: { label: 'Disetujui', class: 'badge-success', icon: CheckCircle },
  ditolak: { label: 'Ditolak', class: 'badge-danger', icon: XCircle },
};

export default function PengajuanPegawaiPage() {
  const [pengajuans, setPengajuans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ jenis: 'izin', tanggal_mulai: '', tanggal_selesai: '', alasan: '' });
  const [dokumen, setDokumen] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPengajuan = () => {
    setLoading(true);
    api.get('/pengajuan')
      .then(({ data }) => setPengajuans(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPengajuan();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (dokumen) fd.append('dokumen', dokumen);
      await api.post('/pengajuan', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowModal(false);
      setForm({ jenis: 'izin', tanggal_mulai: '', tanggal_selesai: '', alasan: '' });
      setDokumen(null);
      fetchPengajuan();
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) setError(Object.values(errs).flat().join(', '));
      else setError(err.response?.data?.message || 'Gagal mengirim pengajuan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengajuan Izin & Ketidakhadiran</h1>
          <p className="page-desc">Ajukan permohonan izin tidak masuk kantor, cuti sakit, atau tugas dinas luar</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Buat Permohonan Baru
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Riwayat Pengajuan Saya</h3>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="table-loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jenis Permohonan</th>
                  <th>Periode Tanggal</th>
                  <th>Alasan / Keterangan</th>
                  <th>Status Pengajuan</th>
                  <th>Catatan dari Admin</th>
                </tr>
              </thead>
              <tbody>
                {pengajuans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-row">
                      Belum ada permohonan pengajuan yang dibuat
                    </td>
                  </tr>
                ) : (
                  pengajuans.map((p) => {
                    const status = STATUS_MAP[p.status] || STATUS_MAP.pending;
                    const StatusIcon = status.icon;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="badge badge-info" style={{ fontWeight: '600' }}>
                            {JENIS_MAP[p.jenis] || p.jenis}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>
                            {new Date(p.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          {p.tanggal_mulai !== p.tanggal_selesai && (
                            <div className="text-muted text-xs">
                              s/d {new Date(p.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </td>
                        <td className="max-w-xs" style={{ fontSize: '13px', lineHeight: 1.4 }}>
                          {p.alasan}
                        </td>
                        <td>
                          <span className={`badge ${status.class}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: p.catatan_admin ? 'var(--text)' : 'var(--text-muted)' }}>
                          {p.catatan_admin || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Buat Pengajuan */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>Formulir Pengajuan Ketidakhadiran</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {error && (
                <div className="alert alert-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Jenis Permohonan *</label>
                <div className="jenis-selector">
                  {Object.entries(JENIS_MAP).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`jenis-option ${form.jenis === key ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, jenis: key })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tanggal Mulai *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.tanggal_mulai}
                    onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Selesai *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.tanggal_selesai}
                    min={form.tanggal_mulai}
                    onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Alasan & Penjelasan Rinci *</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.alasan}
                  onChange={(e) => setForm({ ...form, alasan: e.target.value })}
                  required
                  placeholder="Jelaskan keperluan atau alasan izin/sakit/dinas luar..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lampiran Dokumen Bukti (Opsional / Surat Dokter / SPT)</label>
                <label className="file-upload">
                  <Upload size={18} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: dokumen ? '700' : '400', color: dokumen ? 'var(--text)' : 'var(--text-muted)' }}>
                    {dokumen ? dokumen.name : 'Pilih file PDF, JPG, atau PNG (Maks 2MB)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setDokumen(e.target.files[0])}
                  />
                </label>
                {dokumen && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>File terpilih: {dokumen.name}</span>
                    <button
                      type="button"
                      onClick={() => setDokumen(null)}
                      style={{ color: 'var(--danger)', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Hapus File
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner-sm" /> : 'Kirim Pengajuan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
