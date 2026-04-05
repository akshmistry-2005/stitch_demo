import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Signup() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPw: '', gymName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password || !form.gymName) { setError('Please fill in all required fields'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirmPw) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await signup({ fullName: form.fullName, email: form.email, password: form.password, gymName: form.gymName });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand-icon"><span className="material-icons-outlined">fitness_center</span></div>
          <h1 className="display-md">GymFlow</h1>
          <p className="body-lg" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 360 }}>Start managing your gym with precision and control.</p>
          <div className="auth-left-decoration">
            <div className="deco-circle deco-1"></div>
            <div className="deco-circle deco-2"></div>
            <div className="deco-circle deco-3"></div>
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-container">
          <h2 className="headline-md">Create Account</h2>
          <p className="body-md text-muted" style={{ marginBottom: 32 }}>Set up your gym management portal</p>
          {error && <div className="auth-error"><span className="material-icons-outlined">error</span>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Gym Name *</label>
              <div className="form-input-wrapper"><span className="material-icons-outlined">store</span>
              <input type="text" value={form.gymName} onChange={update('gymName')} placeholder="e.g. Ironclad Fitness" /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Your Full Name *</label>
              <div className="form-input-wrapper"><span className="material-icons-outlined">person</span>
              <input type="text" value={form.fullName} onChange={update('fullName')} placeholder="John Doe" /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <div className="form-input-wrapper"><span className="material-icons-outlined">mail</span>
              <input type="email" value={form.email} onChange={update('email')} placeholder="admin@gym.com" /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="form-input-wrapper"><span className="material-icons-outlined">lock</span>
              <input type="password" value={form.password} onChange={update('password')} placeholder="Min. 8 characters" /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div className="form-input-wrapper"><span className="material-icons-outlined">lock</span>
              <input type="password" value={form.confirmPw} onChange={update('confirmPw')} placeholder="Repeat password" /></div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'Create Account & Gym'}
            </button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
