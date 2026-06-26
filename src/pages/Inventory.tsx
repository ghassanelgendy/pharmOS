import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  AlertCircle
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  
  const [drugs, setDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<any | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    quantity: '',
    batchId: '',
    expireDate: '',
    price: '',
    barcode: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${user?.token || ''}` };
      const response = await fetch(`/api/inventory?pagesize=${pageSize}&page=${currentPage}`, { headers });
      const data = await response.json();
      
      let items = data.inventorys || [];
      
      // Client-side search filter
      if (searchQuery) {
        items = items.filter((d: any) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      
      setDrugs(items);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user, currentPage, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingDrug(null);
    setFormData({
      name: '',
      email: '',
      quantity: '',
      batchId: '',
      expireDate: '',
      price: '',
      barcode: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (drug: any) => {
    setEditingDrug(drug);
    setFormData({
      name: drug.name,
      email: drug.email,
      quantity: drug.quantity,
      batchId: drug.batchId,
      expireDate: drug.expireDate ? new Date(drug.expireDate).toISOString().split('T')[0] : '',
      price: drug.price,
      barcode: drug.barcode || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this drug from inventory?')) return;
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token || ''}` }
      });
      if (response.ok) {
        fetchInventory();
      } else {
        alert('Failed to delete item');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.quantity || !formData.batchId || !formData.expireDate || !formData.price) {
      setFormError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = editingDrug ? `/api/inventory/${editingDrug._id}` : '/api/inventory';
      const method = editingDrug ? 'PUT' : 'POST';
      
      const payload: any = {
        name: formData.name,
        email: formData.email,
        quantity: formData.quantity,
        batchId: formData.batchId,
        expireDate: formData.expireDate,
        price: formData.price,
        barcode: formData.barcode
      };
      if (editingDrug) {
        payload.id = editingDrug._id;
      }

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${user?.token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchInventory();
      } else {
        const errorRes = await response.json();
        setFormError(errorRes.message || 'Operation failed');
      }
    } catch (err) {
      setFormError('Connection error, failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const getStockBadge = (quantity: number, expireDate: string) => {
    const today = new Date();
    const expiry = new Date(expireDate);
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(today.getDate() + 10);

    const isExpired = expiry < today;
    const isAboutToExpire = expiry >= today && expiry <= tenDaysFromNow;

    if (isExpired) {
      return (
        <span className="badge badge-danger">
          <span className="badge-dot pulse"></span>
          <span>Expired</span>
        </span>
      );
    }
    if (isAboutToExpire) {
      return (
        <span className="badge badge-warning-alt">
          <span className="badge-dot pulse"></span>
          <span>About to Expire</span>
        </span>
      );
    }
    if (quantity <= 0) {
      return (
        <span className="badge badge-danger">
          <span className="badge-dot pulse"></span>
          <span>Out of Stock</span>
        </span>
      );
    }
    if (quantity <= 500) {
      return (
        <span className="badge badge-warning">
          <span className="badge-dot pulse"></span>
          <span>Low Stock ({quantity})</span>
        </span>
      );
    }
    return (
      <span className="badge badge-success">
        <span className="badge-dot pulse"></span>
        <span>In Stock ({quantity})</span>
      </span>
    );
  };

  return (
    <div className="inventory-page animated-fade">
      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-fade">
            <div className="modal-header">
              <h3>{editingDrug ? 'Edit Drug Details' : 'Add New Drug'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="auth-alert error">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Drug Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Amoxicillin 500mg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Batch ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="B-99823"
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (EGP)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="25.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="1000"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.expireDate}
                    onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Supplier Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="supplier@pharma.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Barcode (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="6221000123456"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>



              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingDrug ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Page Layout */}
      <div className="page-header">
        <div>
          <h1>Drug Inventory</h1>
          <p>View, modify, and manage current pharmaceutical stock levels</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          <span>Add New Drug</span>
        </button>
      </div>

      <div className="inventory-controls-panel glass-panel">
        <div className="pos-search-wrapper">
          <Search size={18} className="pos-search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search inventory by drug name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="table-container glass-panel animated-fade">
        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading inventory items...</p>
          </div>
        ) : drugs.length === 0 ? (
          <div className="empty-cart-view">
            <p>No inventory records found. Add some drugs to get started!</p>
          </div>
        ) : (
          <>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Drug Name</th>
                  <th>Batch ID</th>
                  <th>Expiry Date</th>
                  <th>Price</th>
                  <th>Supplier</th>
                  <th>Stock Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drugs.map((drug) => (
                  <tr key={drug._id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{drug.name}</strong>
                        {drug.barcode && <span className="barcode-badge">Barcode: {drug.barcode}</span>}
                      </div>
                    </td>
                    <td><code>{drug.batchId}</code></td>
                    <td>{new Date(drug.expireDate).toLocaleDateString()}</td>
                    <td>EGP {parseFloat(drug.price).toFixed(2)}</td>
                    <td>{drug.email}</td>
                    <td>{getStockBadge(parseFloat(drug.quantity), drug.expireDate)}</td>
                    <td className="actions-cell">
                      <button className="icon-btn edit" onClick={() => handleOpenEditModal(drug)} title="Edit">
                        <Edit3 size={15} />
                      </button>
                      <button className="icon-btn delete" onClick={() => handleDelete(drug._id)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="pagination-bar">
              <span className="pagination-info">Showing page {currentPage}</span>
              <div className="pagination-buttons">
                <button 
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  disabled={drugs.length < pageSize}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .inventory-controls-panel {
          padding: 16px;
          margin-bottom: 24px;
        }

        .actions-cell {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          border: none;
          background: var(--bg-tertiary);
          color: var(--color-text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .icon-btn.edit:hover {
          color: var(--color-accent-teal);
          background: var(--color-accent-teal-glow);
        }

        .icon-btn.delete:hover {
          color: var(--color-danger);
          background: var(--color-danger-bg);
        }

        .pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-top: 1px solid var(--border-glass);
        }

        .pagination-info {
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .pagination-buttons {
          display: flex;
          gap: 12px;
        }



        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .barcode-badge {
          display: inline-block;
          font-size: 10px;
          color: var(--color-text-muted);
          font-family: monospace;
          margin-top: 3px;
        }
      `}} />
    </div>
  );
};
