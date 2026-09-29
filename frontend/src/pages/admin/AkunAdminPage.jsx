import { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck, Plus, Search, KeyRound, Edit2, Trash2,
  Mail, Check, Copy, Eye, EyeOff, AlertCircle, RefreshCw,
  X, UserCheck, Loader2
} from 'lucide-react';
import api from '../../lib/api';
import cache from '../../lib/cache';
import { useAuth } from '../../contexts/AuthContext';

export default function AkunAdminPage() {
  const { user: currentUser, updateUser } = useAuth();
  const cached = cache.get('admin_akun_admin');
  const [admins, setAdmins] = useState(() => cached || []);
  const [loading, setLoading] = useState(() => cached === null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);

  // Modal State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form Account (Add / Edit)
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    role: 'admin',
    password: ''
  });

  // Form Reset Password
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filteredAdmins = useMemo(() => {
    if (!search.trim()) return admins;
    const q = search.toLowerCase();
    return admins.filter((a) =>
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q))
    );
  }, [admins, search]);

  const fetchAdmins = (q = '', isBackground = false) => {
    if (!isBackground && cache.get('admin_akun_admin') === null) setLoading(true);
    if (isBackground) setSearching(true);

    cache.fetchDedup(`admin_akun_admin_${q || 'all'}`, () =>
      api.get('/users', {
        params: {
          search: q || undefined,
          role: 'admin'
        }
      })
    )
      .then(({ data }) => {
        const list = data.data || [];
        if (!q) {
          setAdmins(list);
          cache.set('admin_akun_admin', list);
        } else {
          setAdmins((prev) => {
            const map = new Map(prev.map((item) => [item.id, item]));
            for (const item of list) {
              map.set(item.id, item);
            }
            return Array.from(map.values());
          });
        }
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setSearching(false);
      });
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(() => {
      fetchAdmins(search.trim(), true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAdmins(search.trim(), true);
  };

  const handleClearSearch = () => {
    setSearch('');
  };

  // Open Add Modal
  const openAddModal = () => {
    setSelectedAdmin(null);
    setAccountForm({
      name: '',
      email: '',
      role: 'admin',
      password: ''
    });
    setError('');
    setShowAccountModal(true);
  };

  // Open Edit Modal
  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setAccountForm({
      name: admin.name,
      email: admin.email,
      role: 'admin',
      password: ''
    });
    setError('');
    setShowAccountModal(true);
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (admin) => {
    setSelectedAdmin(admin);
    setNewPassword('');
    setShowNewPassword(false);
    setError('');
    setShowPasswordModal(true);
  };

  // Submit Add / Edit Admin
  const handleSubmitAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (selectedAdmin) {
        // Edit
        const { data } = await api.put(`/users/${selectedAdmin.id}`, {
          name: accountForm.name,
          email: accountForm.email,
          role: 'admin',
          password: accountForm.password || undefined
        });

        // Update current auth context if editing own profile
        if (currentUser?.id === selectedAdmin.id) {
          updateUser({
            ...currentUser,
            name: accountForm.name,
            email: accountForm.email
          });
        }

        setSuccessMsg(`Akun administrator "${accountForm.name}" (${accountForm.email}) berhasil diperbarui.`);
      } else {
        // Add
        await api.post('/users', {
          name: accountForm.name,
          email: accountForm.email,
          role: 'admin',
          password: accountForm.password
        });
        setSuccessMsg(`Akun administrator baru "${accountForm.name}" berhasil dibuat.`);
      }
      cache.remove('admin_akun_admin');
      setShowAccountModal(false);
      fetchAdmins();
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) {
        setError(Object.values(errs).flat().join(', '));
      } else {
        setError(err.response?.data?.message || 'Gagal menyimpan data administrator');
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
      await api.put(`/users/${selectedAdmin.id}/reset-password`, { password: newPassword });
      setSuccessMsg(`Kata sandi untuk administrator ${selectedAdmin.email} berhasil diperbarui.`);
      setShowPasswordModal(false);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui kata sandi');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Admin Account
  const handleDeleteAdmin = async (admin) => {
    if (admin.id === currentUser?.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }
    if (!confirm(`Hapus akun administrator "${admin.name}" (${admin.email})? Tindakan ini tidak dapat dibatalkan.`)) return;

    const previous = [...admins];
    const updated = admins.filter((a) => a.id !== admin.id);
    setAdmins(updated);
    cache.set('admin_akun_admin', updated);
    setSuccessMsg(`Akun administrator ${admin.email} berhasil dihapus.`);
    setTimeout(() => setSuccessMsg(''), 4500);

    try {
      await api.delete(`/users/${admin.id}`);
      fetchAdmins('', true);
    } catch (err) {
      setAdmins(previous);
      cache.set('admin_akun_admin', previous);
      alert(err.response?.data?.message || 'Gagal menghapus akun administrator');
    }
  };

  const copyEmail = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let pass = 'admin';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Kelola Akun Administrator</h1>
          <p className="page-desc">
            Manajemen email, kata sandi, dan kredensial login akun administrator sistem presensi
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Tambah Akun Administrator
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <Check size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <Search size={16} className="input-icon" />
              <input
                className="form-input"
                placeholder="Cari berdasarkan nama atau email administrator..."
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

      {/* Admins Table */}
      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Alamat Email Login</th>
                <th>Peran & Hak Akses</th>
                <th>Status Akun</th>
                <th style={{ textAlign: 'center' }}>Tindakan & Pengaturan</th>
              </tr>
            </thead>
            <tbody>
              {loading && cache.get('admin_akun_admin') === null ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto 10px' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Memuat data akun administrator...</span>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row" style={{ textAlign: 'center', padding: '40px' }}>
                    Tidak ada akun administrator yang sesuai kriteria pencarian
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isSelf = admin.id === currentUser?.id;
                  return (
                    <tr key={admin.id}>
                      {/* Identity */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            className="avatar"
                            style={{
                              width: '38px',
                              height: '38px',
                              fontSize: '14px',
                              flexShrink: 0,
                              background: isSelf ? 'var(--primary)' : 'var(--border-light)',
                              color: isSelf ? '#fff' : 'var(--text)'
                            }}
                          >
                            {admin.name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '14px' }}>
                                {admin.name}
                              </span>
                              {isSelf && (
                                <span className="badge badge-primary" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                  Anda
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              ID Akun: #{admin.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email with copy button */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Mail size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '13.5px' }}>
                            {admin.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyEmail(admin.email, admin.id)}
                            title="Salin alamat email"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: copiedId === admin.id ? 'var(--success)' : 'var(--text-muted)',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            {copiedId === admin.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <ShieldCheck size={12} /> Administrator Desa
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
                          {/* Reset / Ganti Sandi */}
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openResetPasswordModal(admin)}
                            title="Ganti atau reset kata sandi"
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
                            <KeyRound size={13} /> {isSelf ? 'Ganti Sandi' : 'Reset Sandi'}
                          </button>

                          {/* Edit Name & Email */}
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => openEditModal(admin)}
                            title="Ubah nama dan alamat email"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete Account */}
                          {!isSelf && (
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => handleDeleteAdmin(admin)}
                              title="Hapus akun administrator ini"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL 1: GANTI / RESET KATA SANDI ──────────────────── */}
      {showPasswordModal && selectedAdmin && (
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
                  <h3 style={{ margin: 0, fontSize: '16px' }}>
                    {selectedAdmin.id === currentUser?.id ? 'Ganti Kata Sandi Saya' : 'Reset Kata Sandi Administrator'}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selectedAdmin.name} &bull; {selectedAdmin.email}
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
                {selectedAdmin.id === currentUser?.id
                  ? 'Masukkan kata sandi baru untuk akun administrator Anda. Pastikan kata sandi aman dan mudah Anda ingat.'
                  : `Masukkan kata sandi baru untuk akun ${selectedAdmin.email}. Administrator terkait dapat langsung login menggunakan sandi ini.`}
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

      {/* ─── MODAL 2: TAMBAH / UBAH AKUN ADMINISTRATOR ────────── */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{selectedAdmin ? 'Ubah Data Akun Administrator' : 'Tambah Akun Administrator Baru'}</h3>
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
                <label className="form-label">Nama Lengkap Administrator *</label>
                <input
                  className="form-input"
                  placeholder="Contoh: Admin Desa Bailangu Timur"
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
                  placeholder="admin@absensi.desa"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">
                  {selectedAdmin ? 'Kata Sandi Baru (Kosongkan jika tidak ingin mengubah sandi)' : 'Kata Sandi Awal *'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={selectedAdmin ? 'Biarkan kosong jika tidak diubah' : 'Minimal 6 karakter'}
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                  required={!selectedAdmin}
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
                  {submitting ? 'Menyimpan...' : (selectedAdmin ? 'Simpan Perubahan' : 'Buat Akun Administrator')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
