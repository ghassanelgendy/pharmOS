import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Coins, 
  RotateCw, 
  Edit3, 
  Save, 
  X, 
  AlertCircle,
  Banknote
} from 'lucide-react';

interface CashRegister {
  notes200: number;
  notes100: number;
  notes50: number;
  notes20: number;
  notes10: number;
  notes5: number;
  notes1: number;
  totalAmount: number;
  lastUpdated: string;
}

export const CashierMonitor: React.FC = () => {
  const { user } = useAuth();
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    notes200: 0,
    notes100: 0,
    notes50: 0,
    notes20: 0,
    notes10: 0,
    notes5: 0,
    notes1: 0
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRegisterData = async () => {
    console.log('CashierMonitor: fetchRegisterData triggered, user token exists:', !!user?.token);
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${user?.token || ''}` };
      const response = await fetch('/api/cash-register', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to retrieve cash register state');
      }

      const data = await response.json();
      setRegister(data.register);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch cash register data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisterData();
  }, [user]);

  const handleOpenAdjustModal = () => {
    if (!register) return;
    setFormData({
      notes200: register.notes200,
      notes100: register.notes100,
      notes50: register.notes50,
      notes20: register.notes20,
      notes10: register.notes10,
      notes5: register.notes5,
      notes1: register.notes1
    });
    setIsModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${user?.token || ''}`,
        'Content-Type': 'application/json'
      };
      const response = await fetch('/api/cash-register/adjust', {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to adjust register counts');
      }

      const data = await response.json();
      setRegister(data.register);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error occurred during adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cashier-monitor-page animated-fade">
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-fade cashier-adjust-modal">
            <div className="modal-header">
              <h3>Adjust Cash Register Float</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="modal-form">
              <p className="modal-subtitle">Enter the exact count of each banknote in the drawer right now.</p>
              
              <div className="bill-count-grid">
                {[200, 100, 50, 20, 10, 5, 1].map((denom) => {
                  const field = `notes${denom}` as keyof typeof formData;
                  return (
                    <div className="bill-count-field" key={denom}>
                      <label className="bill-count-label">EGP {denom}</label>
                      <input 
                        type="number" 
                        min="0"
                        className="form-input bill-count-input"
                        value={formData[field]}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          [field]: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Save size={16} />
                  <span>{submitting ? 'Saving...' : 'Apply Adjustments'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Cashier Monitor</h1>
          <p>Real-time oversight of the cash drawer register float balance and Egyptian banknote breakdown</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchRegisterData} disabled={loading} style={{ marginRight: '12px' }}>
            <RotateCw size={16} className={loading ? 'spin-animation' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdjustModal} disabled={!register}>
            <Edit3 size={16} />
            <span>Adjust Register Float</span>
          </button>
        </div>
      </div>

      {loading && !register ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading register statistics...</p>
        </div>
      ) : error ? (
        <div className="auth-alert error" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : register ? (
        <div className="monitor-content-grid">
          
          {/* Main Float Card */}
          <div className="summary-float-card glass-panel">
            <div className="summary-icon">
              <Coins size={36} className="text-teal" />
            </div>
            <div className="summary-info">
              <h2>Total Float in Drawer</h2>
              <span className="float-amount">EGP {register.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <p className="last-updated">Last transaction / shift update: {new Date(register.lastUpdated).toLocaleString()}</p>
            </div>
          </div>

          {/* Banknote slots */}
          <div className="banknote-slots-section">
            <h3>Register Drawer Banknote Slots</h3>
            <div className="drawer-slots-grid">
              {[
                { denom: 200, count: register.notes200, color: 'blue' },
                { denom: 100, count: register.notes100, color: 'green' },
                { denom: 50, count: register.notes50, color: 'orange' },
                { denom: 20, count: register.notes20, color: 'purple' },
                { denom: 10, count: register.notes10, color: 'red' },
                { denom: 5, count: register.notes5, color: 'pink' },
                { denom: 1, count: register.notes1, color: 'gray' },
              ].map(({ denom, count, color }) => (
                <div className={`drawer-slot-card slot-${color} glass-panel`} key={denom}>
                  <div className="slot-visual-bill">
                    <Banknote size={24} className="bill-icon" />
                    <span className="denom-label">{denom} EGP</span>
                  </div>
                  <div className="slot-stats">
                    <div className="stat-item">
                      <span className="stat-label">Quantity</span>
                      <span className="stat-value">{count} bills</span>
                    </div>
                    <div className="stat-item value">
                      <span className="stat-label">Net Value</span>
                      <span className="stat-value text-teal">EGP {(count * denom).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : null}

      <style dangerouslySetInnerHTML={{ __html: `
        .bill-count-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
        .bill-count-field { display: flex; flex-direction: column; gap: 4px; }
        .bill-count-label { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); }
        .bill-count-input { padding: 8px 10px !important; font-size: 14px !important; text-align: center; width: 100%; }

        .cashier-monitor-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .header-actions {
          display: flex;
          align-items: center;
        }

        .spin-animation {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .monitor-content-grid {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .summary-float-card {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 32px;
          border-radius: var(--radius-lg);
        }

        .summary-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--color-accent-teal-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(20, 184, 166, 0.2);
        }

        .summary-info h2 {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .float-amount {
          font-size: 32px;
          font-weight: 800;
          color: white;
          display: block;
        }

        .last-updated {
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 6px;
        }

        .banknote-slots-section h3 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-glass);
        }

        .drawer-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        .drawer-slot-card {
          padding: 20px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: var(--transition-smooth);
        }

        .drawer-slot-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .slot-visual-bill {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-glass);
        }

        .denom-label {
          font-size: 18px;
          font-weight: 800;
          color: white;
        }

        .slot-stats {
          display: flex;
          justify-content: space-between;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 10px;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .stat-item.value .stat-value {
          font-size: 15px;
          font-weight: 700;
        }

        /* Denomination themed border glows */
        .slot-blue { border-left: 4px solid #3b82f6; }
        .slot-green { border-left: 4px solid #10b981; }
        .slot-orange { border-left: 4px solid #f59e0b; }
        .slot-purple { border-left: 4px solid #8b5cf6; }
        .slot-red { border-left: 4px solid #ef4848; }
        .slot-pink { border-left: 4px solid #ec4899; }
        .slot-gray { border-left: 4px solid #6b7280; }

        .bill-icon {
          opacity: 0.6;
        }

        .slot-blue .bill-icon { color: #3b82f6; }
        .slot-green .bill-icon { color: #10b981; }
        .slot-orange .bill-icon { color: #f59e0b; }
        .slot-purple .bill-icon { color: #8b5cf6; }
        .slot-red .bill-icon { color: #ef4848; }
        .slot-pink .bill-icon { color: #ec4899; }
        .slot-gray .bill-icon { color: #6b7280; }

        /* Modal Styles */
        .cashier-adjust-modal {
          max-width: 480px;
          padding: 24px;
        }

        .modal-subtitle {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
        }

        .adjust-notes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 16px;
        }

        .adjust-note-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .text-right {
          text-align: right;
        }
      `}} />
    </div>
  );
};
