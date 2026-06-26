import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, KeyRound, Mail, AlertCircle, Stethoscope, Landmark } from 'lucide-react';

export const DoctorSignup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [docId, setDocId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact || !docId || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('contact', contact);
    formData.append('docId', docId);
    formData.append('email', email);
    formData.append('password', password);
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    const result = await signup(formData, true); // true indicates Doctor Signup
    setLoading(false);

    if (result.success) {
      setSuccess('Doctor profile registered! Redirecting...');
      setTimeout(() => {
        navigate('/doctorLogin');
      }, 2000);
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
          <h2>Doctor Registration</h2>
          <p>Register to prescribe directly to pharmOS</p>
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
            <label className="form-label" htmlFor="name">Doctor Name</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Dr. Smith"
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
              <label className="form-label" htmlFor="docId">SLMC Register Number</label>
              <div className="input-with-icon">
                <Landmark size={16} className="input-icon" />
                <input
                  id="docId"
                  type="text"
                  className="form-input"
                  placeholder="SLMC-99238"
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
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

          <div className="form-group">
            <label className="form-label" htmlFor="profilePic">Profile Picture (Optional)</label>
            <input
              id="profilePic"
              type="file"
              accept="image/*"
              className="form-input"
              style={{ padding: '8px 12px' }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full doctor-btn" disabled={loading}>
            {loading ? 'Creating Doctor Account...' : 'Register Profile'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/doctorLogin">Sign in here</Link></p>
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
          max-width: 440px;
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
