import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, KeyRound,
  ShieldCheck, CheckCircle2, AlertCircle, Save, Briefcase, Hash,
  Building2, BadgeCheck, Check, Sparkles
} from 'lucide-react';

export default function AkunPegawaiPage() {
  const { user, updateUser } = useAuth();

  // Profile & Contact form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    no_telepon: user?.pegawai?.no_telepon || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sync state if user changes or fetch latest user profile
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        no_telepon: user.pegawai?.no_telepon || '',
      });
    }

    // Refresh fresh profile from server
    api.get('/user')
      .then(({ data }) => {
        updateUser(data);
        setProfileForm({
          name: data.name || '',
          email: data.email || '',
          no_telepon: data.pegawai?.no_telepon || '',
        });
      })
      .catch(() => {});
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const { data } = await api.put('/profile', {
        name: profileForm.name,
        email: profileForm.email,
        no_telepon: profileForm.no_telepon,
        no_hp: profileForm.no_telepon,
      });

      updateUser(data.user);
      setProfileSuccess(data.message || 'Profil dan alamat email berhasil diperbarui!');
    } catch (err) {
      if (err.response?.data?.errors?.email) {
        setProfileError(err.response.data.errors.email[0]);
      } else if (err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors)[0];
        setProfileError(Array.isArray(firstErr) ? firstErr[0] : firstErr);
      } else {
        setProfileError(err.response?.data?.message || 'Gagal memperbarui informasi profil.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.password.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.password !== passwordForm.password_confirmation) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      setPasswordLoading(false);
      return;
    }

    try {
      const { data } = await api.put('/profile/password', {
        current_password: passwordForm.current_password,
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      });

      setPasswordSuccess(data.message || 'Kata sandi berhasil diperbarui! Gunakan kata sandi baru ini untuk login berikutnya.');
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (err) {
      if (err.response?.data?.errors?.current_password) {
        setPasswordError(err.response.data.errors.current_password[0]);
      } else if (err.response?.data?.errors?.password) {
        setPasswordError(err.response.data.errors.password[0]);
      } else if (err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors)[0];
        setPasswordError(Array.isArray(firstErr) ? firstErr[0] : firstErr);
      } else {
        setPasswordError(err.response?.data?.message || 'Gagal memperbarui kata sandi.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'P';
  const jabatan = user?.pegawai?.jabatan || 'Aparatur Desa';
  const nip = user?.pegawai?.nip || '-';
  const departemen = user?.pegawai?.departemen || 'Pemerintahan Desa';

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan Akun & Profil</h1>
          <p className="page-desc">Kelola data profil, alamat email resmi, dan keamanan kata sandi akun presensi Anda</p>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)',
          padding: '24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: '700',
              boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.8)'
            }}>
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>
                  {user?.name || 'Nama Pegawai'}
                </h2>
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <BadgeCheck size={14} /> Akun Aktif
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                {jabatan} &bull; {departemen}
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: '#ffffff',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              fontSize: '12.5px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Mail size={15} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: '600', color: 'var(--text)' }}>{user?.email}</span>
            </div>
            {user?.pegawai?.no_telepon && (
              <div style={{
                background: '#ffffff',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Phone size={15} style={{ color: '#10b981' }} />
                <span style={{ fontWeight: '600', color: 'var(--text)' }}>{user.pegawai.no_telepon}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: 2 Cards (Profil & Email + Ganti Password) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Card 1: Informasi Profil & Kontak */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={19} />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0, fontSize: '16px' }}>Data Profil & Alamat Email</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Perbarui identitas, email login, dan nomor kontak Anda
              </p>
            </div>
          </div>

          <div className="card-body">
            {profileSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} autoComplete="off">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Nama Lengkap</label>
                <div className="input-wrapper">
                  <User size={17} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Masukkan nama lengkap Anda..."
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">
                  Alamat Email <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>(Untuk Login)</span>
                </label>
                <div className="input-wrapper">
                  <Mail size={17} className="input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="nama@absensi.desa"
                    required
                  />
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Email ini digunakan saat masuk ke sistem presensi.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Nomor WhatsApp / HP</label>
                <div className="input-wrapper">
                  <Phone size={17} className="input-icon" />
                  <input
                    type="tel"
                    className="form-input"
                    value={profileForm.no_telepon}
                    onChange={(e) => setProfileForm({ ...profileForm, no_telepon: e.target.value })}
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              <div style={{
                background: 'var(--bg-alt, #f8fafc)',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Data Kepegawaian (Terkunci)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', display: 'block' }}>NIP / No. Identitas</span>
                    <span style={{ fontWeight: '600', color: 'var(--text)' }}>{nip}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', display: 'block' }}>Jabatan Struktural</span>
                    <span style={{ fontWeight: '600', color: 'var(--text)' }}>{jabatan}</span>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                  * Data kepegawaian struktural hanya dapat disesuaikan oleh Administrator Desa.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={profileLoading}
              >
                {profileLoading ? (
                  <>
                    <span className="spinner-sm" />
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan Perubahan Profil
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Keamanan & Ganti Kata Sandi */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <KeyRound size={19} />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0, fontSize: '16px' }}>Keamanan & Kata Sandi</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Perbarui kata sandi secara berkala untuk menjaga keamanan akun
              </p>
            </div>
          </div>

          <div className="card-body">
            {passwordSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} autoComplete="off">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Kata Sandi Saat Ini</label>
                <div className="input-wrapper">
                  <Lock size={17} className="input-icon" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    className="form-input"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="Masukkan kata sandi lama Anda..."
                    required
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    tabIndex={-1}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Kata Sandi Baru</label>
                <div className="input-wrapper">
                  <KeyRound size={17} className="input-icon" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    className="form-input"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    placeholder="Minimal 6 karakter baru..."
                    required
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowNewPass(!showNewPass)}
                    tabIndex={-1}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Konfirmasi Kata Sandi Baru</label>
                <div className="input-wrapper">
                  <ShieldCheck size={17} className="input-icon" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    className="form-input"
                    value={passwordForm.password_confirmation}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                    placeholder="Ketik ulang kata sandi baru..."
                    required
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    tabIndex={-1}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                background: 'rgba(37, 99, 235, 0.05)',
                border: '1px solid rgba(37, 99, 235, 0.15)',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '12px',
                color: 'var(--text-muted)'
              }}>
                <ShieldCheck size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Gunakan kombinasi huruf besar, huruf kecil, dan angka agar kata sandi Anda tidak mudah ditebak.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                }}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <>
                    <span className="spinner-sm" />
                    Memperbarui Kata Sandi...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Perbarui Kata Sandi
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
