import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, Check, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function JadwalPage() {
  const [jadwals, setJadwals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    nama: '',
    hari_kerja: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    jam_masuk: '08:00',
    jam_pulang: '16:00',
    toleransi_menit: 15,
    is_default: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchJadwal = () => {
    setLoading(true);
    api.get('/jadwal')
      .then(({ data }) => setJadwals(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  const toggleHari = (hari) => {
    const updated = form.hari_kerja.includes(hari)
      ? form.hari_kerja.filter((h) => h !== hari)
      : [...form.hari_kerja, hari];
    setForm({ ...form, hari_kerja: updated });
  };

  const openAdd = () => {
    setEditData(null);
    setForm({
      nama: '',
      hari_kerja: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
      jam_masuk: '08:00',
      jam_pulang: '16:00',
      toleransi_menit: 15,
      is_default: false
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (j) => {
    setEditData(j);
    setForm({
      nama: j.nama,
      hari_kerja: j.hari_kerja || [],
      jam_masuk: j.jam_masuk,
      jam_pulang: j.jam_pulang,
      toleransi_menit: j.toleransi_menit,
      is_default: Boolean(j.is_default)
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.hari_kerja.length === 0) {
      setError('Pilih minimal satu hari kerja');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (editData) {
        await api.put(`/jadwal/${editData.id}`, form);
      } else {
        await api.post('/jadwal', form);
      }
      setShowModal(false);
      fetchJadwal();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan pengaturan jadwal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Hapus jadwal kerja "${nama}"?`)) return;
    try {
      await api.delete(`/jadwal/${id}`);
      fetchJadwal();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus jadwal kerja');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan Jadwal Kerja</h1>
          <p className="page-desc">Konfigurasi shift, jam kerja kantor, dan batas toleransi keterlambatan</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Tambah Jadwal Baru
        </button>
      </div>

      <div className="cards-grid">
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : jadwals.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="card-body empty-row">
              Belum ada pengaturan jadwal kerja yang ditambahkan
            </div>
          </div>
        ) : jadwals.map((j) => (
          <div key={j.id} className={`card jadwal-card ${j.is_default ? 'jadwal-default' : ''}`}>
            {j.is_default && (
              <div className="jadwal-badge-default">
                Shift Utama (Default)
              </div>
            )}
            <div className="card-body" style={{ padding: '24px 20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                <h3 className="jadwal-nama" style={{ margin: 0 }}>{j.nama}</h3>
              </div>

              <div className="jadwal-time">
                <span>{j.jam_masuk}</span>
                <span style={{ fontSize: '15px', color: 'var(--text-light)', margin: '0 4px', fontWeight: '600' }}>s/d</span>
                <span>{j.jam_pulang}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginLeft: '4px' }}>WIB</span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                HARI KERJA AKTIF:
              </div>
              <div className="jadwal-hari">
                {HARI.map((h) => {
                  const isActive = j.hari_kerja && j.hari_kerja.includes(h);
                  return (
                    <span
                      key={h}
                      className={`hari-chip ${isActive ? 'hari-aktif' : ''}`}
                      title={h}
                    >
                      {h.slice(0, 3)}
                    </span>
                  );
                })}
              </div>

              <div className="jadwal-toleransi" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
                <Clock size={14} style={{ color: 'var(--warning)' }} />
                <span>Toleransi keterlambatan: <strong>{j.toleransi_menit} menit</strong></span>
              </div>
            </div>

            <div className="card-footer" style={{ justifyContent: 'flex-end' }}>
              <button
                className="btn-icon btn-edit"
                onClick={() => openEdit(j)}
                title="Ubah Jadwal"
              >
                <Edit2 size={15} />
              </button>
              {!j.is_default && (
                <button
                  className="btn-icon btn-delete"
                  onClick={() => handleDelete(j.id, j.nama)}
                  title="Hapus Jadwal"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>{editData ? 'Edit Jadwal Kerja' : 'Tambah Jadwal Kerja'}</h3>
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
                <label className="form-label">Nama Jadwal *</label>
                <input
                  className="form-input"
                  placeholder="Contoh: Jadwal Reguler Kantor Desa"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Jam Masuk *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.jam_masuk}
                    onChange={(e) => setForm({ ...form, jam_masuk: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Pulang *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.jam_pulang}
                    onChange={(e) => setForm({ ...form, jam_pulang: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Toleransi Keterlambatan (Menit) *</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  className="form-input"
                  value={form.toleransi_menit}
                  onChange={(e) => setForm({ ...form, toleransi_menit: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pilih Hari Kerja *</label>
                <div className="hari-selector">
                  {HARI.map((h) => {
                    const selected = form.hari_kerja.includes(h);
                    return (
                      <button
                        type="button"
                        key={h}
                        className={`hari-chip ${selected ? 'hari-aktif' : ''}`}
                        onClick={() => toggleHari(h)}
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                      >
                        {selected && <Check size={13} style={{ marginRight: '4px' }} />}
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '6px' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  />
                  <span>Jadikan jadwal kerja utama (Default untuk semua pegawai)</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner-sm" /> : (editData ? 'Simpan Perubahan' : 'Buat Jadwal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
