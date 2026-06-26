import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X,
  Phone,
  Mail,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const Suppliers: React.FC = () => {
  const { user } = useAuth();
  
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    supplierID: '',
    name: '',
    email: '',
    contact: '',
    drugsAvailable: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${user?.token || ''}` };
      const response = await fetch('/api/supplier', { headers });
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [user]);

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.supplierID.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.drugsAvailable.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      supplierID: '',
      name: '',
      email: '',
      contact: '',
      drugsAvailable: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      supplierID: supplier.supplierID,
      name: supplier.name,
      email: supplier.email,
      contact: supplier.contact,
      drugsAvailable: supplier.drugsAvailable
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const response = await fetch(`/api/supplier/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token || ''}` }
      });
      if (response.ok) {
        fetchSuppliers();
      } else {
        alert('Failed to delete supplier');
      }
    } catch (err) {
      console.error('Delete supplier error', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierID || !formData.name || !formData.email || !formData.contact || !formData.drugsAvailable) {
      setFormError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const body = editingSupplier 
      ? { id: editingSupplier._id, ...formData } 
      : formData;

    try {
      const url = editingSupplier ? `/api/supplier/${editingSupplier._id}` : '/api/supplier';
      const method = editingSupplier ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}` 
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchSuppliers();
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

  return (
    <div className="suppliers-page animated-fade">
      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-fade">
            <div className="modal-header">
              <h3>{editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}</h3>
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
                <label className="form-label">Supplier ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="SUP-102"
                  value={formData.supplierID}
                  onChange={(e) => setFormData({ ...formData, supplierID: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Name / Distributor</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="BioPharma Holdings Ltd."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Supplier Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="order@biopharma.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="01099292810"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Drugs Supplied (Comma-separated)</label>
                <textarea
                  className="form-input text-area-pos"
                  placeholder="Amoxicillin, Paracetamol, Cetirizine, Metformin"
                  value={formData.drugsAvailable}
                  onChange={(e) => setFormData({ ...formData, drugsAvailable: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingSupplier ? 'Save Changes' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Page Layout */}
      <div className="page-header">
        <div>
          <h1>Supplier Registry</h1>
          <p>Manage pharmaceutical suppliers, contact emails, and distributed medications</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          <span>Add New Supplier</span>
        </button>
      </div>

      <div className="inventory-controls-panel glass-panel">
        <div className="pos-search-wrapper">
          <Search size={18} className="pos-search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search suppliers by name, ID, or drugs supplied..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading suppliers...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="empty-cart-view glass-panel">
          <p>No supplier records found matching search filters.</p>
        </div>
      ) : (
        <div className="table-container glass-panel animated-fade">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Supplier ID</th>
                <th>Company / Distributor</th>
                <th>Email Address</th>
                <th>Contact Number</th>
                <th>Drugs Supplied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier._id}>
                  <td><code>{supplier.supplierID}</code></td>
                  <td><strong>{supplier.name}</strong></td>
                  <td><a href={`mailto:${supplier.email}`} className="info-link">{supplier.email}</a></td>
                  <td>{supplier.contact}</td>
                  <td>
                    <div className="drugs-pills-list">
                      {supplier.drugsAvailable.split(',').map((drug: string, idx: number) => (
                        <span className="drug-pill" key={idx}>{drug.trim()}</span>
                      ))}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button className="icon-btn edit" onClick={() => handleOpenEditModal(supplier)} title="Edit">
                      <Edit3 size={15} />
                    </button>
                    <button className="icon-btn delete" onClick={() => handleDelete(supplier._id)} title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .text-area-pos {
          resize: vertical;
          min-height: 80px;
        }

        .info-link {
          color: var(--color-accent-blue);
          text-decoration: none;
        }

        .info-link:hover {
          text-decoration: underline;
        }

        .drugs-pills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .drug-pill {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-glass);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          color: var(--color-text-primary);
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
      `}} />
    </div>
  );
};
