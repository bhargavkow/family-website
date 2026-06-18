import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login({ inlineMode = false }: { inlineMode?: boolean } = {}) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // In inline mode, parent (ProfileRedirect) handles re-render — don't navigate
    if (user && !inlineMode) navigate(redirect, { replace: true });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form.username.trim(), form.password);
      toast.success('Welcome back!');
      // In inline mode, don't navigate — ProfileRedirect re-renders automatically
      if (!inlineMode) navigate(redirect, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />
      </div>

      <div className="login-card card-glass animate-scale-in">
        {/* Logo */}
        <div className="login-logo">
          <h1 className="login-brand">Baldaniya</h1>
          <p className="login-subtitle">Sign in to your family account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error animate-slide-up" id="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="label" htmlFor="login-username">Username</label>
            <div className="input-wrap">
              <User size={16} className="input-icon" />
              <input
                id="login-username"
                type="text"
                className="input input-with-icon"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="login-password">Password</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="input input-with-icon input-with-icon-right"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPass(!showPass)}
                aria-label="Toggle password visibility"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
            id="login-submit"
          >
            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
