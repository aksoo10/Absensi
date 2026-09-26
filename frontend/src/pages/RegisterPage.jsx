import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, Lock, Mail, Eye, EyeOff, AlertCircle,
  ShieldCheck, ArrowRight, User, Briefcase, Hash, UserCheck
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('pegawai'); // 'pegawai' | 'admin'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
        ...(role === 'pegawai' && {
          jabatan: jabatan || 'Staf Perangkat Desa',
          ...(nip && { nip }),
        }),
      };

      const user = await register(payload);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors)[0];
        setError(Array.isArray(firstErr) ? firstErr[0] : firstErr);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError('Tidak dapat terhubung ke server backend (port 8000). Pastikan backend aktif.');
      } else {
        setError(err.message || 'Gagal melakukan pendaftaran akun');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background photo & overlay */}
      <div className="login-bg">
        <div className="login-bg-img" />
        <div className="login-overlay" />
      </div>

      <div style={{ width: '100%', maxWidth: '490px', zIndex: 10, position: 'relative', margin: '24px 0' }}>
        <div className="login-card" style={{ padding: '32px 30px' }}>
          {/* Institution Header Tag */}
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              background: 'rgba(37, 99, 235, 0.08)',
              color: 'var(--primary)',
              border: '1px solid rgba(37, 99, 235, 0.18)'
            }}>
              <ShieldCheck size={13} />
              Portal Resmi Kepegawaian Desa
            </span>
          </div>

          {/* Logo & Identity */}
          <div className="login-logo" style={{ marginBottom: '18px' }}>
            <div className="logo-icon">
              <Building2 size={28} />
            </div>
            <div>
              <h1 className="login-title">Sistem Presensi Desa</h1>
              <p className="login-subtitle">Desa Bailangu Timur</p>
            </div>
          </div>

          <h2 className="login-heading" style={{ fontSize: '20px' }}>Buat Akun Baru</h2>
          <p className="login-desc" style={{ marginBottom: '18px' }}>
            Pilih jenis akun dan lengkapi formulir pendaftaran di bawah ini
          </p>

          {/* Role Selection Tabs (2 Pilihan: Pegawai & Admin) */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Pilih Jenis Akun (Role):
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setRole('pegawai')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: role === 'pegawai' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: role === 'pegawai' ? 'rgba(37, 99, 235, 0.07)' : 'var(--bg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: role === 'pegawai' ? 'var(--primary)' : 'var(--border-light)',
                  color: role === 'pegawai' ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: role === 'pegawai' ? 'var(--primary)' : 'var(--text)'
                  }}>
                    Pegawai Desa
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Presensi & Izin
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: role === 'admin' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: role === 'admin' ? 'rgba(37, 99, 235, 0.07)' : 'var(--bg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: role === 'admin' ? 'var(--primary)' : 'var(--border-light)',
                  color: role === 'admin' ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: role === 'admin' ? 'var(--primary)' : 'var(--text)'
                  }}>
                    Administrator
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Kelola Sistem
                  </div>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" style={{ gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Nama Lengkap</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Ahmad Fadli, S.Sos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Alamat Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="nama@absensi.desa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {role === 'pegawai' && (
              <>
                <div className="form-group">
                  <label htmlFor="reg-jabatan" className="form-label">Jabatan / Posisi</label>
                  <div className="input-wrapper">
                    <Briefcase size={18} className="input-icon" />
                    <input
                      id="reg-jabatan"
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Kaur Keuangan / Kasi Pemerintahan"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-nip" className="form-label">
                    NIP / No. Identitas <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>(Opsional)</span>
                  </label>
                  <div className="input-wrapper">
                    <Hash size={18} className="input-icon" />
                    <input
                      id="reg-nip"
                      type="text"
                      className="form-input"
                      placeholder="Contoh: 19920101001"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Kata Sandi</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Minimal 6 karakter..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPass(!showPass)}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password-confirm" className="form-label">Konfirmasi Kata Sandi</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="reg-password-confirm"
                  type={showConfirmPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Ulangi kata sandi..."
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  aria-label="Toggle password confirmation visibility"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ padding: '12px', fontSize: '14.5px', marginTop: '6px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm" style={{ marginRight: '8px' }} />
                  Mendaftarkan Akun...
                </>
              ) : (
                <>
                  Daftar Sebagai {role === 'admin' ? 'Administrator' : 'Pegawai'}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--text-muted)'
          }}>
            Sudah memiliki akun?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
              Masuk ke Portal
            </Link>
          </div>
        </div>

        <div className="login-footer-info">
          Pemerintah Desa Bailangu Timur &bull; Kec. Sekayu, Kab. Musi Banyuasin, Sumatera Selatan
        </div>
      </div>
    </div>
  );
}
