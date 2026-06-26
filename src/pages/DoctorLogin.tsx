import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, Stethoscope } from 'lucide-react';

export const DoctorLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(email, password, true); // true indicates Doctor Login
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page animated-fade">
      <div className="auth-card glass-panel doctor-theme">
        <div className="auth-header">
          <div className="auth-glow-icon">
            <Stethoscope size={24} className="spark-icon" />
          </div>
          <h2>Doctor Portal</h2>
          <p>Sign in to upload prescriptions & manage orders</p>
        </div>

        {error && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Doctor Email</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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

          <button type="submit" className="btn btn-primary w-full doctor-btn" disabled={loading}>
            {loading ? 'Accessing Portal...' : 'Doctor Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Not registered yet? <Link to="/doctorSignup">Doctor Registration</Link></p>
          <p className="portal-switch">Are you an Employee? <Link to="/login">Employee Portal</Link></p>
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

        .doctor-theme {
          background: rgba(15, 23, 42, 0.7);
          border-color: rgba(2, 132, 199, 0.2);
        }

        .doctor-theme .spark-icon {
          color: var(--color-accent-blue);
        }

        .doctor-theme .auth-glow-icon {
          background: rgba(2, 132, 199, 0.1);
          border-color: rgba(2, 132, 199, 0.2);
        }

        .doctor-btn {
          background: linear-gradient(135deg, var(--color-accent-blue), #2563eb);
          box-shadow: 0 4px 14px 0 rgba(2, 132, 199, 0.3);
        }

        .doctor-btn:hover {
          box-shadow: 0 6px 20px 0 rgba(2, 132, 199, 0.5);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .auth-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .auth-header p {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-top: 4px;
        }

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

        .w-full {
          width: 100%;
          padding: 12px;
        }

        .auth-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 13px;
          color: var(--color-text-secondary);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .auth-footer a {
          color: var(--color-accent-blue);
          font-weight: 600;
          text-decoration: none;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }

        .portal-switch {
          border-top: 1px solid var(--border-glass);
          padding-top: 12px;
          margin-top: 4px;
        }
      `}} />
    </div>
  );
};
