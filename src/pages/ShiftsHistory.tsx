import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  DollarSign, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw,
  Eye
} from 'lucide-react';

interface ShiftItem {
  _id: string;
  cashierEmail: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  expectedClosingFloat?: number;
  closingFloat?: number;
  status: 'OPEN' | 'CLOSED';
  salesCount: number;
  salesTotal: number;
}

export const ShiftsHistory: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    console.log('ShiftsHistory: fetchShifts triggered, user token exists:', !!user?.token);
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${user?.token || ''}` };
      const response = await fetch('/api/shifts', { headers });
      if (!response.ok) {
        throw new Error('Failed to load shifts audit trail');
      }
      const data = await response.json();
      setShifts(data.shifts || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred fetching shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [user]);

  const getDiscrepancy = (shift: ShiftItem) => {
    if (shift.status === 'OPEN' || shift.expectedClosingFloat === undefined || shift.closingFloat === undefined) {
      return null;
    }
    return shift.closingFloat - shift.expectedClosingFloat;
  };

  const getDiscrepancyBadge = (diff: number | null) => {
    if (diff === null) return <span className="badge badge-warning">Active Shift</span>;
    if (diff === 0) {
      return (
        <span className="badge badge-success">
          Balanced (0.00)
        </span>
      );
    }
    if (diff > 0) {
      return (
        <span className="badge badge-success-alt">
          Surplus (+{diff.toFixed(2)} EGP)
        </span>
      );
    }
    return (
      <span className="badge badge-danger">
        Shortage ({diff.toFixed(2)} EGP)
      </span>
    );
  };

  return (
    <div className="shifts-history-page animated-fade">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Shifts Audit Log</h1>
          <p>Historical audit logs of cashier opening balances, sales margins, closing floats, and drawer reconciliations</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchShifts} disabled={loading}>
          <RotateCw size={16} className={loading ? 'spin-animation' : ''} />
          <span>Refresh Audit</span>
        </button>
      </div>

      <div className="table-container glass-panel animated-fade">
        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Retrieving shifts audit trail...</p>
          </div>
        ) : error ? (
          <div className="auth-alert error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        ) : shifts.length === 0 ? (
          <div className="empty-cart-view">
            <p>No shift records have been logged yet.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Cashier</th>
                <th>Shift Duration</th>
                <th>Opening Float</th>
                <th>Shift Sales</th>
                <th>Expected Close</th>
                <th>Actual Close</th>
                <th>Audit Result</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => {
                const diff = getDiscrepancy(shift);
                return (
                  <tr key={shift._id}>
                    <td>
                      <strong>{shift.cashierEmail}</strong>
                    </td>
                    <td>
                      <div className="shift-duration-cell">
                        <Clock size={12} className="text-muted" style={{ marginRight: '6px' }} />
                        <span>
                          {new Date(shift.startTime).toLocaleString(undefined, { hour12: true })}
                        </span>
                        {shift.endTime ? (
                          <span className="text-secondary" style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                            to {new Date(shift.endTime).toLocaleString(undefined, { hour12: true })}
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '9px', padding: '1px 4px' }}>
                            Active Now
                          </span>
                        )}
                      </div>
                    </td>
                    <td>EGP {shift.openingFloat.toFixed(2)}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <strong>EGP {shift.salesTotal.toFixed(2)}</strong>
                        <span className="text-muted" style={{ display: 'block', fontSize: '10px' }}>
                          ({shift.salesCount} checkouts)
                        </span>
                      </div>
                    </td>
                    <td>
                      {shift.expectedClosingFloat !== undefined 
                        ? `EGP ${shift.expectedClosingFloat.toFixed(2)}` 
                        : '—'}
                    </td>
                    <td>
                      {shift.closingFloat !== undefined 
                        ? `EGP ${shift.closingFloat.toFixed(2)}` 
                        : '—'}
                    </td>
                    <td>{getDiscrepancyBadge(diff)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .shifts-history-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .spin-animation {
          animation: spin 1s linear infinite;
        }

        .badge-success-alt {
          background: rgba(16, 185, 129, 0.12) !important;
          color: #10b981 !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
        }

        .shift-duration-cell {
          font-size: 13px;
        }
      `}} />
    </div>
  );
};
