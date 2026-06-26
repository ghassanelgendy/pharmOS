import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  AlertCircle, 
  AlertTriangle, 
  Mail, 
  Send,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

export const Warnings: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'expired' | 'aboutToExpire' | 'outOfStock' | 'aboutToFinish'>('expired');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'expired' || tab === 'aboutToExpire' || tab === 'outOfStock' || tab === 'aboutToFinish') {
      setActiveTab(tab);
    }
  }, [location]);
  
  // Lists
  const [expired, setExpired] = useState<any[]>([]);
  const [aboutToExpire, setAboutToExpire] = useState<any[]>([]);
  const [outOfStock, setOutOfStock] = useState<any[]>([]);
  const [aboutToFinish, setAboutToFinish] = useState<any[]>([]);
  
  // Mail State
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Restock Modal State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedRestockItem, setSelectedRestockItem] = useState<any | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('1000');
  const [isOutOfStockOrder, setIsOutOfStockOrder] = useState(false);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${user?.token || ''}` };

      // Expired
      const expRes = await fetch('/api/inventory/getExpired?pagesize=100&page=1', { headers });
      const expData = await expRes.json();
      setExpired(expData.inventorys || []);

      // About to expire
      const ateRes = await fetch('/api/inventory/getAboutToExpire?pagesize=100&page=1', { headers });
      const ateData = await ateRes.json();
      setAboutToExpire(ateData.inventorys || []);

      // Out of Stock
      const oosRes = await fetch('/api/inventory/outofstock?pagesize=100&page=1', { headers });
      const oosData = await oosRes.json();
      setOutOfStock(oosData.inventorys || []);

      // About to finish / Low Stock
      const atfRes = await fetch('/api/inventory/abouttooutofstock?pagesize=100&page=1', { headers });
      const atfData = await atfRes.json();
      setAboutToFinish(atfData.inventorys || []);

    } catch (err) {
      console.error('Failed to load warning alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, [user]);

  const handleOpenRestockModal = (item: any, isOutOfStock: boolean) => {
    setSelectedRestockItem(item);
    setIsOutOfStockOrder(isOutOfStock);
    setRestockQuantity('1000');
    setSuccessMsg(null);
    setIsRestockModalOpen(true);
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestockItem) return;

    const qty = parseInt(restockQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Invalid quantity amount.");
      return;
    }

    setSendingId(selectedRestockItem._id);
    setSuccessMsg(null);

    const payload = {
      name: selectedRestockItem.name,
      email: selectedRestockItem.email,
      price: selectedRestockItem.price,
      quantityNumber: qty.toString()
    };

    try {
      const url = isOutOfStockOrder ? '/api/inventory/sendmailOutOfStock' : '/api/inventory/sendmail';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccessMsg(`Supplier order request email sent to: ${selectedRestockItem.email}`);
        setIsRestockModalOpen(false);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        alert('Failed to dispatch supplier email.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error sending mail');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="warnings-page animated-fade">
      {/* Restock Modal Dialog */}
      {isRestockModalOpen && selectedRestockItem && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-fade" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Restock Supplier Request</h3>
              <button className="modal-close" onClick={() => setIsRestockModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendMail} className="modal-form">
              <div className="form-group">
                <label className="form-label">Drug Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedRestockItem.name}
                  disabled
                  readOnly
                />
              </div>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Previous Unit Price (EGP)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={parseFloat(selectedRestockItem.price).toFixed(2)}
                    disabled
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Remaining Quantity</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedRestockItem.quantity}
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Linked Supplier's Email</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedRestockItem.email}
                  disabled
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Order Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="1000"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  required
                  min="1"
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsRestockModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={sendingId === selectedRestockItem._id}>
                  {sendingId === selectedRestockItem._id ? 'Sending Email...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Stock Warnings & Alerts</h1>
          <p>Review expired, low, or out of stock items and directly request restocks from suppliers</p>
        </div>
      </div>

      {successMsg && (
        <div className="auth-alert success animated-fade">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="orders-tabs warnings-tabs glass-panel">
        <button 
          className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
          onClick={() => setActiveTab('expired')}
        >
          <AlertCircle size={16} className="text-danger" />
          <span>Expired ({expired.length})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'aboutToExpire' ? 'active' : ''}`}
          onClick={() => setActiveTab('aboutToExpire')}
        >
          <Clock size={16} className="text-warning" />
          <span>About to Expire ({aboutToExpire.length})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'outOfStock' ? 'active' : ''}`}
          onClick={() => setActiveTab('outOfStock')}
        >
          <AlertCircle size={16} className="text-danger" />
          <span>Out of Stock ({outOfStock.length})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'aboutToFinish' ? 'active' : ''}`}
          onClick={() => setActiveTab('aboutToFinish')}
        >
          <AlertTriangle size={16} className="text-warning" />
          <span>Low Stock ({aboutToFinish.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="dashboard-loading glass-panel">
          <div className="loading-spinner"></div>
          <p>Loading warning records...</p>
        </div>
      ) : (
        <div className="table-container glass-panel animated-fade">
          {activeTab === 'expired' && (
            expired.length === 0 ? (
              <p className="no-records-warn">No expired batches in stock. Excellent!</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Batch ID</th>
                    <th>Expiry Date</th>
                    <th>Supplier Email</th>
                    <th>Stock Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expired.map(item => (
                    <tr key={item._id}>
                      <td><strong>{item.name}</strong></td>
                      <td><code>{item.batchId}</code></td>
                      <td>
                        <span className="badge badge-danger">
                          <span className="badge-dot pulse"></span>
                          <span>{new Date(item.expireDate).toLocaleDateString()}</span>
                        </span>
                      </td>
                      <td>{item.email}</td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenRestockModal(item, false)}
                        >
                          <Mail size={13} />
                          <span>Request</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'aboutToExpire' && (
            aboutToExpire.length === 0 ? (
              <p className="no-records-warn">No batches expiring within the next 30 days.</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Batch ID</th>
                    <th>Expiry Date</th>
                    <th>Supplier Email</th>
                    <th>Stock Action</th>
                  </tr>
                </thead>
                <tbody>
                  {aboutToExpire.map(item => (
                    <tr key={item._id}>
                      <td><strong>{item.name}</strong></td>
                      <td><code>{item.batchId}</code></td>
                      <td>
                        <span className="badge badge-warning-alt">
                          <span className="badge-dot pulse"></span>
                          <span>{new Date(item.expireDate).toLocaleDateString()}</span>
                        </span>
                      </td>
                      <td>{item.email}</td>
                      <td>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenRestockModal(item, false)}
                        >
                          <Mail size={13} />
                          <span>Request</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'outOfStock' && (
            outOfStock.length === 0 ? (
              <p className="no-records-warn">All catalogued items are currently in stock.</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Batch ID</th>
                    <th>Unit Price</th>
                    <th>Supplier Email</th>
                    <th>Stock Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outOfStock.map(item => (
                    <tr key={item._id}>
                      <td><strong>{item.name}</strong></td>
                      <td><code>{item.batchId}</code></td>
                      <td>EGP {parseFloat(item.price).toFixed(2)}</td>
                      <td>{item.email}</td>
                      <td>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenRestockModal(item, true)}
                        >
                          <Send size={13} />
                          <span>Request</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'aboutToFinish' && (
            aboutToFinish.length === 0 ? (
              <p className="no-records-warn">No items are running critically low on stock.</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Batch ID</th>
                    <th>Current Quantity</th>
                    <th>Supplier Email</th>
                    <th>Stock Action</th>
                  </tr>
                </thead>
                <tbody>
                  {aboutToFinish.map(item => (
                    <tr key={item._id}>
                      <td><strong>{item.name}</strong></td>
                      <td><code>{item.batchId}</code></td>
                      <td>
                        <span className="badge badge-warning">
                          <span className="badge-dot pulse"></span>
                          <span>{item.quantity} units</span>
                        </span>
                      </td>
                      <td>{item.email}</td>
                      <td>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenRestockModal(item, true)}
                        >
                          <Mail size={13} />
                          <span>Request</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-records-warn {
          text-align: center;
          padding: 32px;
          color: var(--color-text-muted);
          font-size: 14px;
        }

        .auth-alert.success {
          background: var(--color-success-bg);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          margin-bottom: 20px;
          font-weight: 500;
        }
      `}} />
    </div>
  );
};
