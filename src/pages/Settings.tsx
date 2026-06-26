import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  Trash2, 
  Edit3, 
  X,
  Shield,
  Stethoscope,
  Phone,
  Mail,
  User,
  KeyRound,
  AlertCircle,
  Percent,
  Plus,
  Database
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { useTaxes, setUseTaxes } = useCart();
  // ponytail: admin = Pharmacist role only
  const isAdmin = user?.role === 'Pharmacist';
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Online Sync states
  const [syncEnabled, setSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sync_enabled') === 'true';
  });
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [hasBackup, setHasBackup] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [isDoctorAccount, setIsDoctorAccount] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    nic: '',
    docId: '',
    password: '',
    role: 'Cashier'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${user?.token || ''}` };

      // Fetch employees
      const empRes = await fetch('/api/user/getUserData', { headers });
      const empData = await empRes.json();
      setEmployees(empData.users || []);

      // Fetch doctors
      const docRes = await fetch('/api/doctorUser/getDoctorUserData', { headers });
      const docData = await docRes.json();
      setDoctors(docData.doctors || []);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  const checkBackupStatus = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${user?.token || ''}` };
      const res = await fetch('/api/inventory/check-backup/status', { headers });
      if (res.ok) {
        const data = await res.json();
        setHasBackup(data.hasBackup);
      }
    } catch (err) {
      console.error("Failed to check backup status", err);
    }
  };

  const handleToggleSync = (val: boolean) => {
    localStorage.setItem('sync_enabled', val ? 'true' : 'false');
    setSyncEnabled(val);
    setSyncStatus(null);
  };

  const handleSyncNow = async () => {
    if (!window.confirm("WARNING: This will replace the entire active inventory with the online Egyptian drug database. The current inventory state will be saved as a backup. Do you want to proceed?")) {
      return;
    }

    setSyncing(true);
    setSyncStatus(null);
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}` 
      };
      const res = await fetch('/api/inventory/sync-online', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus({ success: true, message: data.message });
        setHasBackup(true);
      } else {
        setSyncStatus({ success: false, message: data.message || data.error || 'Failed to synchronize.' });
      }
    } catch (err: any) {
      setSyncStatus({ success: false, message: 'Server connection error.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleUndoSync = async () => {
    if (!window.confirm("Are you sure you want to restore the previous database state? This will overwrite any current changes since the last sync.")) {
      return;
    }

    setSyncing(true);
    setSyncStatus(null);
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}` 
      };
      const res = await fetch('/api/inventory/undo-sync', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus({ success: true, message: data.message });
        setHasBackup(false);
      } else {
        setSyncStatus({ success: false, message: data.message || data.error || 'Failed to restore.' });
      }
    } catch (err: any) {
      setSyncStatus({ success: false, message: 'Server connection error.' });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    checkBackupStatus();
  }, [user]);

  const handleOpenAddModal = (isDoc: boolean) => {
    setEditingAccount(null);
    setIsDoctorAccount(isDoc);
    setFormData({
      name: '',
      email: '',
      contact: '',
      nic: '',
      docId: '',
      password: '',
      role: isDoc ? 'Doctor' : 'Cashier'
    });
    setSelectedFile(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (account: any, isDoc: boolean) => {
    setEditingAccount(account);
    setIsDoctorAccount(isDoc);
    setFormData({
      name: account.name,
      email: account.email,
      contact: account.contact,
      nic: account.nic || '',
      docId: account.docId || '',
      password: '',
      role: account.role || 'Doctor'
    });
    setSelectedFile(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, isDoc: boolean) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      const url = isDoc ? `/api/doctorUser/${id}` : `/api/user/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token || ''}` }
      });
      if (response.ok) {
        fetchAccounts();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Failed to delete account: ${errData.message || response.statusText}`);
      }
    } catch (err: any) {
      console.error('Delete error', err);
      alert('Delete error occurred: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.contact) {
      setFormError('Please enter all required fields');
      return;
    }
    if (!editingAccount && !formData.password) {
      setFormError('Please enter a password');
      return;
    }
    if (!isDoctorAccount && !formData.nic) {
      setFormError('Please enter NIC for employee');
      return;
    }
    if (isDoctorAccount && !formData.docId) {
      setFormError('Please enter SLMC Register Number for doctor');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      let response: Response;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${user?.token || ''}`
      };

      if (isDoctorAccount) {
        const formDataObj = new FormData();
        if (editingAccount) {
          formDataObj.append('id', editingAccount._id);
        }
        formDataObj.append('name', formData.name);
        formDataObj.append('email', formData.email);
        formDataObj.append('contact', formData.contact);
        formDataObj.append('docId', formData.docId);
        if (formData.password) {
          formDataObj.append('password', formData.password);
        }
        if (selectedFile) {
          formDataObj.append('image', selectedFile);
        } else if (editingAccount && editingAccount.profilePic) {
          formDataObj.append('profilePic', editingAccount.profilePic);
        }

        const url = editingAccount 
          ? `/api/doctorUser/${editingAccount._id}` 
          : `/api/doctorUser/doctorSignup`;
        const method = editingAccount ? 'PUT' : 'POST';

        response = await fetch(url, {
          method,
          headers,
          body: formDataObj
        });
      } else {
        headers['Content-Type'] = 'application/json';
        const payload = {
          id: editingAccount?._id,
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          nic: formData.nic,
          password: formData.password,
          role: formData.role
        };

        const url = editingAccount 
          ? `/api/user/${editingAccount._id}` 
          : `/api/user/signup`;
        const method = editingAccount ? 'PUT' : 'POST';

        response = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        setIsModalOpen(false);
        fetchAccounts();
      } else {
        const errorRes = await response.json().catch(() => ({}));
        setFormError(errorRes.message || errorRes.error?.message || 'Operation failed');
      }
    } catch (err) {
      setFormError('Connection error, operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="settings-page animated-fade">
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-fade">
            <div className="modal-header">
              <h3>{editingAccount ? 'Edit User Account' : isDoctorAccount ? 'Add New Doctor Profile' : 'Add New Pharmacy Employee'}</h3>
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
                <label className="form-label">Full Name</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    required
                  />
                </div>
              </div>

              {!isDoctorAccount && (
                <div className="form-group">
                  <label className="form-label">NIC (National Identity Card)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 992837234V"
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    required
                  />
                </div>
              )}

              {isDoctorAccount && (
                <div className="form-group">
                  <label className="form-label">SLMC Register Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SLMC-99823"
                    value={formData.docId}
                    onChange={(e) => setFormData({ ...formData, docId: e.target.value })}
                    required
                  />
                </div>
              )}

              {isDoctorAccount && (
                <div className="form-group">
                  <label className="form-label">Profile Picture {editingAccount && '(Optional)'}</label>
                  <input
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
              )}

              {!isDoctorAccount && (
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Assistant Pharmacist">Assistant Pharmacist</option>
                    <option value="Pharmacist">Pharmacist (Admin)</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{editingAccount ? 'Update Password (Required)' : 'Password'}</label>
                <div className="input-with-icon">
                  <KeyRound size={16} className="input-icon" />
                  <input
                    type="password"
                    className="form-input"
                    placeholder={editingAccount ? "Enter new password" : "••••••••"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingAccount}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (editingAccount ? 'Updating...' : 'Registering...') : (editingAccount ? 'Save Changes' : 'Register Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Page Layout */}
      <div className="page-header">
        <div>
          <h1>System Settings & Access Controls</h1>
          <p>Create, update, or remove active system accounts</p>
        </div>
      </div>

      {/* System Configurations */}
      <div className="settings-section glass-panel animated-fade" style={{ marginBottom: '24px' }}>
        <div className="panel-header-settings">
          <Percent size={20} className="text-teal" />
          <h2>Financial & Tax Configuration</h2>
        </div>
        <div className="config-row">
          <div className="config-info">
            <span className="config-label">Enable POS Transactions Tax</span>
            <p className="config-description">Automatically apply a 5% value-added tax (VAT) on all checkout invoices inside the POS terminal.</p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={useTaxes} 
              onChange={(e) => setUseTaxes(e.target.checked)} 
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Online Database Sync & Revert */}
      <div className="settings-section glass-panel animated-fade" style={{ marginBottom: '24px' }}>
        <div className="panel-header-settings">
          <Database size={20} className="text-teal" />
          <h2>Inventory Database Sync Settings</h2>
        </div>
        
        {/* Toggle option */}
        <div className="config-row">
          <div className="config-info">
            <span className="config-label">Enable Online Drug Database Synchronization</span>
            <p className="config-description">Allow syncing inventory data from the online repository (karem505/egyptian-drug-database). When enabled, you can run the sync process.</p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={syncEnabled} 
              onChange={(e) => handleToggleSync(e.target.checked)} 
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Sync Controls (Only visible when toggle is active) */}
        {syncEnabled && (
          <div className="sync-controls-container" style={{ marginTop: '20px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: 'white' }}>Online Sync Operations</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Sync fetches the latest commercial drug list from GitHub and imports it as active inventory.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {hasBackup && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleUndoSync}
                    disabled={syncing}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                  >
                    Undo Last Sync
                  </button>
                )}
                <button 
                  className="btn btn-primary" 
                  onClick={handleSyncNow}
                  disabled={syncing}
                >
                  {syncing ? 'Syncing...' : 'Sync Database Now'}
                </button>
              </div>
            </div>
            {syncStatus && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: syncStatus.success ? 'var(--color-success)' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} />
                <span>{syncStatus.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading user directories...</p>
        </div>
      ) : (
        <div className="settings-grid">
          {/* Employee Directory */}
          <div className="directory-panel glass-panel">
            <div className="panel-header-settings" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={20} className="text-teal" />
                <h2>Employee Registry</h2>
              </div>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenAddModal(false)}>
                  <Plus size={14} />
                  <span>Add Employee</span>
                </button>
              )}
            </div>

            <div className="accounts-list">
              {employees.length === 0 ? (
                <p className="no-accounts">No employee records.</p>
              ) : (
                employees.map((emp) => (
                  <div className="account-item-settings" key={emp._id}>
                    <div className="account-avatar">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="account-details-settings">
                      <h4>{emp.name}</h4>
                      <p>{emp.email} | <span className="badge badge-success role-badge">{emp.role}</span></p>
                      <p className="contact-text">Contact: {emp.contact} | NIC: {emp.nic || 'N/A'}</p>
                    </div>
                    <div className="account-actions">
                      {isAdmin && (
                        <>
                          <button className="icon-btn edit" onClick={() => handleOpenEditModal(emp, false)}>
                            <Edit3 size={14} />
                          </button>
                          {emp.email !== user?.email && (
                            <button className="icon-btn delete" onClick={() => handleDelete(emp._id, false)}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Doctor Directory */}
          <div className="directory-panel glass-panel">
            <div className="panel-header-settings" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Stethoscope size={20} className="text-blue" />
                <h2>Registered Doctors</h2>
              </div>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenAddModal(true)}>
                  <Plus size={14} />
                  <span>Add Doctor</span>
                </button>
              )}
            </div>

            <div className="accounts-list">
              {doctors.length === 0 ? (
                <p className="no-accounts">No doctor profiles.</p>
              ) : (
                doctors.map((doc) => (
                  <div className="account-item-settings" key={doc._id}>
                    {doc.profilePic ? (
                      <img src={doc.profilePic} alt={doc.name} className="account-avatar-img" />
                    ) : (
                      <div className="account-avatar doc-avatar">
                        {doc.name.charAt(0)}
                      </div>
                    )}
                    <div className="account-details-settings">
                      <h4>{doc.name}</h4>
                      <p>{doc.email} | SLMC: <code>{doc.docId}</code></p>
                      <p className="contact-text">Contact: {doc.contact}</p>
                    </div>
                    <div className="account-actions">
                      {isAdmin && (
                        <>
                          <button className="icon-btn edit" onClick={() => handleOpenEditModal(doc, true)}>
                            <Edit3 size={14} />
                          </button>
                          <button className="icon-btn delete" onClick={() => handleDelete(doc._id, true)}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        .directory-panel {
          padding: 24px;
          border-radius: var(--radius-lg);
        }

        .panel-header-settings {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-glass);
        }

        .panel-header-settings h2 {
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        .accounts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .account-item-settings {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
        }

        .account-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-accent-teal-glow);
          color: var(--color-accent-teal);
          border: 1px solid rgba(13, 148, 136, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .account-avatar-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(2, 132, 199, 0.2);
          display: block;
        }

        .account-avatar.doc-avatar {
          background: rgba(2, 132, 199, 0.1);
          color: var(--color-accent-blue);
          border-color: rgba(2, 132, 199, 0.2);
        }

        .account-details-settings {
          flex: 1;
        }

        .account-details-settings h4 {
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .account-details-settings p {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin-top: 2px;
        }

        .contact-text {
          color: var(--color-text-muted) !important;
        }

        .role-badge {
          font-size: 9px;
          padding: 2px 6px;
        }

        .account-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .icon-btn.edit:hover {
          background: rgba(20, 184, 166, 0.1);
          border-color: var(--color-accent-teal);
          color: var(--color-accent-teal);
        }

        .icon-btn.delete:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--color-danger);
          color: var(--color-danger);
        }

        .no-accounts {
          font-size: 13px;
          color: var(--color-text-muted);
          text-align: center;
          padding: 24px;
        }

        .settings-section {
          padding: 24px;
          border-radius: var(--radius-lg);
        }

        .config-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
        }

        .config-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .config-label {
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .config-description {
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        /* Toggle Switch Styles */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
          flex-shrink: 0;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-glass);
          transition: .3s;
          border-radius: 34px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: var(--color-accent-teal);
        }

        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
      `}} />
    </div>
  );
};
