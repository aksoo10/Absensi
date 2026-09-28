import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, Filter, FileText,
  FileCheck, Calendar, User, ExternalLink, AlertCircle,
  ArrowLeft, Eye, X, Download
} from 'lucide-react';
import api, { BACKEND_URL } from '../../lib/api';
import cache from '../../lib/cache';

const STATUS_MAP = {
  pending: { label: 'Menunggu Verifikasi', class: 'badge-warning', icon: Clock },
  disetujui: { label: 'Disetujui', class: 'badge-success', icon: CheckCircle },
  ditolak: { label: 'Ditolak', class: 'badge-danger', icon: XCircle },
};

const JENIS_MAP = {
  izin: 'Izin Keperluan Pribadi',
  sakit: 'Surat Keterangan Sakit',
  dinas_luar: 'Tugas / Dinas Luar Kantor',
};

export default function PengajuanAdminPage() {
  const cached = cache.get('admin_pengajuans');
  const [pengajuans, setPengajuans] = useState(() => cached || []);
  const [loading, setLoading] = useState(() => cached === null);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  const fetchPengajuan = (status = '', isBackground = false) => {
    if (!isBackground && (status || cache.get('admin_pengajuans') === null)) {
      setLoading(true);
    }
    const dedupKey = `admin_pengajuans_${status || 'all'}`;
    cache.fetchDedup(dedupKey, () => api.get('/pengajuan', { params: { status } }))
      .then(({ data }) => {
        const list = data.data || [];
        setPengajuans(list);
        if (!status) cache.set('admin_pengajuans', list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPengajuan(filterStatus, Boolean(cached && !filterStatus));
  }, [filterStatus]);

  const handleProses = async (pengajuan, status) => {
    setSubmitting(true);
    try {
      await api.patch(`/pengajuan/${pengajuan.id}/proses`, { status, catatan_admin: catatan });
      cache.remove('admin_pengajuans');
      cache.remove('admin_dashboard');
      cache.remove('dashboard_pegawai');
      setSelected(null);
      setCatatan('');
      fetchPengajuan(filterStatus);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses pengajuan');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = pengajuans.filter(p => p.status === 'pending').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Verifikasi Pengajuan Pegawai</h1>
          <p className="page-desc">Tinjau dan proses permohonan izin, sakit, dan surat dinas luar pegawai desa</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filter-bar">
            <Filter size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: '600', color: 'var(--text)' }}>Status Pengajuan:</span>
            {[
              { id: '', label: 'Semua' },
              { id: 'pending', label: 'Menunggu' },
              { id: 'disetujui', label: 'Disetujui' },
              { id: 'ditolak', label: 'Ditolak' }
            ].map((s) => (
              <button
                key={s.id}
                className={`btn-filter ${filterStatus === s.id ? 'active' : ''}`}
                onClick={() => setFilterStatus(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Daftar Pengajuan Masuk</h3>
            {pendingCount > 0 && (
              <span className="badge badge-warning" style={{ fontSize: '11.5px' }}>
                {pendingCount} Perlu Ditindaklanjuti
              </span>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          {loading && pengajuans.length === 0 ? (
            <div className="table-loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pegawai Pemohon</th>
                  <th>Jenis Permohonan</th>
                  <th>Rentang Waktu</th>
                  <th>Alasan / Keterangan</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {pengajuans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      Tidak ada permohonan pengajuan pada kategori ini
                    </td>
                  </tr>
                ) : pengajuans.map((p) => {
                  const status = STATUS_MAP[p.status] || STATUS_MAP.pending;
                  const StatusIcon = status.icon;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="table-user">
                          <div className="avatar avatar-sm">
                            {p.pegawai?.nama?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className="font-semibold">{p.pegawai?.nama}</div>
                            <div className="text-muted text-xs">{p.pegawai?.jabatan}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '12px' }}>
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
                        <div className="truncate" title={p.alasan || '-'}>
                          {p.alasan || '-'}
                        </div>
                        {p.dokumen && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({
                              id: p.id,
                              dokumen: p.dokumen,
                              url: `${BACKEND_URL}/storage/${p.dokumen}`,
                              pemohon: p.pegawai?.nama || 'Pegawai',
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
                              marginTop: '3px',
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
                      <td style={{ textAlign: 'center' }}>
                        {p.status === 'pending' ? (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => { setSelected(p); setCatatan(''); }}
                          >
                            Verifikasi
                          </button>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            <div>Selesai diproses</div>
                            {p.diproses_pada && (
                              <div style={{ fontSize: '11px' }}>
                                {new Date(p.diproses_pada).toLocaleDateString('id-ID')}
                              </div>
                            )}
                          </div>
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

      {/* Review & Process Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>Verifikasi Pengajuan Izin / Cuti</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-rows" style={{ background: 'var(--bg)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div className="detail-row">
                  <span>Nama Pemohon</span>
                  <strong>{selected.pegawai?.nama} ({selected.pegawai?.jabatan})</strong>
                </div>
                <div className="detail-row">
                  <span>Kategori</span>
                  <strong>{JENIS_MAP[selected.jenis]}</strong>
                </div>
                <div className="detail-row">
                  <span>Periode Hari</span>
                  <strong>
                    {new Date(selected.tanggal_mulai).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {selected.tanggal_mulai !== selected.tanggal_selesai && ` s/d ${new Date(selected.tanggal_selesai).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Alasan Permohonan</span>
                  <strong>{selected.alasan || '-'}</strong>
                </div>
                {selected.dokumen && (
                  <div className="detail-row">
                    <span>File Lampiran</span>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({
                        id: selected.id,
                        dokumen: selected.dokumen,
                        url: `${BACKEND_URL}/storage/${selected.dokumen}`,
                        pemohon: selected.pegawai?.nama || 'Pegawai',
                        jenis: JENIS_MAP[selected.jenis] || selected.jenis,
                        alasan: selected.alasan,
                      })}
                      className="btn btn-outline btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--primary)',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        padding: '5px 12px'
                      }}
                    >
                      <Eye size={14} /> Buka & Lihat Dokumen Pendukung
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginTop: '6px' }}>
                <label className="form-label">Catatan Admin / Alasan Keputusan (Opsional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Berikan alasan atau catatan tambahan untuk pegawai..."
                />
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>
                Batal
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-danger"
                  disabled={submitting}
                  onClick={() => handleProses(selected, 'ditolak')}
                >
                  <XCircle size={16} /> Tolak Permohonan
                </button>
                <button
                  className="btn btn-success"
                  disabled={submitting}
                  onClick={() => handleProses(selected, 'disetujui')}
                >
                  <CheckCircle size={16} /> Setujui Permohonan
                </button>
              </div>
            </div>
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
                  {previewDoc.pemohon} &bull; {previewDoc.jenis}
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
