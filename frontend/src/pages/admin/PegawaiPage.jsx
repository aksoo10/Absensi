import { useEffect, useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, UserCheck, UserX,
  Users, Phone, Mail, Building, ShieldCheck, X
} from 'lucide-react';
import api from '../../lib/api';

export default function PegawaiPage() {
  const [pegawais, setPegawais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    nama: '', email: '', password: '', jabatan: '', nip: '', nik: '',
    departemen: 'Pemerintahan Desa', jenis_kelamin: '', no_telepon: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPegawai = (q = '') => {
    setLoading(true);
    api.get('/pegawai', { params: { search: q } })
      .then(({ data }) => setPegawais(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPegawai();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPegawai(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchPegawai('');
  };

  const openAdd = () => {
    setEditData(null);
    setForm({
      nama: '', email: '', password: '', jabatan: '', nip: '', nik: '',
      departemen: 'Pemerintahan Desa', jenis_kelamin: 'L', no_telepon: ''
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditData(p);
    setForm({
      nama: p.nama,
      email: p.user?.email || '',
      jabatan: p.jabatan,
      nip: p.nip || '',
      nik: p.nik || '',
      departemen: p.departemen || 'Pemerintahan Desa',
      jenis_kelamin: p.jenis_kelamin || '',
      no_telepon: p.no_telepon || '',
      password: ''
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editData) {
        await api.put(`/pegawai/${editData.id}`, form);
      } else {
        await api.post('/pegawai', form);
      }
      setShowModal(false);
      fetchPegawai(search);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) setError(Object.values(errs).flat().join(', '));
      else setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Hapus data pegawai "${nama}"? Semua catatan terkait akan dinonaktifkan.`)) return;
    try {
      await api.delete(`/pegawai/${id}`);
      fetchPegawai(search);
    } catch (err) {
      alert('Gagal menghapus pegawai');
    }
  };

  const totalAktif = pegawais.filter(p => p.status === 'aktif').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Pegawai Desa</h1>
          <p className="page-desc">Kelola profil, jabatan, dan kredensial aparatur pemerintah desa</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Tambah Pegawai Baru
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <form onSubmit={handleSearch} className="search-bar">
            <div className="input-wrapper">
              <Search size={18} className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Cari berdasarkan nama lengkap, NIP, NIK, atau jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-secondary">
              Cari Pegawai
            </button>
          </form>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: '700', fontSize: '15px' }}>Daftar Pegawai</span>
            <span className="badge badge-info" style={{ fontSize: '11.5px', marginLeft: '6px' }}>
              {pegawais.length} Pegawai ({totalAktif} Aktif)
            </span>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="table-loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pegawai</th>
                  <th>NIP / Identitas</th>
                  <th>Jabatan & Bagian</th>
                  <th>Kontak</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pegawais.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      {search ? `Tidak ada pegawai yang cocok dengan kata kunci "${search}"` : 'Belum ada data pegawai terdaftar'}
                    </td>
                  </tr>
                ) : pegawais.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-user">
                        <div className="avatar avatar-sm">
                          {p.nama[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: 'var(--text)' }}>{p.nama}</div>
                          <div className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Mail size={11} /> {p.user?.email || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        {p.nip ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {p.nip}
                          </span>
                        ) : (
                          <span className="text-muted text-sm">Tidak ada NIP</span>
                        )}
                      </div>
                      {p.nik && (
                        <div className="text-muted text-xs" style={{ marginTop: '2px' }}>
                          NIK: {p.nik}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="font-medium" style={{ color: 'var(--text)' }}>{p.jabatan}</div>
                      <div className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Building size={11} /> {p.departemen || 'Pemerintahan Desa'}
                      </div>
                    </td>
                    <td>
                      {p.no_telepon ? (
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {p.no_telepon}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
                        {p.status === 'aktif' ? <UserCheck size={12} /> : <UserX size={12} />}
                        {p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns" style={{ justifyContent: 'center' }}>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => openEdit(p)}
                          title="Ubah Data Pegawai"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(p.id, p.nama)}
                          title="Hapus Pegawai"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editData ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                1. Data Pribadi & Identitas
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Nama Lengkap & Gelar *</label>
                  <input
                    className="form-input"
                    placeholder="Contoh: Budi Santoso, S.IP"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">NIP (Nomor Induk Pegawai)</label>
                  <input
                    className="form-input"
                    placeholder="19850101001"
                    value={form.nip}
                    onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">NIK (16 Digit KTP)</label>
                  <input
                    className="form-input"
                    placeholder="16 Digit NIK"
                    maxLength={20}
                    value={form.nik}
                    onChange={(e) => setForm({ ...form, nik: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Jenis Kelamin</label>
                  <select
                    className="form-input"
                    value={form.jenis_kelamin}
                    onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor WhatsApp / HP</label>
                  <input
                    className="form-input"
                    placeholder="0812xxxxxxxx"
                    value={form.no_telepon}
                    onChange={(e) => setForm({ ...form, no_telepon: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px', marginTop: '10px' }}>
                2. Jabatan & Kredensial Login
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Jabatan Struktural *</label>
                  <input
                    className="form-input"
                    placeholder="Contoh: Sekretaris Desa"
                    value={form.jabatan}
                    onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bagian / Departemen</label>
                  <input
                    className="form-input"
                    placeholder="Pemerintahan Desa"
                    value={form.departemen}
                    onChange={(e) => setForm({ ...form, departemen: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Email Login *</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="nama@absensi.desa"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {editData ? 'Ubah Kata Sandi (Opsional)' : 'Kata Sandi Awal *'}
                  </label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder={editData ? 'Kosongkan jika tidak ingin diubah' : 'Minimal 6 karakter'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editData}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-sm" />
                      Menyimpan...
                    </>
                  ) : (
                    editData ? 'Simpan Perubahan' : 'Tambahkan Pegawai'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
