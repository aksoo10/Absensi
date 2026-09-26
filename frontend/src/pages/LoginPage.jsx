import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        setError('Tidak dapat terhubung ke server backend (port 8000). Pastikan backend aktif.');
      } else {
        setError(err.message || 'Email atau password salah');
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (role) => {
    if (role === 'admin') {
      setEmail('admin@absensi.desa');
      setPassword('admin123');
    } else {
      setEmail('budi.santoso@absensi.desa');
      setPassword('pegawai123');
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
              <h1 className="login-title">SIPRESDES</h1>
              <p className="login-subtitle">Desa Bailangu Timur</p>
            </div>
          </div>

          <h2 className="login-heading">Selamat Datang</h2>
          <p className="login-desc">Silakan masuk dengan akun terdaftar Anda untuk mencatat kehadiran</p>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Alamat Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="nama@absensi.desa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Kata Sandi</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Masukkan kata sandi..."
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

          {/* Quick Demo Selector */}
          <div style={{
            marginTop: '22px',
            padding: '12px 14px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>
              AKSES CEPAT (DEMO):
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDemoAccount('admin')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ShieldCheck size={13} /> Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('pegawai')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--success)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <UserCheck size={13} /> Pegawai (Budi S.)
              </button>
            </div>
          </div>
        </div>

        <div className="login-footer-info">
          Pemerintah Desa Bailangu Timur &bull; Kec. Sekayu, Kab. Musi Banyuasin, Sumatera Selatan
        </div>
      </div>
    </div>
  );
}
