import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Stethoscope, 
  ShoppingCart, 
  Truck, 
  TrendingUp, 
  BarChart3, 
  Package, 
  AlertTriangle, 
  Settings, 
  Activity,
  Coins,
  Clock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <aside className="sidebar glass-panel animated-fade">
        <div className="sidebar-brand">
          <Activity size={24} className="brand-icon" />
          <span>pharmOS</span>
        </div>
        <div className="sidebar-footer">
          <p className="no-auth-message">
            Log in to access management panels.
          </p>
        </div>
      </aside>
    );
  }

  const role = user.role;

  // Determine what links are allowed per role
  const showDashboard = true;
  const showDoctorOrders = true; // All authenticated users in original logic had access
  const showPOS = true; // All authenticated users had access
  const showSuppliers = role === 'Pharmacist' || role === 'Assistant Pharmacist';
  const showPredictions = role === 'Pharmacist';
  const showSales = role === 'Pharmacist' || role === 'Assistant Pharmacist';
  const showInventory = true; // All authenticated users had access
  const showWarnings = true;
  const showSettings = role === 'Pharmacist'; // Only top Pharmacist/Admin manages accounts

  return (
    <aside className="sidebar glass-panel animated-fade">
      <div className="sidebar-brand">
        <Activity size={24} className="brand-icon" />
        <div>
          <span className="brand-name">pharmOS</span>
          <span className="brand-sub">Management v2</span>
        </div>
      </div>

      <div className="user-profile-section">
        <div className="avatar">
          {role.charAt(0)}
        </div>
        <div className="user-info">
          <p className="user-email" title={user.email}>{user.email}</p>
          <p className="user-role">{role}</p>
        </div>
      </div>

      <nav className="sidebar-menu">
        {showDashboard && (
          <NavLink to="/" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        )}

        {showDoctorOrders && (
          <NavLink to="/doctor-orders" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <Stethoscope size={18} />
            <span>Doctor Orders</span>
          </NavLink>
        )}

        {showPOS && (
          <>
            <NavLink to="/pos" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <ShoppingCart size={18} />
              <span>Point of Sale</span>
            </NavLink>
            <NavLink to="/cashier-monitor" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <Coins size={18} />
              <span>Cash Register</span>
            </NavLink>
            <NavLink to="/shifts-history" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <Clock size={18} />
              <span>Shifts History</span>
            </NavLink>
          </>
        )}

        {showSuppliers && (
          <NavLink to="/suppliers" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <Truck size={18} />
            <span>Suppliers</span>
          </NavLink>
        )}

        {showPredictions && (
          <NavLink to="/predictions" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <TrendingUp size={18} />
            <span>Predictions</span>
          </NavLink>
        )}

        {showSales && (
          <NavLink to="/sales" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <BarChart3 size={18} />
            <span>Sales Analytics</span>
          </NavLink>
        )}

        {showInventory && (
          <NavLink to="/inventory" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <Package size={18} />
            <span>Inventory</span>
          </NavLink>
        )}

        {showWarnings && (
          <NavLink to="/warnings" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <AlertTriangle size={18} />
            <span>Alerts & Stocks</span>
          </NavLink>
        )}

        {showSettings && (
          <NavLink to="/settings" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        )}
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar {
          width: 260px;
          height: calc(100vh - 32px);
          position: fixed;
          top: 16px;
          left: 16px;
          bottom: 16px;
          display: flex;
          flex-direction: column;
          padding: 24px;
          z-index: 100;
          overflow-y: auto;
          border-radius: var(--radius-lg);
        }
        
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .brand-icon {
          color: var(--color-accent-teal);
          filter: drop-shadow(0 0 8px var(--color-accent-teal-glow));
        }
        
        .brand-name {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.5px;
          display: block;
        }
        
        .brand-sub {
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 600;
          display: block;
          margin-top: -2px;
        }
        
        .user-profile-section {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-glass);
          margin-bottom: 24px;
        }
        
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent-teal), var(--color-accent-blue));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }
        
        .user-info {
          flex: 1;
          min-width: 0;
        }
        
        .user-email {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .user-role {
          font-size: 10px;
          color: var(--color-text-secondary);
          font-weight: 500;
          margin-top: 1px;
        }
        
        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        
        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: var(--transition-smooth);
        }
        
        .menu-item:hover {
          color: var(--color-text-primary);
          background: rgba(255, 255, 255, 0.03);
        }
        
        .menu-item.active {
          color: white;
          background: linear-gradient(135deg, rgba(13, 148, 136, 0.2), rgba(2, 132, 199, 0.2));
          border: 1px solid rgba(13, 148, 136, 0.3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .menu-item.active svg {
          color: var(--color-accent-teal);
        }
        
        .no-auth-message {
          font-size: 12px;
          color: var(--color-text-muted);
          text-align: center;
          line-height: 1.6;
        }
        
        .sidebar-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--border-glass);
        }
      `}} />
    </aside>
  );
};
