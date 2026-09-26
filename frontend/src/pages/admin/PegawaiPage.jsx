import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import api from '../../lib/api';

export default function PegawaiPage() {
  const [pegawais, setPegawais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({ nama: '', email: '', password: '', jabatan: '', nip: '', nik: '', departemen: '', jenis_kelamin: '', no_telepon: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPegawai = (q = '') => {
    setLoading(true);
    api.get('/pegawai', { params: { search: q } })
      .then(({ data }) => setPegawais(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPegawai(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPegawai(search);
  };

  const openAdd = () => {
    setEditData(null);
    setForm({ nama: '', email: '', password: '', jabatan: '', nip: '', nik: '', departemen: '', jenis_kelamin: '', no_telepon: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditData(p);
    setForm({ nama: p.nama, email: p.user?.email || '', jabatan: p.jabatan, nip: p.nip || '', nik: p.nik || '', departemen: p.departemen || '', jenis_kelamin: p.jenis_kelamin || '', no_telepon: p.no_telepon || '', password: '' });
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
      fetchPegawai();
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) setError(Object.values(errs).flat().join(', '));
      else setError(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus pegawai ini?')) return;
    try {
      await api.delete(`/pegawai/${id}`);
      fetchPegawai();
    } catch (err) {
      alert('Gagal menghapus pegawai');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Pegawai</h1>
          <p className="page-desc">Kelola data pegawai desa</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Tambah Pegawai
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="search-bar">
            <div className="input-wrapper">
              <Search size={18} className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Cari nama, NIP, NIK, jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary">Cari</button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="table-loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pegawai</th>
                  <th>NIP / NIK</th>
                  <th>Jabatan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pegawais.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">Tidak ada data pegawai</td></tr>
                ) : pegawais.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-user">
                        <div className="avatar-sm">{p.nama[0]}</div>
                        <div>
                          <div className="font-medium">{p.nama}</div>
                          <div className="text-muted text-sm">{p.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{p.nip ? <span className="font-medium">{p.nip}</span> : <span className="text-muted">-</span>}</div>
                      {p.nik && <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>NIK: {p.nik}</div>}
                    </td>
                    <td>{p.jabatan}</td>
                    <td>
                      <span className={`badge ${p.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
                        {p.status === 'aktif' ? <UserCheck size={12} /> : <UserX size={12} />}
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon btn-edit" onClick={() => openEdit(p)} title="Edit"><Edit2 size={15} /></button>
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(p.id)} title="Hapus"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editData ? 'Edit Pegawai' : 'Tambah Pegawai'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="alert alert-error"><span>{error}</span></div>}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input className="form-input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Jabatan *</label>
                  <input className="form-input" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">NIP</label>
                  <input className="form-input" placeholder="Nomor Induk Pegawai" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">NIK (16 Digit)</label>
                  <input className="form-input" placeholder="Nomor Induk Kependudukan" maxLength={20} value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} />
                </div>
                {!editData && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">Departemen</label>
                  <input className="form-input" value={form.departemen} onChange={(e) => setForm({ ...form, departemen: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Jenis Kelamin</label>
                  <select className="form-input" value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}>
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">No. Telepon</label>
                  <input className="form-input" value={form.no_telepon} onChange={(e) => setForm({ ...form, no_telepon: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner-sm" /> : (editData ? 'Simpan' : 'Tambah')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
