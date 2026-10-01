import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authStorage from '../lib/authStorage';
import { Building2, Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    const token = authStorage.getToken();
    if (user && token) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [email, setEmail] = useState(() => location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(() => location.state?.successMessage || '');
  const [loading, setLoading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);

  useEffect(() => {
    // Clear any unwanted browser credential autofill on mount
    if (!location.state?.registeredEmail) {
      setEmail('');
      setPassword('');
    }
    const timer = setTimeout(() => {
      setIsReadOnly(false);
      if (!location.state?.registeredEmail) {
        setEmail('');
        setPassword('');
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.data?.errors?.email) {
        setError(err.response.data.errors.email[0]);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError('Tidak dapat terhubung ke server backend. Pastikan server backend aktif.');
      } else {
        setError(err.message || 'Email atau password salah');
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

      <div style={{ width: '100%', maxWidth: '460px', zIndex: 10, position: 'relative' }}>
        <div className="login-card">
          {/* Institution Header Tag */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
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
          <div className="login-logo">
            <div className="logo-icon">
              <Building2 size={28} />
            </div>
            <div>
              <h1 className="login-title">Sistem Presensi Desa</h1>
              <p className="login-subtitle">Desa Bailangu Timur</p>
            </div>
          </div>

          <h2 className="login-heading">Selamat Datang</h2>
          <p className="login-desc">Silakan masuk dengan akun terdaftar Anda untuk mencatat kehadiran</p>

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
            {/* Hidden dummy fields to neutralize browser credential autofill */}
            <input type="text" name="fake_email_prevent_autofill" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
            <input type="password" name="fake_pass_prevent_autofill" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />

            <div className="form-group">
              <label htmlFor="email" className="form-label">Alamat Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  name="user_email_field"
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
              <label htmlFor="password" className="form-label">Kata Sandi</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  name="user_password_field"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Masukkan kata sandi..."
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

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ padding: '12px', fontSize: '14.5px', marginTop: '4px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm" style={{ marginRight: '8px' }} />
                  Memverifikasi Akun...
                </>
              ) : (
                <>
                  Masuk ke Portal
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Link to Register */}
          <div style={{
            marginTop: '22px',
            textAlign: 'center',
            fontSize: '13.5px',
            color: 'var(--text-muted)'
          }}>
            Belum memiliki akun?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
              Daftar Akun Baru
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
