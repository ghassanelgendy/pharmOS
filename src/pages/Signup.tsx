import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, KeyRound, Mail, AlertCircle, Award, CreditCard } from 'lucide-react';

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [nic, setNic] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Pharmacist' | 'Assistant Pharmacist' | 'Cashier'>('Cashier');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact || !nic || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signup({ name, contact, nic, email, password, role }, false);
    setLoading(false);

    if (result.success) {
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page animated-fade">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-glow-icon">
            <Award size={24} className="spark-icon" />
          </div>
          <h2>Join pharmOS</h2>
          <p>Register a new staff/pharmacist account</p>
        </div>

        {error && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert success">
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="contact">Contact No</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input
                  id="contact"
                  type="text"
                  className="form-input"
                  placeholder="01012345678"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="nic">NIC Number</label>
              <div className="input-with-icon">
                <CreditCard size={16} className="input-icon" />
                <input
                  id="nic"
                  type="text"
                  className="form-input"
                  placeholder="29501021234567"
                  value={nic}
                  onChange={(e) => setNic(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Role</label>
            <select
              id="role"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="Cashier">Cashier</option>
              <option value="Assistant Pharmacist">Assistant Pharmacist</option>
              <option value="Pharmacist">Pharmacist (Administrator)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@pharmacy.com"
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

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
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
          max-width: 440px;
          padding: 40px 32px;
          border-radius: var(--radius-lg);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 24px;
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

        .spark-icon {
          color: var(--color-accent-teal);
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

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
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

        select.form-input {
          width: 100%;
          background-color: var(--bg-tertiary);
          cursor: pointer;
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

        .auth-alert.success {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
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
          color: var(--color-accent-teal);
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
