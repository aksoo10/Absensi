import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, Filter, FileText,
  FileCheck, Calendar, User, ExternalLink, AlertCircle,
  ArrowLeft, Eye, X, Download, Loader2, RefreshCw, Trash2, Search
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

export const getPreviewUrl = (dokumenPath) => {
  if (!dokumenPath) return '';
  if (dokumenPath.startsWith('http://') || dokumenPath.startsWith('https://')) {
    return dokumenPath;
  }
  // Try Vite proxy /storage first or backend inline preview endpoint with CORS & caching
  return `/storage/${dokumenPath}`;
};

export const preloadImage = (dokumenPath) => {
  if (!dokumenPath || dokumenPath.toLowerCase().endsWith('.pdf')) return;
  const img = new Image();
  img.src = getPreviewUrl(dokumenPath);
};

export default function PengajuanAdminPage() {
  const cached = cache.get('admin_pengajuans');
  const [pengajuans, setPengajuans] = useState(() => cached || []);
  const [loading, setLoading] = useState(() => cached === null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docLoaded, setDocLoaded] = useState(false);
  const [docError, setDocError] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const openPreview = (item, customPemohon = null) => {
    setDocLoaded(false);
    setDocError(false);
    setPreviewDoc({
      id: item.id,
      dokumen: item.dokumen,
      url: getPreviewUrl(item.dokumen),
      pemohon: customPemohon || item.pegawai?.nama || 'Pegawai',
      jenis: JENIS_MAP[item.jenis] || item.jenis,
      alasan: item.alasan,
    });
  };

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

  // Pre-warm document previews in the browser cache so clicking 'Lihat Lampiran' is instantaneous (0 ms)
  useEffect(() => {
    if (pengajuans && pengajuans.length > 0) {
      pengajuans.forEach((p) => {
        if (p.dokumen) {
          preloadImage(p.dokumen);
        }
      });
    }
  }, [pengajuans]);

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

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/pengajuan/${itemToDelete.id}`);
      cache.remove('admin_pengajuans');
      cache.remove('admin_dashboard');
      cache.remove('dashboard_pegawai');
      cache.remove('pengajuan_list');

      const nama = itemToDelete.pegawai?.nama || 'Pegawai';
      setSuccessMsg(`Data pengajuan dari "${nama}" berhasil dihapus.`);
      setTimeout(() => setSuccessMsg(''), 4000);

      if (selected?.id === itemToDelete.id) {
        setSelected(null);
      }
      setItemToDelete(null);
      fetchPengajuan(filterStatus);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus data pengajuan');
    } finally {
      setDeleting(false);
    }
  };

  const filteredPengajuans = pengajuans.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const nama = (p.pegawai?.nama || '').toLowerCase();
    const jabatan = (p.pegawai?.jabatan || '').toLowerCase();
    const jenis = (JENIS_MAP[p.jenis] || p.jenis || '').toLowerCase();
    const alasan = (p.alasan || '').toLowerCase();
    const status = (STATUS_MAP[p.status]?.label || p.status || '').toLowerCase();
    return nama.includes(term) || jabatan.includes(term) || jenis.includes(term) || alasan.includes(term) || status.includes(term);
  });

  const pendingCount = pengajuans.filter(p => p.status === 'pending').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Verifikasi Pengajuan Pegawai</h1>
          <p className="page-desc">Tinjau dan proses permohonan izin, sakit, dan surat dinas luar pegawai desa</p>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div className="filter-bar" style={{ margin: 0 }}>
              <Filter size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: '600', color: 'var(--text)' }}>Status:</span>
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

            {/* Quick Search Box */}
            <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '340px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Cari nama pegawai, alasan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '34px', paddingRight: search ? '32px' : '12px', fontSize: '13px', height: '36px' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  title="Hapus pencarian"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Daftar Pengajuan Masuk</h3>
            {pendingCount > 0 && (
              <span className="badge badge-warning" style={{ fontSize: '11.5px' }}>
                {pendingCount} Perlu Ditindaklanjuti
              </span>
            )}
            {search && (
              <span className="badge badge-info" style={{ fontSize: '11.5px' }}>
                {filteredPengajuans.length} Ditemukan
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
                {filteredPengajuans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      {search ? `Tidak ada permohonan yang cocok dengan kata kunci "${search}"` : 'Tidak ada permohonan pengajuan pada kategori ini'}
                    </td>
                  </tr>
                ) : filteredPengajuans.map((p) => {
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
                            onClick={() => openPreview(p)}
                            onMouseEnter={() => preloadImage(p.dokumen)}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          {p.status === 'pending' ? (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => { setSelected(p); setCatatan(''); }}
                              title="Tinjau & Verifikasi Permohonan"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              Verifikasi
                            </button>
                          ) : (
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.2, textAlign: 'right' }}>
                              <span style={{ fontWeight: '600' }}>Selesai</span>
                              {p.diproses_pada && (
                                <div style={{ fontSize: '10.5px', opacity: 0.8 }}>
                                  {new Date(p.diproses_pada).toLocaleDateString('id-ID')}
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            className="btn-icon btn-delete"
                            onClick={() => setItemToDelete(p)}
                            title="Hapus permohonan pengajuan ini"
                            aria-label="Hapus pengajuan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
                      onClick={() => openPreview(selected)}
                      onMouseEnter={() => preloadImage(selected?.dokumen)}
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    color: 'var(--danger)',
                    borderColor: 'rgba(239, 68, 68, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => {
                    const toDelete = selected;
                    setSelected(null);
                    setItemToDelete(toDelete);
                  }}
                  title="Hapus data permohonan pengajuan ini"
                >
                  <Trash2 size={15} /> Hapus
                </button>
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>
                  Batal
                </button>
              </div>
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
            {/* Top Bar (Header with Title & Actions) */}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    padding: '5px 10px',
                    textDecoration: 'none'
                  }}
                  title="Buka dokumen di tab baru"
                >
                  <ExternalLink size={13} />
                  <span>Tab Baru</span>
                </a>

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
            </div>

            {/* Document Viewer Body */}
            <div
              className="modal-body"
              style={{
                padding: '16px',
                background: '#090d16',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                minHeight: '380px',
                maxHeight: 'calc(92vh - 135px)',
                position: 'relative'
              }}
            >
              {/* Animated Loading State */}
              {!docLoaded && !docError && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '50px 20px',
                  textAlign: 'center'
                }}>
                  <Loader2 className="animate-spin" size={38} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                      Memuat Lampiran Dokumen...
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                      Menyiapkan pratinjau bukti untuk Anda
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {docError && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  maxWidth: '440px'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                    color: '#ef4444'
                  }}>
                    <AlertCircle size={28} />
                  </div>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                    Pratinjau Tidak Dapat Ditampilkan
                  </h5>
                  <p style={{ margin: '0 0 20px 0', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                    Dokumen tidak dapat dimuat langsung di browser. Anda dapat mencoba memuat ulang atau langsung mengunduh file lampiran.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setDocError(false);
                        setDocLoaded(false);
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RefreshCw size={13} /> Coba Muat Ulang
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleDownloadDoc}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={13} /> Unduh File
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Content */}
              {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.url}
                  title="Preview Dokumen PDF"
                  onLoad={() => setDocLoaded(true)}
                  onError={() => {
                    setDocLoaded(true);
                    setDocError(true);
                  }}
                  style={{
                    display: docLoaded && !docError ? 'block' : 'none',
                    width: '100%',
                    height: '560px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#fff'
                  }}
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt="Lampiran Dokumen Pengajuan"
                  onLoad={() => setDocLoaded(true)}
                  onError={() => {
                    setDocLoaded(true);
                    setDocError(true);
                  }}
                  style={{
                    display: docLoaded && !docError ? 'block' : 'none',
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
                {downloading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Mengunduh...
                  </>
                ) : (
                  <>
                    <Download size={15} /> Unduh File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Permohonan Pengajuan */}
      {itemToDelete && (
        <div className="modal-overlay" onClick={() => !deleting && setItemToDelete(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--danger-light)',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text)' }}>
                    Hapus Data Pengajuan?
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>
              <button
                className="modal-close"
                disabled={deleting}
                onClick={() => setItemToDelete(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: 'var(--text)', marginBottom: '14px', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus data permohonan pengajuan pegawai berikut?
              </p>

              <div style={{
                background: 'var(--bg)',
                borderRadius: '8px',
                padding: '12px 14px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pegawai Pemohon:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                    {itemToDelete.pegawai?.nama || 'Pegawai'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Jenis Pengajuan:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                    {JENIS_MAP[itemToDelete.jenis] || itemToDelete.jenis}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Rentang Waktu:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                    {new Date(itemToDelete.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {itemToDelete.tanggal_mulai !== itemToDelete.tanggal_selesai && ` s/d ${new Date(itemToDelete.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span className={`badge ${STATUS_MAP[itemToDelete.status]?.class || 'badge-warning'}`} style={{ padding: '2px 8px', fontSize: '11px' }}>
                    {STATUS_MAP[itemToDelete.status]?.label || itemToDelete.status}
                  </span>
                </div>
                {itemToDelete.dokumen && (
                  <div style={{
                    marginTop: '4px',
                    paddingTop: '8px',
                    borderTop: '1px dashed var(--border)',
                    fontSize: '11.5px',
                    color: 'var(--text-muted)'
                  }}>
                    Lampiran file bukti pengajuan juga akan dibersihkan secara permanen dari server.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleting}
                onClick={() => setItemToDelete(null)}
              >
                Batal (Jangan Hapus)
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleting}
                onClick={handleDelete}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {deleting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Ya, Hapus Pengajuan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
