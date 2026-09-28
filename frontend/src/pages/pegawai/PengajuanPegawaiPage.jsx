import { useEffect, useState } from 'react';
import {
  Plus, CheckCircle, XCircle, Clock, Upload, FileText,
  Calendar, AlertCircle, X, ArrowLeft, Eye, ExternalLink, Download
} from 'lucide-react';
import api, { BACKEND_URL } from '../../lib/api';
import cache from '../../lib/cache';

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
  const cached = cache.get('pengajuan_list');
  const [pengajuans, setPengajuans] = useState(() => cached || []);
  const [loading, setLoading] = useState(() => cached === null);
  const [showModal, setShowModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [form, setForm] = useState({ jenis: 'izin', tanggal_mulai: '', tanggal_selesai: '', alasan: '' });
  const [dokumen, setDokumen] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadDoc = async () => {
    if (!previewDoc) return;
    setDownloading(true);
    try {
      const downloadEndpoint = previewDoc.id
        ? `/pengajuan/${previewDoc.id}/download`
        : `/pengajuan/download/dokumen?path=${encodeURIComponent(previewDoc.dokumen || '')}`;

      const res = await api.get(downloadEndpoint, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const ext = previewDoc.dokumen ? previewDoc.dokumen.split('.').pop() : 'jpg';
      const cleanName = (previewDoc.pemohon || 'lampiran').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `Lampiran_${cleanName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 200);
    } catch (err) {
      console.warn('API blob download error, falling back to direct stream:', err);
      const fallbackUrl = `${BACKEND_URL}/api/public/download-dokumen?path=${encodeURIComponent(previewDoc.dokumen || '')}&name=${encodeURIComponent(`Lampiran_${previewDoc.pemohon || 'dokumen'}`)}`;
      const a = document.createElement('a');
      a.href = fallbackUrl;
      a.setAttribute('download', '');
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 200);
    } finally {
      setDownloading(false);
    }
  };

  const fetchPengajuan = (isBackground = false) => {
    if (!isBackground && cache.get('pengajuan_list') === null) {
      setLoading(true);
    }
    cache.fetchDedup('pengajuan_list', () => api.get('/pengajuan'))
      .then(({ data }) => {
        const list = data.data || [];
        setPengajuans(list);
        cache.set('pengajuan_list', list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPengajuan(Boolean(cached));
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
      cache.remove('pengajuan_list');
      cache.remove('dashboard_pegawai');
      setShowModal(false);
      setForm({ jenis: 'izin', tanggal_mulai: '', tanggal_selesai: '', alasan: '' });
      setDokumen(null);
      fetchPengajuan(false);
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
          {loading && pengajuans.length === 0 ? (
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
                          <div>{p.alasan || '-'}</div>
                          {p.dokumen && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({
                                id: p.id,
                                dokumen: p.dokumen,
                                url: `${BACKEND_URL}/storage/${p.dokumen}`,
                                pemohon: 'Saya',
                                jenis: JENIS_MAP[p.jenis] || p.jenis,
                                alasan: p.alasan,
                              })}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--primary)',
                                fontSize: '11.5px',
                                marginTop: '4px',
                                fontWeight: '600',
                                padding: 0
                              }}
                            >
                              <Eye size={12} /> Lihat Lampiran
                            </button>
                          )}
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
                <label className="form-label">Alasan & Penjelasan (Opsional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.alasan}
                  onChange={(e) => setForm({ ...form, alasan: e.target.value })}
                  placeholder="Jelaskan keperluan atau alasan (opsional)..."
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

      {/* Modal Preview Lampiran Dokumen dengan Tombol Back / Kembali */}
      {previewDoc && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewDoc(null)}
          style={{
            zIndex: 1200,
            backgroundColor: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '850px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {/* Top Bar (Header with Title & Close Button) */}
            <div
              className="modal-header"
              style={{
                padding: '14px 20px',
                background: 'var(--bg)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
                  Lampiran Dokumen Bukti
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {previewDoc.jenis}
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setPreviewDoc(null)}
                style={{ fontSize: '20px' }}
                title="Tutup"
              >
                &times;
              </button>
            </div>

            {/* Document Viewer Body */}
            <div
              className="modal-body"
              style={{
                padding: '16px',
                background: '#090d16',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                minHeight: '350px',
                maxHeight: 'calc(92vh - 135px)'
              }}
            >
              {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.url}
                  title="Preview Dokumen PDF"
                  style={{ width: '100%', height: '540px', border: 'none', borderRadius: '8px' }}
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt="Lampiran Dokumen Pengajuan"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(92vh - 160px)',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)'
                  }}
                />
              )}
            </div>

            {/* Bottom Bar: Single Kembali Button & Working Unduh File Button */}
            <div
              className="modal-footer"
              style={{
                padding: '12px 20px',
                background: 'var(--bg)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPreviewDoc(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600'
                }}
              >
                <ArrowLeft size={16} /> Kembali
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadDoc}
                disabled={downloading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600'
                }}
              >
                <Download size={15} /> {downloading ? 'Mengunduh...' : 'Unduh File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
