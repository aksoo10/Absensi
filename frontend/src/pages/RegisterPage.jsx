import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, Lock, Mail, Eye, EyeOff, AlertCircle,
  ShieldCheck, ArrowRight, User, Briefcase, Hash, Phone
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);

  // Mencegah browser autofill mengisi username/password lama ke form registrasi
  useEffect(() => {
    setName('');
    setEmail('');
    setNoHp('');
    setJabatan('');
    setNip('');
    setPassword('');
    setPasswordConfirmation('');
    const timer = setTimeout(() => {
      setIsReadOnly(false);
      setName('');
      setEmail('');
      setNoHp('');
      setJabatan('');
      setNip('');
      setPassword('');
      setPasswordConfirmation('');
    }, 300);
    return () => clearTimeout(timer);
  }, []);

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
        role: 'pegawai',
        jabatan: jabatan || 'Staf Perangkat Desa',
        ...(nip && { nip }),
        ...(noHp && { no_telepon: noHp, no_hp: noHp }),
      };

      await register(payload);
      navigate('/login', {
        state: {
          successMessage: 'Pendaftaran akun pegawai berhasil! Silakan masukkan kata sandi Anda untuk masuk ke sistem.',
          registeredEmail: email,
        },
        replace: true,
      });
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors)[0];
        let msg = Array.isArray(firstErr) ? firstErr[0] : firstErr;
        if (msg === 'validation.unique') {
          msg = 'Email atau data ini sudah terdaftar di sistem.';
        }
        setError(msg);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError('Tidak dapat terhubung ke server backend. Pastikan server backend aktif.');
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

      <div style={{ width: '100%', maxWidth: '470px', zIndex: 10, position: 'relative', margin: '24px 0' }}>
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

          <h2 className="login-heading" style={{ fontSize: '21px' }}>Registrasi Pegawai</h2>
          <p className="login-desc" style={{ marginBottom: '20px' }}>
            Lengkapi data di bawah ini untuk mendaftarkan akun presensi Anda
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" style={{ gap: '14px' }} autoComplete="off">
            {/* Hidden dummy fields to intercept and neutralize browser credential autofill */}
            <input
              type="text"
              name="fake_reg_user_prevent_autofill"
              style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="username"
              readOnly
            />
            <input
              type="password"
              name="fake_reg_pass_prevent_autofill"
              style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="current-password"
              readOnly
            />

            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Nama Lengkap</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="reg-name"
                  name="register_user_fullname"
                  type="text"
                  className="form-input"
                  placeholder="Masukkan nama lengkap..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={isReadOnly}
                  onFocus={() => setIsReadOnly(false)}
                  autoComplete="off"
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
                  name="register_user_email"
                  type="email"
                  className="form-input"
                  placeholder="nama@absensi.desa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={isReadOnly}
                  onFocus={() => setIsReadOnly(false)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone" className="form-label">
                Nomor HP / WhatsApp <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>(Opsional)</span>
              </label>
              <div className="input-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  id="reg-phone"
                  name="register_user_phone"
                  type="tel"
                  className="form-input"
                  placeholder="Contoh: 081234567890"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  readOnly={isReadOnly}
                  onFocus={() => setIsReadOnly(false)}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-jabatan" className="form-label">Jabatan / Posisi</label>
              <div className="input-wrapper">
                <Briefcase size={18} className="input-icon" />
                <input
                  id="reg-jabatan"
                  name="register_user_position"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Kaur Keuangan / Kasi Pemerintahan"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  readOnly={isReadOnly}
                  onFocus={() => setIsReadOnly(false)}
                  autoComplete="off"
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
                  name="register_user_identity"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: 19920101001"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  readOnly={isReadOnly}
                  onFocus={() => setIsReadOnly(false)}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Kata Sandi</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="reg-password"
                  name="register_account_password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Minimal 6 karakter..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  readOnly={isReadOnly}
                  onFocus={() => setIsReadOnly(false)}
                  autoComplete="new-password"
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
                  name="register_account_password_confirm"
                  type={showConfirmPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Ulangi kata sandi..."
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  readOnly={isReadOnly}
                  onFocus={() => setIsReadOnly(false)}
                  autoComplete="new-password"
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
                  Daftar Akun Pegawai
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
