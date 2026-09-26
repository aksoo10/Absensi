import { useEffect, useState } from 'react';
import { Plus, CheckCircle, XCircle, Clock, Upload } from 'lucide-react';
import api from '../../lib/api';

const JENIS_MAP = { izin: 'Izin', sakit: 'Sakit', dinas_luar: 'Dinas Luar' };
const STATUS_MAP = {
  pending: { label: 'Menunggu', class: 'badge-warning' },
  disetujui: { label: 'Disetujui', class: 'badge-success' },
  ditolak: { label: 'Ditolak', class: 'badge-danger' },
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
    api.get('/pengajuan').then(({ data }) => setPengajuans(data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPengajuan(); }, []);

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
          <h1 className="page-title">Pengajuan Ketidakhadiran</h1>
          <p className="page-desc">Ajukan izin, sakit, atau dinas luar</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Buat Pengajuan
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="table-loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Jenis</th><th>Periode</th><th>Alasan</th><th>Status</th><th>Catatan Admin</th></tr>
              </thead>
              <tbody>
                {pengajuans.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">Belum ada pengajuan</td></tr>
                ) : pengajuans.map((p) => {
                  const status = STATUS_MAP[p.status];
                  return (
                    <tr key={p.id}>
                      <td><span className="badge badge-info">{JENIS_MAP[p.jenis]}</span></td>
                      <td>
                        {new Date(p.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {p.tanggal_mulai !== p.tanggal_selesai && ` s/d ${new Date(p.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                      </td>
                      <td className="max-w-xs">{p.alasan}</td>
                      <td><span className={`badge ${status.class}`}>{status.label}</span></td>
                      <td className="text-muted text-sm">{p.catatan_admin || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buat Pengajuan</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="alert alert-error"><span>{error}</span></div>}
              <div className="form-group">
                <label className="form-label">Jenis Pengajuan *</label>
                <div className="jenis-selector">
                  {Object.entries(JENIS_MAP).map(([key, label]) => (
                    <button
                      key={key} type="button"
                      className={`jenis-option ${form.jenis === key ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, jenis: key })}
                    >{label}</button>
                  ))}
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tanggal Mulai *</label>
                  <input type="date" className="form-input" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Selesai *</label>
                  <input type="date" className="form-input" value={form.tanggal_selesai} min={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Alasan *</label>
                <textarea className="form-input" rows={3} value={form.alasan} onChange={(e) => setForm({ ...form, alasan: e.target.value })} required placeholder="Jelaskan alasan ketidakhadiran..." />
              </div>
              <div className="form-group">
                <label className="form-label">Dokumen Pendukung (opsional)</label>
                <label className="file-upload">
                  <Upload size={18} />
                  <span>{dokumen ? dokumen.name : 'Pilih file PDF / JPG / PNG'}</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDokumen(e.target.files[0])} />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner-sm" /> : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
