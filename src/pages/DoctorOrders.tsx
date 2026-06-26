import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  CheckSquare, 
  Archive, 
  Send,
  Plus,
  Phone,
  Mail,
  Calculator,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';

export const DoctorOrders: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'pickedUp'>('pending');
  const [loading, setLoading] = useState(true);
  
  // Data lists
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [verifiedOrders, setVerifiedOrders] = useState<any[]>([]);
  const [pickedUpOrders, setPickedUpOrders] = useState<any[]>([]);
  
  // New Order Form (Only visible to Doctors or when placing order)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    drugIndex: '0',
    drugQuantity: '10',
    pickupDate: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Details Modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${user?.token || ''}` };

      // Fetch pending
      const pendRes = await fetch('/api/doctorOder', { headers });
      const pendData = await pendRes.json();
      setPendingOrders(pendData.doctorOders || []);

      // Fetch verified
      const verRes = await fetch('/api/verifiedDoctorOder', { headers });
      const verData = await verRes.json();
      setVerifiedOrders(verData.doctorOders || []);

      // Fetch picked up
      const pickRes = await fetch('/api/pickedUpOders', { headers });
      const pickData = await pickRes.json();
      setPickedUpOrders(pickData.doctorOders || []);

      // Fetch inventory to populate drug selections
      const drugRes = await fetch('/api/inventory?pagesize=100&page=1', { headers });
      const drugData = await drugRes.json();
      setDrugs(drugData.inventorys || []);

    } catch (err) {
      console.error('Error fetching doctor orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (drugs.length === 0 || !formData.pickupDate) {
      setFormError('Please select a drug and pickup date.');
      return;
    }

    const selectedDrug = drugs[parseInt(formData.drugIndex)];
    const quantity = parseInt(formData.drugQuantity);

    if (quantity > parseFloat(selectedDrug.quantity)) {
      setFormError(`Insufficient stock. Only ${selectedDrug.quantity} units available.`);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const price = parseFloat(selectedDrug.price);
    const totalAmount = price * quantity;

    const payload = {
      doctorName: user?.name || 'Dr. Guest',
      doctorContact: user?.contact || '01000000000',
      doctorId: user?.docId || 'DOC-GUEST',
      doctorEmail: user?.email || '',
      drugId: selectedDrug._id,
      drugName: [selectedDrug.name, '', '', '', '', '', ''], // Matching backend array format
      drugPrice: [price.toString(), '', '', '', '', '', ''],
      drugQuantity: [quantity.toString(), '', '', '', '', '', ''],
      realQuantity: quantity.toString(),
      totalAmount: totalAmount.toString(),
      pickupDate: formData.pickupDate
    };

    try {
      const response = await fetch('/api/doctorOder', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsFormOpen(false);
        fetchOrders();
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to submit order');
      }
    } catch (err) {
      setFormError('Server connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Move order from Pending to Verified (and send confirmation email)
  const verifyOrder = async (order: any) => {
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}`
      };

      const payload = {
        doctorName: order.doctorName,
        doctorContact: order.doctorContact,
        doctorId: order.doctorID || order.doctorId,
        doctorEmail: order.doctorEmail,
        drugId: order.drugId,
        drugName: order.drugNames || order.drugName,
        drugPrice: order.drugPrice,
        drugQuantity: order.drugQuantity,
        realQuantity: order.realQuantity,
        totalAmount: order.totalAmount,
        pickupDate: order.pickupDate
      };

      // 1. Save to verified database
      const saveRes = await fetch('/api/verifiedDoctorOder', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!saveRes.ok) {
        alert('Failed to register verified order');
        return;
      }

      // 2. Trigger NodeMailer email notification to doctor
      const mailPayload = {
        name: order.doctorName,
        email: order.doctorEmail,
        pickupDate: new Date(order.pickupDate).toLocaleDateString(),
        drugName: order.drugNames || order.drugName,
        drugQuantity: order.drugQuantity,
        drugPrice: order.drugPrice,
        total: order.totalAmount
      };

      await fetch('/api/doctorOder/sendmail', {
        method: 'POST',
        headers,
        body: JSON.stringify(mailPayload)
      });

      // 3. Delete from pending database
      await fetch(`/api/doctorOder/${order._id}`, {
        method: 'DELETE',
        headers
      });

      fetchOrders();
    } catch (err) {
      console.error('Error verifying order', err);
    }
  };

  // Move order from Verified to Picked Up
  const markAsPickedUp = async (order: any) => {
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}`
      };

      const payload = {
        doctorName: order.doctorName,
        doctorContact: order.doctorContact,
        doctorId: order.doctorID || order.doctorId,
        doctorEmail: order.doctorEmail,
        drugName: order.drugNames || order.drugName,
        drugPrice: order.drugPrice,
        drugQuantity: order.drugQuantity,
        totalAmount: order.totalAmount,
        pickupDate: new Date().toISOString() // automatically log actual pickup date
      };

      // 1. Save to Picked Up database
      const saveRes = await fetch('/api/pickedUpOders', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!saveRes.ok) {
        alert('Failed to register picked up order');
        return;
      }

      // 2. Send NodeMailer confirmation email for picked up order
      const mailPayload = {
        name: order.doctorName,
        email: order.doctorEmail,
        drugName: order.drugNames || order.drugName,
        drugQuantity: order.drugQuantity,
        drugPrice: order.drugPrice,
        total: order.totalAmount
      };

      await fetch('/api/verifiedDoctorOder/sendmail', {
        method: 'POST',
        headers,
        body: JSON.stringify(mailPayload)
      });

      // 3. Delete from verified database
      await fetch(`/api/verifiedDoctorOder/${order._id}`, {
        method: 'DELETE',
        headers
      });

      fetchOrders();
    } catch (err) {
      console.error('Error marking order as picked up', err);
    }
  };

  return (
    <div className="orders-page animated-fade">
      {/* New Prescription Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-fade">
            <div className="modal-header">
              <h3>New Prescription Order</h3>
              <button className="modal-close" onClick={() => setIsFormOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="auth-alert error">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="modal-form">
              <div className="form-group">
                <label className="form-label">Select Stock Drug</label>
                <select
                  className="form-input"
                  value={formData.drugIndex}
                  onChange={(e) => setFormData({ ...formData, drugIndex: e.target.value })}
                >
                  {drugs.map((d, index) => (
                    <option key={d._id} value={index}>
                      {d.name} (EGP {parseFloat(d.price).toFixed(2)} | Stock: {d.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Prescription Unit Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formData.drugQuantity}
                  onChange={(e) => setFormData({ ...formData, drugQuantity: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Requested Pickup Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.pickupDate}
                  onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Send size={16} />
                  <span>{submitting ? 'Submitting...' : 'Submit Prescription'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Order View Modal */}
      {isDetailsOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-fade details-modal" style={{ maxWidth: '600px', width: '100%' }}>
            <div className="modal-header">
              <h3>Prescription Details</h3>
              <button className="modal-close" onClick={() => { setIsDetailsOpen(false); setSelectedOrder(null); }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content" style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px', color: 'white' }}>
              {/* Doctor details */}
              <div className="section-title" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent-teal)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                Submitting Doctor Details
              </div>
              <div className="details-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div className="info-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="info-label" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Doctor Name:</span>
                  <span className="info-val" style={{ fontSize: '13px', fontWeight: 600 }}>{selectedOrder.doctorName}</span>
                </div>
                <div className="info-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="info-label" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Doctor ID:</span>
                  <span className="info-val" style={{ fontSize: '13px', fontWeight: 600 }}>{selectedOrder.doctorID || selectedOrder.doctorId || 'N/A'}</span>
                </div>
                <div className="info-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="info-label" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Contact Number:</span>
                  <span className="info-val" style={{ fontSize: '13px', fontWeight: 600 }}>{selectedOrder.doctorContact}</span>
                </div>
                <div className="info-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="info-label" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Email:</span>
                  <span className="info-val" style={{ fontSize: '13px', fontWeight: 600 }}>{selectedOrder.doctorEmail}</span>
                </div>
              </div>

              {/* Order payload */}
              <div className="section-title" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent-teal)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                Order Payload
              </div>
              <div className="payload-table-wrapper" style={{ border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <table className="payload-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Drug Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Quantity</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Price per Unit</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.drugNames || selectedOrder.drugName || []).map((name: string, idx: number) => {
                      if (!name) return null;
                      const qty = parseInt((selectedOrder.drugQuantity || [])[idx] || selectedOrder.realQuantity || '1', 10);
                      const price = parseFloat((selectedOrder.drugPrice || [])[idx] || '0');
                      return (
                        <tr key={idx} style={{ borderTop: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '10px 12px' }}>{name}</td>
                          <td style={{ padding: '10px 12px' }}>{qty}</td>
                          <td style={{ padding: '10px 12px' }}>EGP {price.toFixed(2)}</td>
                          <td style={{ padding: '10px 12px' }}>EGP {(qty * price).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Handoff Pickup Details */}
              <div className="pickup-details-section" style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                <div className="info-field font-bold" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="info-label" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Scheduled Pickup Date:</span>
                  <span className="info-val text-teal" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent-teal)' }}>{new Date(selectedOrder.pickupDate).toLocaleDateString()}</span>
                </div>
                <div className="info-field font-bold" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                  <span className="info-label" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Total Cost:</span>
                  <span className="info-val text-teal" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-accent-teal)' }}>EGP {parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setIsDetailsOpen(false); setSelectedOrder(null); }}
              >
                Close
              </button>
              {user?.role !== 'Doctor' && activeTab === 'pending' && (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => {
                    verifyOrder(selectedOrder);
                    setIsDetailsOpen(false);
                    setSelectedOrder(null);
                  }}
                >
                  Order Verify
                </button>
              )}
              {user?.role !== 'Doctor' && activeTab === 'verified' && (
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={() => {
                    markAsPickedUp(selectedOrder);
                    setIsDetailsOpen(false);
                    setSelectedOrder(null);
                  }}
                >
                  Picked Up
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Prescription Orders</h1>
          <p>Verify doctor-prescribed medications and track customer pickups</p>
        </div>
        {user?.role === 'Doctor' && (
          <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
            <Plus size={16} />
            <span>New Prescription</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="orders-tabs glass-panel">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} />
          <span>New Orders ({pendingOrders.length})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          <CheckSquare size={16} />
          <span>Verified Orders ({verifiedOrders.length})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pickedUp' ? 'active' : ''}`}
          onClick={() => setActiveTab('pickedUp')}
        >
          <Archive size={16} />
          <span>Picked Up Orders ({pickedUpOrders.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="orders-content">
        {loading ? (
          <div className="dashboard-loading glass-panel">
            <div className="loading-spinner"></div>
            <p>Loading prescription lists...</p>
          </div>
        ) : (
          <div className="orders-grid">
            {activeTab === 'pending' && (
              pendingOrders.length === 0 ? (
                <div className="empty-cart-view glass-panel">
                  <p>No pending prescription orders available.</p>
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <div className="order-card glass-panel animated-fade" key={order._id}>
                    <div className="order-card-header">
                      <span className="doctor-tag">Prescribed by {order.doctorName}</span>
                      <span className="doctor-id-sub">Doc ID: {order.doctorID || order.doctorId || 'N/A'}</span>
                    </div>

                    <div className="order-card-body">
                      {(order.drugNames || order.drugName || []).map((drugName: string, idx: number) => {
                        if (!drugName) return null;
                        return (
                          <div className="prescription-item" key={idx}>
                            <strong>{drugName}</strong>
                            <span>Qty: {(order.drugQuantity || [])[idx] || order.realQuantity}</span>
                          </div>
                        );
                      })}
                      
                      <div className="divider-card"></div>
                      
                      <div className="order-details-info">
                        <div className="info-row">
                          <Phone size={13} />
                          <span>{order.doctorContact}</span>
                        </div>
                        <div className="info-row">
                          <Mail size={13} />
                          <span>{order.doctorEmail}</span>
                        </div>
                        <div className="info-row">
                          <Calendar size={13} />
                          <span>Pickup Date: {new Date(order.pickupDate).toLocaleDateString()}</span>
                        </div>
                        <div className="info-row total">
                          <Calculator size={13} />
                          <span>Total Price: <strong>EGP {parseFloat(order.totalAmount).toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="order-card-actions" style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-secondary btn-sm w-full" onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}>
                        View Order
                      </button>
                      {user?.role !== 'Doctor' && (
                        <button className="btn btn-primary btn-sm w-full" onClick={() => verifyOrder(order)}>
                          Order Verify
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'verified' && (
              verifiedOrders.length === 0 ? (
                <div className="empty-cart-view glass-panel">
                  <p>No verified orders ready for customer pickup.</p>
                </div>
              ) : (
                verifiedOrders.map((order) => (
                  <div className="order-card glass-panel animated-fade verified-theme" key={order._id}>
                    <div className="order-card-header">
                      <span className="doctor-tag">Ready for Pickup</span>
                      <span className="doctor-id-sub">Prescribed by {order.doctorName}</span>
                    </div>

                    <div className="order-card-body">
                      {(order.drugNames || order.drugName || []).map((drugName: string, idx: number) => {
                        if (!drugName) return null;
                        return (
                          <div className="prescription-item" key={idx}>
                            <strong>{drugName}</strong>
                            <span>Qty: {(order.drugQuantity || [])[idx]}</span>
                          </div>
                        );
                      })}
                      
                      <div className="divider-card"></div>

                      <div className="order-details-info">
                        <div className="info-row">
                          <Calendar size={13} />
                          <span>Pickup Date: {new Date(order.pickupDate).toLocaleDateString()}</span>
                        </div>
                        <div className="info-row total">
                          <Calculator size={13} />
                          <span>Total Due: <strong>EGP {parseFloat(order.totalAmount).toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="order-card-actions" style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-secondary btn-sm w-full" onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}>
                        View Order
                      </button>
                      {user?.role !== 'Doctor' && (
                        <button className="btn btn-success btn-sm w-full" onClick={() => markAsPickedUp(order)}>
                          Picked Up
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'pickedUp' && (
              pickedUpOrders.length === 0 ? (
                <div className="empty-cart-view glass-panel">
                  <p>No completed transaction history found.</p>
                </div>
              ) : (
                pickedUpOrders.map((order) => (
                  <div className="order-card glass-panel animated-fade completed-theme" key={order._id}>
                    <div className="order-card-header">
                      <span className="doctor-tag">Completed / Picked Up</span>
                      <span className="doctor-id-sub">Doc ID: {order.doctorID || order.doctorId || 'N/A'}</span>
                    </div>

                    <div className="order-card-body">
                      {(order.drugNames || order.drugName || []).map((drugName: string, idx: number) => {
                        if (!drugName) return null;
                        return (
                          <div className="prescription-item" key={idx}>
                            <strong>{drugName}</strong>
                            <span>Qty: {(order.drugQuantity || [])[idx]}</span>
                          </div>
                        );
                      })}
                      <div className="divider-card"></div>
                      <div className="order-details-info">
                        <div className="info-row">
                          <span>Doctor: {order.doctorName}</span>
                        </div>
                        <div className="info-row">
                          <Calendar size={13} />
                          <span>Picked Up on: {new Date(order.pickupDate || order.dateTime || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="info-row total">
                          <span>Revenue: <strong>EGP {parseFloat(order.totalAmount).toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="order-card-actions">
                      <button className="btn btn-secondary btn-sm w-full" onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}>
                        View Order
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )
      }
    </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .order-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-radius: var(--radius-md);
        }

        .verified-theme {
          border-color: rgba(16, 185, 129, 0.2);
        }

        .verified-theme .doctor-tag {
          color: var(--color-success);
        }

        .completed-theme {
          opacity: 0.7;
        }

        .order-card-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 10px;
        }

        .doctor-tag {
          font-size: 14px;
          font-weight: 700;
          color: white;
        }

        .doctor-id-sub {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .order-card-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .prescription-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .divider-card {
          border-top: 1px dashed var(--border-glass);
        }

        .order-details-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .order-details-info .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        .order-details-info .info-row svg {
          color: var(--color-text-muted);
        }

        .order-details-info .info-row.total {
          margin-top: 4px;
          font-size: 13px;
          color: white;
        }

        .order-details-info .info-row.total strong {
          color: var(--color-accent-teal);
        }

        .order-card-actions {
          margin-top: auto;
          border-top: 1px solid var(--border-glass);
          padding-top: 14px;
        }

        .X {
          cursor: pointer;
        }
      `}} />
    </div>
  );
};
