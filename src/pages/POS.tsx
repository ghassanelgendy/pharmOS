import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Trash2, 
  Minus, 
  Plus, 
  Banknote, 
  Barcode,
  CreditCard,
  CheckCircle,
  ShoppingCart,
  AlertCircle,
  X,
  Coins
} from 'lucide-react';

export const POS: React.FC = () => {
  const { cart, addToCart, updateQuantity, removeFromCart, totalAmount, taxAmount, checkout } = useCart();
  const { user } = useAuth();
  
  const getDrugSvg = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 40) % 360;
    
    const lowerName = name.toLowerCase();
    let path = '';
    let typeLabel = 'Tablet';
    
    if (lowerName.includes('syrup') || lowerName.includes('suspension') || lowerName.includes('liquid') || lowerName.includes('drop')) {
      path = 'M12 2v4M8 6h8M9 6v14a2 2 0 002 2h2a2 2 0 002-2V6H9z M8 11h8';
      typeLabel = 'Syrup';
    } else if (lowerName.includes('cream') || lowerName.includes('gel') || lowerName.includes('ointment')) {
      path = 'M7 21h10l-1-14H8l-1 14z M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3';
      typeLabel = 'Tube';
    } else if (lowerName.includes('inject') || lowerName.includes('vial') || lowerName.includes('ampoule')) {
      path = 'M12 2v4M10 6h4M11 6v10M9 16h6M12 16v4M11 20h2';
      typeLabel = 'Vial';
    } else {
      path = 'M6 12a6 6 0 0112 0v0a6 6 0 01-12 0z M6 12h12';
      typeLabel = 'Tablet';
    }

    return (
      <div className="drug-image-wrapper" style={{ background: `linear-gradient(135deg, hsl(${hue1}, 75%, 45%), hsl(${hue2}, 85%, 35%))` }}>
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="drug-icon-svg">
          <path d={path} />
        </svg>
        <span className="drug-type-label">{typeLabel}</span>
      </div>
    );
  };

  const [drugs, setDrugs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [receivedNotes, setReceivedNotes] = useState<Record<string, number>>({
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    '1': 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  // Shift Management State
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [isCheckingShift, setIsCheckingShift] = useState(true);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [openingNotes, setOpeningNotes] = useState<Record<string, number>>({
    '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0
  });
  const [closingNotes, setClosingNotes] = useState<Record<string, number>>({
    '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0
  });
  const [shiftOpeningError, setShiftOpeningError] = useState<string | null>(null);
  const [shiftClosingError, setShiftClosingError] = useState<string | null>(null);

  const checkShiftStatus = async () => {
    try {
      setIsCheckingShift(true);
      const headers = { 'Authorization': `Bearer ${user?.token || ''}` };
      
      const shiftRes = await fetch('/api/shifts/active', { headers });
      const shiftData = await shiftRes.json();
      
      if (shiftData.active) {
        setActiveShift(shiftData.shift);
      } else {
        setActiveShift(null);
        // Pre-fill opening notes with current register counts
        const regRes = await fetch('/api/cash-register', { headers });
        const regData = await regRes.json();
        if (regData.register) {
          setOpeningNotes({
            '200': regData.register.notes200 || 0,
            '100': regData.register.notes100 || 0,
            '50': regData.register.notes50 || 0,
            '20': regData.register.notes20 || 0,
            '10': regData.register.notes10 || 0,
            '5': regData.register.notes5 || 0,
            '1': regData.register.notes1 || 0
          });
        }
      }
    } catch (err) {
      console.error('Shift check error', err);
    } finally {
      setIsCheckingShift(false);
    }
  };

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftOpeningError(null);
    setLoading(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${user?.token || ''}`,
        'Content-Type': 'application/json' 
      };
      const response = await fetch('/api/shifts/open', {
        method: 'POST',
        headers,
        body: JSON.stringify(openingNotes)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to open shift');
      }
      setActiveShift(data.shift);
    } catch (err: any) {
      setShiftOpeningError(err.message || 'Error occurred opening shift');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCloseShiftModal = async () => {
    setShiftClosingError(null);
    try {
      const headers = { 'Authorization': `Bearer ${user?.token || ''}` };
      const regRes = await fetch('/api/cash-register', { headers });
      const regData = await regRes.json();
      if (regData.register) {
        setClosingNotes({
          '200': regData.register.notes200 || 0,
          '100': regData.register.notes100 || 0,
          '50': regData.register.notes50 || 0,
          '20': regData.register.notes20 || 0,
          '10': regData.register.notes10 || 0,
          '5': regData.register.notes5 || 0,
          '1': regData.register.notes1 || 0
        });
      }
      setIsCloseShiftModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftClosingError(null);
    setLoading(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${user?.token || ''}`,
        'Content-Type': 'application/json' 
      };
      const response = await fetch('/api/shifts/close', {
        method: 'POST',
        headers,
        body: JSON.stringify(closingNotes)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to close shift');
      }
      setIsCloseShiftModalOpen(false);
      setActiveShift(null);
    } catch (err: any) {
      setShiftClosingError(err.message || 'Error occurred closing shift');
    } finally {
      setLoading(false);
    }
  };

  const handleExactCash = () => {
    const total = totalAmount + taxAmount;
    setPaidAmount(total.toFixed(2));
    setReceivedNotes({
      '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0
    });
  };

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${user?.token || ''}` };
        const response = await fetch('/api/inventory?pagesize=100&page=1', { headers });
        const data = await response.json();
        setDrugs(data.inventorys || []);
      } catch (err) {
        console.error('Failed to load drugs', err);
      }
    };
    checkShiftStatus();
    fetchDrugs();
  }, [user]);

  // Filter drugs based on query
  const filteredDrugs = drugs.filter(drug => 
    drug.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    parseFloat(drug.quantity) > 0
  );

  const handleAdd = (drug: any) => {
    addToCart({
      id: drug._id,
      name: drug.name,
      price: parseFloat(drug.price),
      availableQuantity: parseFloat(drug.quantity),
      email: drug.email
    });
    setSearchQuery('');
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery) return;
    const cleanBarcode = barcodeQuery.trim();
    const found = drugs.find(d => d.barcode === cleanBarcode && parseFloat(d.quantity) > 0);
    if (found) {
      handleAdd(found);
      setBarcodeQuery('');
      setError(null);
    } else {
      setError(`No matching stock item found with barcode "${cleanBarcode}"`);
      setBarcodeQuery('');
    }
  };

  const handleAddNote = (denom: string) => {
    setReceivedNotes(prev => {
      const updated = { ...prev, [denom]: (prev[denom] || 0) + 1 };
      const newTotal = Object.entries(updated).reduce((sum, [d, c]) => sum + parseInt(d) * c, 0);
      setPaidAmount(newTotal.toString());
      return updated;
    });
  };

  const handleRemoveNote = (denom: string) => {
    setReceivedNotes(prev => {
      if ((prev[denom] || 0) <= 0) return prev;
      const updated = { ...prev, [denom]: prev[denom] - 1 };
      const newTotal = Object.entries(updated).reduce((sum, [d, c]) => sum + parseInt(d) * c, 0);
      setPaidAmount(newTotal > 0 ? newTotal.toString() : '');
      return updated;
    });
  };

  const handleClearNotes = () => {
    setReceivedNotes({
      '200': 0,
      '100': 0,
      '50': 0,
      '20': 0,
      '10': 0,
      '5': 0,
      '1': 0
    });
    setPaidAmount('');
  };

  const handlePaidAmountChange = (val: string) => {
    setPaidAmount(val);
    setReceivedNotes({
      '200': 0,
      '100': 0,
      '50': 0,
      '20': 0,
      '10': 0,
      '5': 0,
      '1': 0
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const paidVal = parseFloat(paidAmount);
    const total = totalAmount + taxAmount;
    
    if (isNaN(paidVal) || paidVal < total) {
      setError(`Paid amount must be at least EGP ${total.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await checkout(paidVal, receivedNotes);
    setLoading(false);

    if (result.success) {
      // Save receipt info before clearing cart in state
      setSuccessReceipt({
        items: [...cart],
        subtotal: totalAmount,
        tax: taxAmount,
        total: total,
        paid: paidVal,
        balance: result.balance,
        changeNotes: result.changeNotes,
        date: new Date().toLocaleString()
      });
      handleClearNotes();
    } else {
      setError(result.message);
    }
  };

  if (isCheckingShift) {
    return (
      <div className="pos-page animated-fade">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Verifying active shift session status...</p>
        </div>
      </div>
    );
  }

  if (activeShift === null) {
    const openingTotal = Object.entries(openingNotes).reduce((sum, [denom, count]) => sum + parseInt(denom) * count, 0);
    return (
      <div className="pos-page animated-fade flex-center-wrapper">
        <div className="glass-panel animated-fade shift-setup-panel">
          <div className="shift-setup-header">
            <Coins size={36} className="text-teal" />
            <h2>Open Cashier Shift</h2>
            <p>Confirm the opening cash counts in the register drawer to begin Point of Sale access.</p>
          </div>
          
          {shiftOpeningError && (
            <div className="auth-alert error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={16} />
              <span>{shiftOpeningError}</span>
            </div>
          )}

          <form onSubmit={handleOpenShiftSubmit} className="shift-setup-form">
            <div className="bill-count-grid">
              {[200, 100, 50, 20, 10, 5, 1].map((denom) => (
                <div className="bill-count-field" key={denom}>
                  <label className="bill-count-label">EGP {denom}</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input bill-count-input"
                    value={openingNotes[denom.toString()]}
                    onChange={(e) => setOpeningNotes({ 
                      ...openingNotes, 
                      [denom.toString()]: parseInt(e.target.value) || 0 
                    })}
                  />
                </div>
              ))}
            </div>

            <div className="opening-summary glass-panel">
              <span className="summary-label">Total Opening Float:</span>
              <span className="summary-value text-teal">EGP {openingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <button type="submit" className="btn btn-success w-full" disabled={loading}>
              <span>{loading ? 'Verifying Float...' : 'Start Cashier Shift'}</span>
            </button>
          </form>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .flex-center-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
          }
          .shift-setup-panel {
            max-width: 520px;
            width: 100%;
            padding: 32px;
            border-radius: var(--radius-lg);
          }
          .shift-setup-header {
            text-align: center;
            margin-bottom: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          .shift-setup-header h2 {
            font-size: 20px;
            font-weight: 800;
            color: white;
            margin: 0;
          }
          .shift-setup-header p {
            font-size: 13px;
            color: var(--color-text-secondary);
            margin: 0;
          }
          .bill-count-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .bill-count-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .bill-count-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--color-text-secondary);
          }
          .bill-count-input {
            padding: 8px 10px !important;
            font-size: 14px !important;
            text-align: center;
            width: 100%;
          }
          @media (max-width: 480px) {
            .bill-count-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          .opening-summary {
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: var(--radius-md);
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-glass);
            margin-bottom: 24px;
          }
          .summary-label {
            font-size: 13px;
            color: var(--color-text-secondary);
            font-weight: 600;
          }
          .summary-value {
            font-size: 20px;
            font-weight: 800;
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="pos-page animated-fade">
      {successReceipt && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-fade receipt-modal printable-receipt">
            <div className="receipt-header">
              <CheckCircle size={44} className="receipt-success-icon" />
              <h3>Transaction Added to Sales Report !!</h3>
              <p>pharmOS Pharmacy Receipt</p>
            </div>
            
            <div className="receipt-meta">
              <span>Date: {successReceipt.date}</span>
              <span>Cashier: {user?.email}</span>
            </div>

            <div className="receipt-divider"></div>
            
            <div className="receipt-items-list">
              {successReceipt.items.map((item: any, idx: number) => (
                <div className="receipt-item" key={idx}>
                  <span className="item-qty-name">{item.quantity}x {item.name}</span>
                  <span className="item-price">EGP {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-totals">
              <div className="receipt-row">
                <span>Subtotal</span>
                <span>EGP {successReceipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Tax (5%)</span>
                <span>EGP {successReceipt.tax.toFixed(2)}</span>
              </div>
              <div className="receipt-row total">
                <span>Net Total</span>
                <span>EGP {successReceipt.total.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Paid Amount</span>
                <span>EGP {successReceipt.paid.toFixed(2)}</span>
              </div>
              <div className="receipt-row balance">
                <span>Change / Balance</span>
                <span>EGP {successReceipt.balance.toFixed(2)}</span>
              </div>
            </div>

            {successReceipt.changeNotes && Object.entries(successReceipt.changeNotes).some(([_, count]) => (count as number) > 0) && (
              <div className="receipt-change-notes glass-panel animate-fade">
                <span className="change-notes-title">Banknote Breakdown to Return:</span>
                <div className="notes-list">
                  {Object.entries(successReceipt.changeNotes)
                    .filter(([_, count]) => (count as number) > 0)
                    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                    .map(([denom, count]) => (
                      <div key={denom} className="note-badge">
                        <span className="note-count">{count as number}x</span>
                        <span className="note-denom">EGP {denom}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="receipt-actions no-print">
              <button 
                className="btn btn-secondary w-full"
                onClick={() => window.print()}
                style={{ marginBottom: '8px' }}
              >
                Print Receipt
              </button>
              <button 
                className="btn btn-primary w-full"
                onClick={() => setSuccessReceipt(null)}
              >
                Done / New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {isCloseShiftModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-fade" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>Close Cashier Shift</h3>
              <button className="modal-close" onClick={() => setIsCloseShiftModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            {shiftClosingError && (
              <div className="auth-alert error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{shiftClosingError}</span>
              </div>
            )}

            <form onSubmit={handleCloseShiftSubmit} className="modal-form">
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Count the banknotes in the drawer. The total will be audited against expected cash.
              </p>
              
              {/* ponytail: simple 4-col grid, no form-group margin bloat */}
              <div className="bill-count-grid">
                {[200, 100, 50, 20, 10, 5, 1].map((denom) => (
                  <div className="bill-count-field" key={denom}>
                    <label className="bill-count-label">EGP {denom}</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input bill-count-input"
                      value={closingNotes[denom.toString()]}
                      onChange={(e) => setClosingNotes({ 
                        ...closingNotes, 
                        [denom.toString()]: parseInt(e.target.value) || 0 
                      })}
                    />
                  </div>
                ))}
              </div>

              <div className="shift-audit-summary glass-panel">
                <div className="audit-row">
                  <span>Opening Float</span>
                  <span>EGP {activeShift.openingFloat.toFixed(2)}</span>
                </div>
                <div className="audit-row">
                  <span>Sales Revenue</span>
                  <span>EGP {activeShift.salesTotal || '0.00'}</span>
                </div>
                <div className="audit-row audit-total">
                  <span>Actual Closing Cash</span>
                  <span className="text-teal">
                    EGP {Object.entries(closingNotes).reduce((sum, [denom, count]) => sum + parseInt(denom) * count, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCloseShiftModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={loading}>
                  <span>{loading ? 'Auditing counts...' : 'Verify & End Shift'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <div className="pos-grid">
        {/* Left Column: Search & Drug Catalogue */}
        <div className="catalogue-column">
          <div className="search-box-panel glass-panel">
            <h2>Add Items to Sale</h2>
            <div className="pos-controls-grid">
              <div className="pos-search-wrapper">
                <Search size={18} className="pos-search-icon" />
                <input
                  type="text"
                  className="form-input search-input"
                  placeholder="Search drug name by typing here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <form onSubmit={handleBarcodeSubmit} className="pos-barcode-wrapper">
                <Barcode size={18} className="pos-barcode-icon" />
                <input
                  type="text"
                  className="form-input barcode-input"
                  placeholder="Scan barcode directly..."
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                />
              </form>
            </div>
          </div>

          {/* Quick Catalogue Card Grid */}
          <div className="drug-grid-panel glass-panel">
            <div className="grid-header">
              <h2>Quick Catalogue</h2>
              <span className="text-secondary" style={{ fontSize: '11px' }}>Click any drug card to add it directly to the basket</span>
            </div>
            <div className="drugs-scroll-container">
              {drugs.filter(drug => 
                (drug.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 (drug.barcode && drug.barcode.includes(searchQuery))) && 
                parseFloat(drug.quantity) > 0
              ).length === 0 ? (
                <p className="no-drugs-found">No stock drugs found matching search criteria.</p>
              ) : (
                <div className="drugs-grid">
                  {drugs.filter(drug => 
                    (drug.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     (drug.barcode && drug.barcode.includes(searchQuery))) && 
                    parseFloat(drug.quantity) > 0
                  ).map(drug => (
                    <div 
                      key={drug._id} 
                      className={`drug-card ${parseFloat(drug.quantity) <= 5 ? 'low-stock' : ''}`}
                      onClick={() => handleAdd(drug)}
                    >
                      {getDrugSvg(drug.name)}
                      <div className="drug-card-info">
                        <span className="drug-name">{drug.name}</span>
                        <span className="drug-price">EGP {parseFloat(drug.price).toFixed(2)}</span>
                      </div>
                      <div className="drug-card-footer">
                        <span className="drug-stock">Stock: {drug.quantity}</span>
                        {drug.barcode && <span className="drug-barcode">BC: {drug.barcode.slice(-4)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Details Panel */}
          <div className="cart-panel glass-panel">
            <div className="cart-header-pos">
              <h2>Current Basket</h2>
              <span className="badge badge-success">{cart.length} unique items</span>
            </div>

            <div className="cart-table-wrapper">
              {cart.length === 0 ? (
                <div className="empty-cart-view">
                  <ShoppingCart size={48} className="empty-cart-icon" />
                  <p>Cart is currently empty. Scan a barcode or select items from the catalogue above.</p>
                </div>
              ) : (
                <table className="custom-table pos-table">
                  <thead>
                    <tr>
                      <th>Drug Name</th>
                      <th>Price</th>
                      <th className="center-th">Qty</th>
                      <th>Total</th>
                      <th className="action-th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.lineId}>
                        <td className="item-name-cell">
                          <strong>{item.name}</strong>
                          <span className="qty-tag">Stock: {item.availableQuantity}</span>
                        </td>
                        <td>EGP {item.price.toFixed(2)}</td>
                        <td>
                          <div className="qty-picker">
                            <button 
                              className="qty-btn" 
                              onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="qty-value">{item.quantity}</span>
                            <button 
                              className="qty-btn"
                              onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                              disabled={item.quantity >= item.availableQuantity}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                        <td>EGP {(item.price * item.quantity).toFixed(2)}</td>
                        <td>
                          <button 
                            className="cart-delete-btn"
                            onClick={() => removeFromCart(item.lineId)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Calculations */}
        <div className="checkout-column">
          <div className="checkout-summary-panel glass-panel">
            <h2>Payment & Checkout</h2>

            {activeShift && (
              <div className="active-shift-banner glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-glass)', marginBottom: '20px', background: 'rgba(255,255,255,0.01)' }}>
                <div className="shift-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="shift-label" style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Active Shift Session</span>
                  <span className="shift-cashier" style={{ fontSize: '11px', color: 'white', fontWeight: '600' }}>{user?.email}</span>
                </div>
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm btn-close-shift"
                  style={{ padding: '4px 8px', fontSize: '10px' }}
                  onClick={handleOpenCloseShiftModal}
                >
                  Close Shift
                </button>
              </div>
            )}
            
            <div className="summary-list">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>EGP {totalAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax / Duty ({taxAmount > 0 ? '5%' : '0%'})</span>
                <span>EGP {taxAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row total-row">
                <span>Net Payable</span>
                <span className="net-payable-text">EGP {(totalAmount + taxAmount).toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="auth-alert error">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCheckout} className="checkout-form">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" htmlFor="paidAmount" style={{ margin: 0 }}>Customer Cash Paid (EGP)</label>
                  <button 
                    type="button" 
                    className="btn-exact-cash" 
                    onClick={handleExactCash}
                    disabled={cart.length === 0}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent-teal)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Exact Cash
                  </button>
                </div>
                <div className="input-with-icon">
                  <Banknote size={16} className="input-icon" />
                  <input
                    id="paidAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="form-input checkout-paid-input"
                    value={paidAmount}
                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                    required
                  />
                </div>

                {/* Banknote Selector Widget */}
                <div className="banknote-selector-widget">
                  <div className="widget-header">
                    <span className="widget-title">EGP Cash Calculator</span>
                    {Object.values(receivedNotes).some(c => c > 0) && (
                      <button 
                        type="button" 
                        className="btn-clear-notes" 
                        onClick={handleClearNotes}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="banknote-grid">
                    {['200', '100', '50', '20', '10', '5', '1'].map((denom) => {
                      const count = receivedNotes[denom] || 0;
                      return (
                        <div key={denom} className={`banknote-btn-container ${count > 0 ? 'active' : ''}`}>
                          <button
                            type="button"
                            className={`banknote-btn note-${denom}`}
                            onClick={() => handleAddNote(denom)}
                          >
                            <span className="note-value">{denom}</span>
                            <span className="note-currency">EGP</span>
                            {count > 0 && <span className="note-badge-count">{count}</span>}
                          </button>
                          {count > 0 && (
                            <button
                              type="button"
                              className="banknote-minus-btn"
                              onClick={() => handleRemoveNote(denom)}
                              title={`Remove one EGP ${denom}`}
                            >
                              -
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {parseFloat(paidAmount) >= (totalAmount + taxAmount) && (
                <div className="change-feedback glass-panel animated-fade">
                  <span>Calculated Change / Refund:</span>
                  <strong>EGP {(parseFloat(paidAmount) - (totalAmount + taxAmount)).toFixed(2)}</strong>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-success w-full checkout-submit"
                disabled={loading || cart.length === 0}
              >
                <CreditCard size={18} />
                <span>{loading ? 'Processing Sale...' : 'Process Checkout'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Bill count grid for open/close shift modals */
        .bill-count-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        .bill-count-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bill-count-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        .bill-count-input {
          padding: 8px 10px !important;
          font-size: 14px !important;
          text-align: center;
          width: 100%;
        }
        .shift-audit-summary {
          padding: 14px 16px;
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-glass);
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .audit-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .audit-total {
          border-top: 1px solid var(--border-glass);
          padding-top: 8px;
          font-weight: 700;
          color: white;
        }

        .pos-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .pos-grid {
          display: grid;
          grid-template-columns: 1.8fr 1.2fr;
          gap: 24px;
        }

        @media (max-width: 1200px) {
          .pos-grid {
            grid-template-columns: 1fr;
          }
        }

        .catalogue-column, .checkout-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .search-box-panel, .cart-panel, .checkout-summary-panel {
          padding: 24px;
          border-radius: var(--radius-lg);
        }

        .search-box-panel h2, .cart-panel h2, .checkout-summary-panel h2 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-glass);
        }

        .pos-search-wrapper {
          position: relative;
        }

        .pos-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
        }

        .search-input {
          width: 100%;
          padding-left: 42px;
        }

        .pos-controls-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .pos-controls-grid {
            grid-template-columns: 1fr;
          }
        }

        .pos-barcode-wrapper {
          position: relative;
        }

        .pos-barcode-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
        }

        .barcode-input {
          width: 100%;
          padding-left: 42px;
          font-family: monospace;
          letter-spacing: 0.05em;
        }

        .search-results-dropdown {
          position: absolute;
          width: calc(100% - 48px);
          max-height: 250px;
          overflow-y: auto;
          z-index: 10;
          margin-top: 6px;
          padding: 8px 0;
          background: #0f1626e6;
        }

        .search-result-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 16px;
          cursor: pointer;
          font-size: 13px;
          border-bottom: 1px solid var(--border-glass);
          transition: var(--transition-smooth);
        }

        .search-result-item:hover {
          background: rgba(255,255,255,0.04);
        }

        .drug-result-info {
          display: flex;
          flex-direction: column;
        }

        .drug-result-name {
          font-weight: 600;
          color: white;
        }

        .drug-result-batch {
          font-size: 10px;
          color: var(--color-text-muted);
        }

        .drug-result-action {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .drug-result-price {
          font-weight: 700;
          color: var(--color-accent-teal);
        }

        .drug-result-stock {
          font-size: 11px;
          color: var(--color-text-secondary);
        }

        .no-results-pos {
          text-align: center;
          padding: 12px;
          font-size: 13px;
          color: var(--color-text-muted);
        }

        .cart-header-pos {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .cart-header-pos h2 {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .empty-cart-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--color-text-muted);
          text-align: center;
          gap: 16px;
        }

        .empty-cart-icon {
          opacity: 0.3;
        }

        .pos-table td, .pos-table th {
          padding: 12px 16px;
        }

        .item-name-cell {
          display: flex;
          flex-direction: column;
        }

        .qty-tag {
          font-size: 10px;
          color: var(--color-text-muted);
        }

        .qty-picker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-sm);
          padding: 2px 4px;
        }

        .qty-btn {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: none;
          background: var(--bg-tertiary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .qty-btn:hover:not(:disabled) {
          background: var(--color-accent-teal);
        }

        .qty-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .qty-value {
          font-size: 13px;
          font-weight: 700;
          min-width: 16px;
          text-align: center;
        }

        .cart-delete-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .cart-delete-btn:hover {
          color: var(--color-danger);
        }

        .summary-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: var(--color-text-secondary);
        }

        .total-row {
          border-top: 1px solid var(--border-glass);
          padding-top: 12px;
          font-weight: 700;
          color: white;
        }

        .net-payable-text {
          font-size: 20px;
          color: var(--color-accent-teal);
        }

        .checkout-paid-input {
          font-size: 18px;
          font-weight: 700;
          text-align: right;
          color: white;
        }

        .change-feedback {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          background: var(--color-success-bg);
          border: 1px solid rgba(16, 185, 129, 0.2);
          margin-bottom: 20px;
        }

        .change-feedback strong {
          color: var(--color-success);
          font-size: 16px;
        }

        .checkout-submit {
          padding: 14px;
          font-size: 15px;
        }

        /* Receipt Modal Specifics */
        .receipt-modal {
          max-width: 380px;
          padding: 24px;
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .receipt-success-icon {
          color: var(--color-success);
          margin-bottom: 12px;
        }

        .receipt-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .receipt-header p {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin-top: 4px;
        }

        .receipt-meta {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: var(--color-text-muted);
          margin-bottom: 12px;
        }

        .receipt-divider {
          border-top: 1px dashed var(--border-glass);
          margin: 16px 0;
        }

        .receipt-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .receipt-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .item-qty-name {
          color: var(--color-text-primary);
        }

        .item-price {
          font-weight: 600;
        }

        .receipt-totals {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        .receipt-row.total {
          font-weight: 700;
          color: white;
          font-size: 14px;
        }

        .receipt-row.balance {
          color: var(--color-success);
          font-weight: 700;
          font-size: 13px;
        }

        .receipt-actions {
          margin-top: 24px;
        }

        .banknote-selector-widget {
          margin-top: 16px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .widget-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .btn-clear-notes {
          background: none;
          border: none;
          color: var(--color-danger);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          transition: var(--transition-smooth);
        }

        .btn-clear-notes:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .banknote-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        @media (max-width: 480px) {
          .banknote-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .banknote-btn-container {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .banknote-btn {
          width: 100%;
          height: 48px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.02);
          color: var(--color-text-secondary);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .banknote-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .banknote-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .banknote-btn:hover::before {
          opacity: 1;
        }

        .banknote-btn-container.active .banknote-btn {
          border-color: var(--color-accent-teal);
          color: white;
          box-shadow: 0 0 12px rgba(20, 184, 166, 0.2);
        }

        /* Distinct colors for banknote denominations */
        .note-200 { background: rgba(59, 130, 246, 0.05); }
        .note-100 { background: rgba(16, 185, 129, 0.05); }
        .note-50 { background: rgba(245, 158, 11, 0.05); }
        .note-20 { background: rgba(139, 92, 246, 0.05); }
        .note-10 { background: rgba(239, 68, 68, 0.05); }
        .note-5 { background: rgba(236, 72, 153, 0.05); }
        .note-1 { background: rgba(107, 114, 128, 0.05); }

        .banknote-btn-container.active .note-200 { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.5); }
        .banknote-btn-container.active .note-100 { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.5); }
        .banknote-btn-container.active .note-50 { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.5); }
        .banknote-btn-container.active .note-20 { background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.5); }
        .banknote-btn-container.active .note-10 { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.5); }
        .banknote-btn-container.active .note-5 { background: rgba(236, 72, 153, 0.15); border-color: rgba(236, 72, 153, 0.5); }
        .banknote-btn-container.active .note-1 { background: rgba(107, 114, 128, 0.15); border-color: rgba(107, 114, 128, 0.5); }

        .note-value {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .note-currency {
          font-size: 8px;
          font-weight: 500;
          opacity: 0.6;
          margin-top: -2px;
        }

        .note-badge-count {
          position: absolute;
          top: 3px;
          right: 3px;
          background: var(--color-accent-teal);
          color: #0b0f19;
          font-size: 9px;
          font-weight: 800;
          height: 15px;
          min-width: 15px;
          padding: 0 3px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .banknote-minus-btn {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          border: none;
          font-size: 10px;
          font-weight: 800;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          z-index: 2;
          transition: transform 0.2s ease;
        }

        .banknote-minus-btn:hover {
          transform: scale(1.15);
          background: #dc2626;
        }

        /* Success receipt changes styles */
        .receipt-change-notes {
          margin-top: 16px;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed var(--border-glass);
        }

        .change-notes-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-secondary);
          display: block;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .notes-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .note-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 11px;
        }

        .note-count {
          color: var(--color-success);
          font-weight: 800;
        }

        .note-denom {
          color: white;
          font-weight: 600;
        }

        /* Drug Grid Panel Catalogue */
        .drug-grid-panel {
          padding: 24px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .grid-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 10px;
        }

        .grid-header h2 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin-bottom: 0 !important;
          border-bottom: none !important;
          padding-bottom: 0 !important;
        }

        .drugs-scroll-container {
          max-height: 280px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .drugs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }

        .drug-card {
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .drug-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--color-accent-teal);
          transform: translateY(-1px);
        }

        .drug-card-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .drug-card-info .drug-name {
          font-size: 13px;
          font-weight: 700;
          color: white;
          text-align: left;
        }

        .drug-card-info .drug-price {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-accent-teal);
          text-align: left;
        }

        .drug-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: var(--color-text-muted);
        }

        .drug-card.low-stock {
          border-color: rgba(239, 68, 68, 0.2);
        }

        .drug-card.low-stock:hover {
          border-color: rgba(239, 68, 68, 0.5);
        }

        .no-drugs-found {
          text-align: center;
          color: var(--color-text-muted);
          padding: 24px;
          font-size: 13px;
        }

        /* Active shift session banner */
        .active-shift-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.01);
          border: 1px dashed var(--border-glass);
          margin-bottom: 20px;
        }

        .shift-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .shift-label {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--color-text-muted);
          font-weight: 700;
        }

        .shift-cashier {
          font-size: 12px;
          color: white;
          font-weight: 600;
        }

        .btn-close-shift {
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
        }

        .btn-exact-cash:hover {
          color: white !important;
          text-decoration: underline;
        }

        /* Drug visual image catalogue styling */
        .drug-image-wrapper {
          height: 70px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          gap: 4px;
          border-radius: var(--radius-sm);
          margin-bottom: 4px;
        }
        .drug-icon-svg {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
        }
        .drug-type-label {
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
          font-weight: 700;
        }

        /* Receipt Print Styles */
        @media print {
          body * {
            visibility: hidden;
          }
          .modal-overlay, .printable-receipt, .printable-receipt * {
            visibility: visible;
          }
          .modal-overlay {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: none !important;
          }
          .printable-receipt {
            border: none !important;
            background: none !important;
            box-shadow: none !important;
            margin: 0 auto;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};
