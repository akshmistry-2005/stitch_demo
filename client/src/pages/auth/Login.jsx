import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand-icon">
            <span className="material-icons-outlined">fitness_center</span>
          </div>
          <h1 className="display-md">GymFlow</h1>
          <p className="body-lg" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 360 }}>
            Precision Management for Kinetic Ateliers
          </p>
          <div className="auth-left-decoration">
            <div className="deco-circle deco-1"></div>
            <div className="deco-circle deco-2"></div>
            <div className="deco-circle deco-3"></div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <h2 className="headline-md">Welcome Back</h2>
          <p className="body-md text-muted" style={{ marginBottom: 32 }}>Sign in to your gym management portal</p>

          {error && (
            <div className="auth-error">
              <span className="material-icons-outlined">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <span className="material-icons-outlined">mail</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@gymflow.com" autoComplete="email" />
              </div>
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <a className="body-sm text-primary" href="#" style={{ fontWeight: 500 }}>Forgot?</a>
              </div>
              <div className="form-input-wrapper">
                <span className="material-icons-outlined">lock</span>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
              </div>
              <p className="body-sm text-muted" style={{ marginTop: 4 }}>Password must be at least 8 characters</p>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button className="btn btn-secondary btn-lg w-full" style={{ gap: 10 }} disabled>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Sign in with Google
          </button>
          <p className="body-sm text-muted" style={{ textAlign: 'center', marginTop: 4 }}>Google Sign-In will be available once OAuth is configured</p>

          <p className="auth-switch">
            New to the collective? <Link to="/signup">Create an account</Link>
          </p>
          <p className="auth-footer">© {new Date().getFullYear()} Kinetic Precision Systems. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}
