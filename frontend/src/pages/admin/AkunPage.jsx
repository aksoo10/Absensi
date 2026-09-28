import { useEffect, useState } from 'react';
import {
  UserCog, Plus, Search, KeyRound, Edit2, Trash2,
  Mail, UserCheck, Check, Copy, Eye, EyeOff,
  AlertCircle, RefreshCw, X, Briefcase, Hash
} from 'lucide-react';
import api from '../../lib/api';

export default function AkunPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form Account (Add / Edit)
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    role: 'pegawai',
    jabatan: '',
    nip: '',
    nik: '',
    password: ''
  });

  // Form Reset Password
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users', {
      params: {
        search: search || undefined,
        role: 'pegawai'
      }
    })
      .then(({ data }) => setUsers(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleClearSearch = () => {
    setSearch('');
    api.get('/users', { params: { role: 'pegawai' } })
      .then(({ data }) => setUsers(data.data || []))
      .catch(console.error);
  };

  // Open Add Modal
  const openAddModal = () => {
    setSelectedUser(null);
    setAccountForm({
      name: '',
      email: '',
      role: 'pegawai',
      jabatan: '',
      nip: '',
      nik: '',
      password: ''
    });
    setError('');
    setShowAccountModal(true);
  };

  // Open Edit Modal
  const openEditModal = (u) => {
    setSelectedUser(u);
    setAccountForm({
      name: u.name,
      email: u.email,
      role: 'pegawai',
      jabatan: u.pegawai?.jabatan || '',
      nip: u.pegawai?.nip || '',
      nik: u.pegawai?.nik || '',
      password: ''
    });
    setError('');
    setShowAccountModal(true);
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (u) => {
    setSelectedUser(u);
    setNewPassword('');
    setShowNewPassword(false);
    setError('');
    setShowPasswordModal(true);
  };

  // Submit Add / Edit Account
  const handleSubmitAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (selectedUser) {
        // Edit
        await api.put(`/users/${selectedUser.id}`, { ...accountForm, role: 'pegawai' });
        setSuccessMsg(`Akun pegawai "${accountForm.name}" (${accountForm.email}) berhasil diperbarui.`);
      } else {
        // Add
        await api.post('/users', { ...accountForm, role: 'pegawai' });
        setSuccessMsg(`Akun baru untuk pegawai "${accountForm.name}" berhasil dibuat.`);
      }
      setShowAccountModal(false);
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) {
        setError(Object.values(errs).flat().join(', '));
      } else {
        setError(err.response?.data?.message || 'Gagal menyimpan data akun');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Reset Password
  const handleSubmitResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/users/${selectedUser.id}/reset-password`, { password: newPassword });
      setSuccessMsg(`Kata sandi untuk ${selectedUser.email} berhasil direset.`);
      setShowPasswordModal(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mereset kata sandi');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Account
  const handleDeleteUser = async (u) => {
    if (!confirm(`Hapus akun pegawai "${u.name}" (${u.email})? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      setSuccessMsg(`Akun ${u.email} berhasil dihapus.`);
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus akun');
    }
  };

  const copyEmail = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let pass = 'desa';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  // Stats
  const totalCount = users.length;
  const withJabatanCount = users.filter((u) => u.pegawai?.jabatan).length;
  const withNipCount = users.filter((u) => u.pegawai?.nip).length;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Kelola Akun Pegawai</h1>
          <p className="page-desc">
            Manajemen email, kata sandi, dan kredensial login pegawai desa jika lupa akun
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Tambah Akun Pegawai
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <Check size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '22px' }}>
        <div className="card stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
            <UserCog size={24} />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-label">Total Akun Pegawai</div>
            <div className="stat-card-value">{totalCount}</div>
            <div className="stat-card-subtext">Akun login pegawai terdaftar</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <Briefcase size={24} />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-label">Jabatan Terdata</div>
            <div className="stat-card-value">{withJabatanCount}</div>
            <div className="stat-card-subtext">Pegawai memiliki posisi struktural</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Hash size={24} />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-label">Dengan NIP / Identitas</div>
            <div className="stat-card-value">{withNipCount}</div>
            <div className="stat-card-subtext">Nomor induk resmi terverifikasi</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <Search size={16} className="input-icon" />
              <input
                className="form-input"
                placeholder="Cari berdasarkan nama pegawai, alamat email, atau jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px', height: '40px', fontSize: '13.5px' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-outline" style={{ height: '40px' }}>
              Cari
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pegawai</th>
                <th>Alamat Email Login</th>
                <th>Jabatan / Posisi</th>
                <th>Status Akun</th>
                <th style={{ textAlign: 'center' }}>Tindakan & Pemulihan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto 10px' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Memuat data akun pegawai...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row" style={{ textAlign: 'center', padding: '40px' }}>
                    Tidak ada akun pegawai yang sesuai kriteria pencarian
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    {/* User Identity */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          className="avatar avatar-pegawai"
                          style={{ width: '38px', height: '38px', fontSize: '14px', flexShrink: 0 }}
                        >
                          {u.name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '14px' }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                            {u.pegawai?.nip && <span>NIP: {u.pegawai.nip}</span>}
                            {u.pegawai?.nik && <span>NIK: {u.pegawai.nik}</span>}
                            {!u.pegawai?.nip && !u.pegawai?.nik && <span style={{ opacity: 0.6 }}>Belum ada NIP/NIK</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email with copy button */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '13.5px' }}>
                          {u.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyEmail(u.email, u.id)}
                          title="Salin alamat email"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: copiedId === u.id ? 'var(--success)' : 'var(--text-muted)',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          {copiedId === u.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>

                    {/* Jabatan */}
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                        {u.pegawai?.jabatan || 'Staf Perangkat Desa'}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <UserCheck size={12} /> Aktif
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {/* Reset Password Button */}
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openResetPasswordModal(u)}
                          title="Reset kata sandi pegawai jika lupa"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: '#d97706',
                            borderColor: 'rgba(217, 119, 6, 0.35)',
                            fontSize: '12px',
                            padding: '4px 10px',
                            fontWeight: '600'
                          }}
                        >
                          <KeyRound size={13} /> Reset Sandi
                        </button>

                        {/* Edit Account Button */}
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => openEditModal(u)}
                          title="Ubah data & email pegawai"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Delete Account */}
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteUser(u)}
                          title="Hapus akun pegawai"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL 1: RESET PASSWORD ──────────────────────────── */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>Reset Kata Sandi Pegawai</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selectedUser.name} &bull; {selectedUser.email}
                  </div>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
                type="button"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitResetPassword} className="modal-body">
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                Masukkan kata sandi baru untuk akun pegawai <strong>{selectedUser.name}</strong> ({selectedUser.email}).
                Pegawai dapat langsung menggunakannya untuk login.
              </p>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Kata Sandi Baru *</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={11} /> Buat Otomatis
                  </button>
                </div>
                <div className="input-wrapper">
                  <KeyRound size={17} className="input-icon" />
                  <input
                    className="form-input"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', padding: '0', border: 'none' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Sandi Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: TAMBAH / UBAH AKUN PEGAWAI ──────────────── */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{selectedUser ? 'Ubah Data Akun Pegawai' : 'Tambah Akun Pegawai Baru'}</h3>
              <button
                className="modal-close"
                onClick={() => setShowAccountModal(false)}
                type="button"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitAccount} className="modal-body">
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Nama Lengkap Pegawai *</label>
                <input
                  className="form-input"
                  placeholder="Nama lengkap pegawai..."
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Alamat Email Login *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="nama@absensi.desa"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  required
                />
              </div>

              {/* Jabatan */}
              <div className="form-group">
                <label className="form-label">Jabatan / Posisi</label>
                <input
                  className="form-input"
                  placeholder="Contoh: Kaur Keuangan / Kasi Pemerintahan"
                  value={accountForm.jabatan}
                  onChange={(e) => setAccountForm({ ...accountForm, jabatan: e.target.value })}
                />
              </div>

              {/* NIP */}
              <div className="form-group">
                <label className="form-label">NIP (Opsional)</label>
                <input
                  className="form-input"
                  placeholder="Nomor Induk Pegawai..."
                  value={accountForm.nip}
                  onChange={(e) => setAccountForm({ ...accountForm, nip: e.target.value })}
                />
              </div>

              {/* NIK */}
              <div className="form-group">
                <label className="form-label">NIK (Opsional)</label>
                <input
                  className="form-input"
                  placeholder="16 Digit Nomor Induk Kependudukan (KTP)..."
                  maxLength={20}
                  value={accountForm.nik}
                  onChange={(e) => setAccountForm({ ...accountForm, nik: e.target.value })}
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">
                  {selectedUser ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi Awal *'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={selectedUser ? 'Biarkan kosong jika tidak diubah' : 'Minimal 6 karakter'}
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                  required={!selectedUser}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', padding: '0', border: 'none' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAccountModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : (selectedUser ? 'Simpan Perubahan' : 'Buat Akun Pegawai')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
