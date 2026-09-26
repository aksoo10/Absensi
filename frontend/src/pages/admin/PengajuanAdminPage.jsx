import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, Filter, FileText,
  FileCheck, Calendar, User, ExternalLink, AlertCircle
} from 'lucide-react';
import api from '../../lib/api';

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

  useEffect(() => {
    fetchPengajuan(filterStatus);
  }, [filterStatus]);

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
          {loading ? (
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
                        <div className="truncate" title={p.alasan}>
                          {p.alasan}
                        </div>
                        {p.dokumen && (
                          <a
                            href={`http://localhost:8000/storage/${p.dokumen}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '11.5px', marginTop: '3px', fontWeight: '600' }}
                          >
                            <ExternalLink size={11} /> Lihat Lampiran
                          </a>
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
                  <strong>{selected.alasan}</strong>
                </div>
                {selected.dokumen && (
                  <div className="detail-row">
                    <span>File Lampiran</span>
                    <a
                      href={`http://localhost:8000/storage/${selected.dokumen}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--primary)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ExternalLink size={13} /> Buka Dokumen Pendukung
                    </a>
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
    </div>
  );
}
