import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LogIn, FileText } from 'lucide-react';

export const TopHeader: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview Dashboard';
    if (path === '/doctor-orders') return 'Doctor Prescriptions & Orders';
    if (path === '/pos') return 'Point of Sale (Checkout)';
    if (path === '/suppliers') return 'Supplier Registry & Contact';
    if (path === '/predictions') return 'AI Demand Forecasting';
    if (path === '/sales') return 'Sales Performance Reports';
    if (path === '/inventory') return 'Drug Stock Inventory';
    if (path === '/warnings') return 'Stock Warning System';
    if (path === '/settings') return 'System Administration';
    if (path === '/login') return 'Cashier & Pharmacist Login';
    if (path === '/signup') return 'Create Cashier/Pharmacist Account';
    if (path === '/doctorLogin') return 'Doctor Portal Login';
    if (path === '/doctorSignup') return 'Register Doctor Account';
    return 'Pharmacy Management System';
  };

  return (
    <header className="top-header glass-panel animated-fade">
      <div className="header-title-section">
        <h1>{getPageTitle()}</h1>
        <p className="header-subtitle">Real-time control and pharmacy data analytics</p>
      </div>

      <div className="header-actions">
        {isAuthenticated && user ? (
          <div className="user-action-group">
            <span className="welcome-tag">
              Signed in as: <strong className="user-email-header">{user.email}</strong>
            </span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="auth-btn-group">
            <Link to="/login" className="btn btn-secondary">
              <LogIn size={16} />
              <span>Employee Portal</span>
            </Link>
            <Link to="/doctorLogin" className="btn btn-primary">
              <FileText size={16} />
              <span>Doctor Portal</span>
            </Link>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 28px;
          border-radius: var(--radius-md);
          margin-bottom: 24px;
          border: 1px solid var(--border-glass);
        }
        
        .header-title-section h1 {
          font-size: 20px;
          font-weight: 700;
          color: white;
        }
        
        .header-subtitle {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-top: 2px;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-action-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .welcome-tag {
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        
        .user-email-header {
          color: var(--color-accent-teal);
        }
        
        .auth-btn-group {
          display: flex;
          gap: 12px;
        }
        
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
          border-radius: var(--radius-sm);
        }
      `}} />
    </header>
  );
};
