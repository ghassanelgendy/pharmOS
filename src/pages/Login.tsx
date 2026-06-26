import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    if (!val) {
      setEmailError(null);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      setEmailError('Please enter valid email');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter valid email');
      return;
    }

    setLoading(true);
    setError(null);
    const result = await login(email, password, false, rememberMe);
    setLoading(false);
    if (result.success) {
      sessionStorage.setItem('showLoginToast', 'true');
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page animated-fade">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-glow-icon">
            <Sparkles size={24} className="spark-icon" />
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your employee account</p>
        </div>

        {error && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                type="email"
                className={`form-input ${emailError ? 'input-error' : ''}`}
                placeholder="name@pharmacy.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={(e) => validateEmail(e.target.value)}
                required
              />
            </div>
            {emailError && (
              <span className="inline-error-msg">{emailError}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <KeyRound size={16} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group remember-me-group">
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <div className="auth-links-grid">
            <Link to="/signup" className="auth-link">Sign Up</Link>
            <span className="divider-bullet">&bull;</span>
            <button 
              type="button" 
              className="auth-link-btn" 
              onClick={() => alert("Please contact the pharmacy administrator to reset your password.")}
            >
              Forgot Password
            </button>
            <span className="divider-bullet">&bull;</span>
            <button 
              type="button" 
              className="auth-link-btn" 
              onClick={() => alert("For help, please email system support at support@pharmos.com")}
            >
              Need Help?
            </button>
          </div>
          <p className="portal-switch">Are you a Doctor? <Link to="/doctorLogin">Doctor Portal</Link></p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 120px);
          padding: 20px;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 40px 32px;
          border-radius: var(--radius-lg);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .auth-glow-icon {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(13, 148, 136, 0.1);
          border: 1px solid rgba(13, 148, 136, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .spark-icon { color: var(--color-accent-teal); }
        .auth-header h2 { font-size: 24px; font-weight: 700; color: white; }
        .auth-header p { font-size: 13px; color: var(--color-text-secondary); margin-top: 4px; }

        .input-with-icon {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
        }
        .input-with-icon .form-input {
          padding-left: 42px;
          width: 100%;
        }

        .auth-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .auth-alert.error {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .auth-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .auth-link {
          color: var(--color-accent-teal);
          font-weight: 600;
          text-decoration: none;
        }
        .auth-link:hover { text-decoration: underline; }
        .portal-switch {
          border-top: 1px solid var(--border-glass);
          padding-top: 12px;
          margin-top: 12px;
        }
        .inline-error-msg {
          color: #f87171;
          font-size: 11px;
          margin-top: 4px;
          display: block;
        }
        .input-error {
          border-color: rgba(239, 68, 68, 0.5) !important;
        }
        .remember-me-group {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        .remember-me-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--color-text-secondary);
          cursor: pointer;
          user-select: none;
        }
        .remember-me-label input {
          cursor: pointer;
          accent-color: var(--color-accent-teal);
        }
        .auth-links-grid {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 13px;
        }
        .auth-link-btn {
          background: none;
          border: none;
          padding: 0;
          color: var(--color-accent-teal);
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
        }
        .auth-link-btn:hover {
          text-decoration: underline;
        }
        .divider-bullet {
          color: var(--color-text-muted);
          opacity: 0.5;
        }
      `}} />
    </div>
  );
};
