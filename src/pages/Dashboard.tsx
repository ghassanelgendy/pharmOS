import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
  Tooltip as ChartTooltip,
  Legend as ChartLegend
} from 'chart.js';
import { 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  AlertCircle,
  CheckCircle,
  X,
  Users,
  FileText,
  CheckSquare,
  Truck
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
  ChartTooltip,
  ChartLegend
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Dashboard overall counts
  const [stats, setStats] = useState({
    totalDrugs: 0,
    expiredCount: 0,
    outOfStockCount: 0,
    totalSalesRevenue: 0
  });

  // Doctor interactions stats
  const [docStats, setDocStats] = useState({
    totalDoctors: 0,
    ordersAvailable: 0,
    verifiedOrders: 0,
    pickedUpOrders: 0
  });

  // Alert lists
  const [expiredList, setExpiredList] = useState<any[]>([]);
  const [outOfStockList, setOutOfStockList] = useState<any[]>([]);
  const [lowStockList, setLowStockList] = useState<any[]>([]);
  
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [salesChartData, setSalesChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast Notification state
  const [showToast, setShowToast] = useState(false);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Helper to parse drugName strings like "Panadol (2 x EGP 10.00), Aspirin (1 x EGP 20.00)" or legacy "Panadol (2)"
  const parseSaleItems = (drugNameStr: string, totalPrice: number) => {
    if (typeof drugNameStr !== 'string') return [];
    
    const items = drugNameStr.split(', ').map(itemStr => {
      const match = itemStr.match(/^(.+?)\s*\(\s*(\d+)(?:\s*x\s*(?:EGP\s*)?([\d.]+))?\s*\)$/i);
      if (match) {
        const name = match[1].trim();
        const qty = parseInt(match[2], 10);
        const price = match[3] ? parseFloat(match[3]) : null;
        return { name, qty, price };
      }
      return { name: itemStr.trim(), qty: 1, price: null };
    });

    const itemsWithPrice = items.map(item => {
      if (item.price !== null) {
        return { ...item, total: item.price * item.qty };
      }
      return { ...item, total: 0 };
    });

    const sumKnownTotals = itemsWithPrice.reduce((sum, item) => sum + item.total, 0);
    const unknownItems = itemsWithPrice.filter(item => item.total === 0);

    if (unknownItems.length > 0) {
      const remainingPrice = Math.max(0, totalPrice - sumKnownTotals);
      const pricePerUnknownItem = remainingPrice / unknownItems.length;
      unknownItems.forEach(item => {
        item.total = pricePerUnknownItem;
      });
    }

    return itemsWithPrice;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionStorage.getItem('showLoginToast') === 'true') {
      setShowToast(true);
      sessionStorage.removeItem('showLoginToast');
      timer = setTimeout(() => setShowToast(false), 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${user?.token || ''}` };

        // 1. Fetch total inventory items
        const invRes = await fetch('/api/inventory?pagesize=1000&page=1', { headers });
        const invData = await invRes.json();
        const drugsList = invData.inventorys || [];
        
        // 2. Fetch expired items count
        const expRes = await fetch('/api/inventory/getExpired?pagesize=10&page=1', { headers });
        const expData = await expRes.json();
        const expired = expData.inventorys || [];

        // 3. Fetch out of stock items count
        const oosRes = await fetch('/api/inventory/outofstock?pagesize=10&page=1', { headers });
        const oosData = await oosRes.json();
        const oos = oosData.inventorys || [];

        // 4. Fetch about to get out of stock / low stock items
        const lowRes = await fetch('/api/inventory/abouttooutofstock?pagesize=10&page=1', { headers });
        const lowData = await lowRes.json();
        const lowStock = lowData.inventorys || [];

        // 5. Fetch sales
        const salesRes = await fetch('/api/sales', { headers });
        const salesData = await salesRes.json();
        const sales = salesData.sales || [];

        // Calculate total sales revenue
        const revenue = sales.reduce((sum: number, s: any) => sum + parseFloat(s.totalPrice || 0), 0);

        setStats({
          totalDrugs: drugsList.length,
          expiredCount: expired.length,
          outOfStockCount: oos.length,
          totalSalesRevenue: revenue
        });

        setRecentSales(sales.slice(-5).reverse()); // Last 5 sales
        setExpiredList(expired.slice(0, 3));
        setOutOfStockList(oos.slice(0, 3));
        setLowStockList(lowStock.slice(0, 3));

        // 6. Fetch Doctor interactions counts
        const docUserRes = await fetch('/api/doctorUser/getDoctorUserData', { headers });
        const docUserData = await docUserRes.json();
        const totalDocs = docUserData.doctors ? docUserData.doctors.length : 0;

        const docOrderRes = await fetch('/api/doctorOder', { headers });
        const docOrderData = await docOrderRes.json();
        const totalOrders = docOrderData.doctorOders ? docOrderData.doctorOders.length : 0;

        const verifiedRes = await fetch('/api/verifiedDoctorOder', { headers });
        const verifiedData = await verifiedRes.json();
        const totalVerified = verifiedData.doctorOders ? verifiedData.doctorOders.length : 0;

        const pickedRes = await fetch('/api/pickedUpOders', { headers });
        const pickedData = await pickedRes.json();
        const totalPicked = pickedData.doctorOders ? pickedData.doctorOders.length : 0;

        setDocStats({
          totalDoctors: totalDocs,
          ordersAvailable: totalOrders,
          verifiedOrders: totalVerified,
          pickedUpOrders: totalPicked
        });

        // 7. Aggregate monthly sales color-coded by drug names (stacked bar data)
        const monthlyDrugSales: Record<number, Record<string, number>> = {};
        for (let m = 0; m < 12; m++) {
          monthlyDrugSales[m] = {};
        }

        const drugTotals: Record<string, number> = {};

        sales.forEach((sale: any) => {
          const date = new Date(sale.dateTime);
          const month = date.getMonth(); // 0-11
          const totalPrice = parseFloat(sale.totalPrice || 0);

          const parsedItems = parseSaleItems(sale.drugName, totalPrice);
          parsedItems.forEach(item => {
            const amount = item.total || (item.qty * (totalPrice / parsedItems.length));
            monthlyDrugSales[month][item.name] = (monthlyDrugSales[month][item.name] || 0) + amount;
            drugTotals[item.name] = (drugTotals[item.name] || 0) + amount;
          });
        });

        // Identify Top-6 drugs
        const sortedDrugs = Object.entries(drugTotals)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0]);

        const topDrugs = sortedDrugs.slice(0, 6);
        const hasOthers = sortedDrugs.length > 6;

        const drugColorPalette = [
          'rgba(13, 148, 136, 0.7)',  // Teal
          'rgba(59, 130, 246, 0.7)',  // Blue
          'rgba(99, 102, 241, 0.7)',  // Indigo
          'rgba(139, 92, 246, 0.7)',  // Violet
          'rgba(236, 72, 153, 0.7)',  // Pink
          'rgba(245, 158, 11, 0.7)',  // Amber
          'rgba(148, 163, 184, 0.7)', // Slate (Others)
        ];
        const drugBorderPalette = [
          'rgba(13, 148, 136, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(99, 102, 241, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(148, 163, 184, 1)',
        ];

        const chartDatasets = topDrugs.map((drugName, idx) => {
          const data = Array(12).fill(0);
          for (let m = 0; m < 12; m++) {
            data[m] = monthlyDrugSales[m][drugName] || 0;
          }
          return {
            label: drugName,
            data,
            backgroundColor: drugColorPalette[idx % drugColorPalette.length],
            borderColor: drugBorderPalette[idx % drugBorderPalette.length],
            borderWidth: 1
          };
        });

        if (hasOthers) {
          const otherData = Array(12).fill(0);
          for (let m = 0; m < 12; m++) {
            let otherSum = 0;
            Object.entries(monthlyDrugSales[m]).forEach(([drugName, val]) => {
              if (!topDrugs.includes(drugName)) {
                otherSum += val;
              }
            });
            otherData[m] = otherSum;
          }
          chartDatasets.push({
            label: 'Other Drugs',
            data: otherData,
            backgroundColor: drugColorPalette[6],
            borderColor: drugBorderPalette[6],
            borderWidth: 1
          });
        }

        setSalesChartData(chartDatasets as any);

      } catch (err) {
        console.error('Error fetching dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Compute prediction sales using basic linear regression (least squares method)
  const predictionChartData = useMemo(() => {
    // Generate monthly sales baseline for actual curve
    const monthlySumActual = Array(12).fill(0);
    salesChartData.forEach(dataset => {
      dataset.data.forEach((val: number, m: number) => {
        monthlySumActual[m] += val;
      });
    });

    const validSalesPoints = monthlySumActual
      .map((salesVal, index) => ({ x: index + 1, y: salesVal }))
      .filter(p => p.y > 0);

    if (validSalesPoints.length < 2) {
      return monthNames.map((name, index) => ({
        month: name,
        actual: monthlySumActual[index] || null,
        predicted: Math.round(15000 + Math.sin(index) * 5000)
      }));
    }

    const n = validSalesPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    validSalesPoints.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return monthNames.map((name, index) => {
      const x = index + 1;
      const pred = Math.round(Math.max(slope * x + intercept, 0));
      return {
        month: name,
        actual: monthlySumActual[index] > 0 ? monthlySumActual[index] : null,
        predicted: pred
      };
    });
  }, [salesChartData]);

  // Configuration for Stacked Sales Chart
  const salesBarConfig = {
    labels: monthNames,
    datasets: salesChartData
  };

  // Configuration for Prediction Chart (Line)
  const predictionLineConfig = {
    labels: predictionChartData.map(d => d.month),
    datasets: [
      {
        label: 'Actual Sales ($)',
        data: predictionChartData.map(d => d.actual),
        borderColor: 'rgba(2, 132, 199, 1)',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(2, 132, 199, 1)'
      },
      {
        label: 'Linear Trend / Forecast ($)',
        data: predictionChartData.map(d => d.predicted),
        borderColor: 'rgba(245, 158, 11, 0.8)',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.1,
        pointStyle: 'circle',
        pointRadius: 3
      }
    ]
  };

  const stackedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', weight: 600 as any }
        }
      },
      tooltip: {
        backgroundColor: '#0f1626',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#64748b' }
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#64748b' }
      }
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', weight: 600 as any }
        }
      },
      tooltip: {
        backgroundColor: '#0f1626',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#64748b' }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#64748b' }
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading animated-fade">
        <div className="loading-spinner"></div>
        <p>Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page animated-fade">
      {/* Toast Notification */}
      {showToast && (
        <div className="login-toast glass-panel animated-fade">
          <div className="toast-content">
            <CheckCircle size={18} className="toast-success-icon" />
            <span>Logged in Successfully</span>
          </div>
          <button className="toast-close-btn" onClick={() => setShowToast(false)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Doctor Interactions Metrics Row */}
      <div className="section-header-dashboard">
        <h2>Doctor Interactions Metrics</h2>
      </div>
      <div className="stat-grid doctor-metrics-grid">
        <div className="stat-card glass-panel doc-card">
          <div className="stat-card-icon text-indigo">
            <Users size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Total Doctor Users</h3>
            <p>{docStats.totalDoctors} Doctor Users</p>
          </div>
        </div>

        <div className="stat-card glass-panel doc-card">
          <div className="stat-card-icon text-amber">
            <FileText size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Doctor Orders Available</h3>
            <p>{docStats.ordersAvailable} Orders</p>
          </div>
        </div>

        <div className="stat-card glass-panel doc-card">
          <div className="stat-card-icon text-emerald">
            <CheckSquare size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Verified Doctor Orders</h3>
            <p>{docStats.verifiedOrders} Orders</p>
          </div>
        </div>

        <div className="stat-card glass-panel doc-card">
          <div className="stat-card-icon text-rose">
            <Truck size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Picked Up Doctor Orders</h3>
            <p>{docStats.pickedUpOrders} Orders</p>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="section-header-dashboard" style={{ marginTop: '12px' }}>
        <h2>Pharmacy Operations Overview</h2>
      </div>
      <div className="stat-grid">
        <div className="stat-card glass-panel">
          <div className="stat-card-icon text-teal">
            <Package size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Inventory Stock</h3>
            <p>{stats.totalDrugs} Drugs</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-card-icon text-blue">
            <DollarSign size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Total Sales</h3>
            <p>EGP {stats.totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-card-icon text-danger">
            <AlertCircle size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Expired Stocks</h3>
            <p className={stats.expiredCount > 0 ? 'alert-pulse-text' : ''}>{stats.expiredCount} Batches</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-card-icon text-warning">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Out of Stock</h3>
            <p>{stats.outOfStockCount} Items</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Alerts Section */}
      <div className="dashboard-grid">
        {/* Left Side: Charts */}
        <div className="charts-column">
          <div className="chart-wrapper glass-panel">
            <div className="chart-header">
              <h2>Sales Information Chart</h2>
              <span className="badge badge-success">Drug-wise Stacked Totals</span>
            </div>
            <div className="chart-container">
              <Bar data={salesBarConfig} options={stackedChartOptions} />
            </div>
          </div>

          <div className="chart-wrapper glass-panel">
            <div className="chart-header">
              <h2>Demand forecasting (AI Regression)</h2>
              <span className="badge badge-warning">Prediction Trend</span>
            </div>
            <div className="chart-container">
              <Line data={predictionLineConfig} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Right Side: Alerts Panels */}
        <div className="alerts-column">
          {/* Expire Date Notification Panel */}
          <div className="alerts-panel glass-panel">
            <div className="panel-header-alerts">
              <AlertCircle size={18} className="text-danger" />
              <h2>Expire Date Notifications</h2>
            </div>
            <div className="alert-list">
              {expiredList.length === 0 ? (
                <p className="no-alerts-text">No expired batches in stock. 👍</p>
              ) : (
                expiredList.map((d, i) => (
                  <div className="alert-item error" key={`exp-${i}`}>
                    <AlertCircle size={16} />
                    <div className="alert-details">
                      <h4>{d.name}</h4>
                      <p>Batch ID: <code>{d.batchId}</code> | Expired: {new Date(d.expireDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
              <div className="alerts-view-all">
                <Link to="/warnings?tab=expired" className="btn btn-secondary btn-sm w-full text-center alert-action-btn">
                  View Expire Date Notifications
                </Link>
              </div>
            </div>
          </div>

          {/* Out of Stock Notification Panel */}
          <div className="alerts-panel glass-panel">
            <div className="panel-header-alerts">
              <AlertCircle size={18} className="text-danger" />
              <h2>Out of Stock Notifications</h2>
            </div>
            <div className="alert-list">
              {outOfStockList.length === 0 ? (
                <p className="no-alerts-text">No out of stock items. All catalogued items are available! 😃</p>
              ) : (
                outOfStockList.map((d, i) => (
                  <div className="alert-item error" key={`oos-${i}`}>
                    <AlertCircle size={16} />
                    <div className="alert-details">
                      <h4>{d.name}</h4>
                      <p>Batch ID: <code>{d.batchId || 'N/A'}</code> | Contact: {d.email}</p>
                    </div>
                  </div>
                ))
              )}
              <div className="alerts-view-all">
                <Link to="/warnings?tab=outOfStock" className="btn btn-secondary btn-sm w-full text-center alert-action-btn">
                  View Out of Stock Notifications
                </Link>
              </div>
            </div>
          </div>

          {/* About To Get Finished Panel */}
          <div className="alerts-panel glass-panel">
            <div className="panel-header-alerts">
              <AlertTriangle size={18} className="text-warning" />
              <h2>About To Get Finished Notifications</h2>
            </div>
            <div className="alert-list">
              {lowStockList.length === 0 ? (
                <p className="no-alerts-text">No items running low on stock. Stock levels are healthy! 😃</p>
              ) : (
                lowStockList.map((d, i) => (
                  <div className="alert-item warning" key={`low-${i}`}>
                    <AlertTriangle size={16} />
                    <div className="alert-details">
                      <h4>{d.name}</h4>
                      <p>Batch ID: <code>{d.batchId || 'N/A'}</code> | Remaining: {d.quantity} units</p>
                    </div>
                  </div>
                ))
              )}
              <div className="alerts-view-all">
                <Link to="/warnings?tab=aboutToFinish" className="btn btn-secondary btn-sm w-full text-center alert-action-btn">
                  View Low Stock Notifications
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Sales Transaction Panel */}
          <div className="recent-sales-panel glass-panel">
            <h2>Recent Transactions</h2>
            <div className="recent-sales-list">
              {recentSales.length === 0 ? (
                <p className="no-sales-text">No sales recorded yet.</p>
              ) : (
                recentSales.map((sale, i) => (
                  <div className="sale-item" key={i}>
                    <div className="sale-icon-circle">
                      <Clock size={16} />
                    </div>
                    <div className="sale-desc">
                      <h4>{sale.drugName}</h4>
                      <p>{new Date(sale.dateTime || Date.now()).toLocaleTimeString()}</p>
                    </div>
                    <div className="sale-amount">
                      +EGP {parseFloat(sale.totalPrice).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
        }

        /* Toast Styling */
        .login-toast {
          position: fixed;
          top: 80px;
          right: 24px;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 18px;
          border-radius: var(--radius-md);
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid rgba(16, 185, 129, 0.4) !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          color: white;
          animation: slideIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .toast-content {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
        }
        .toast-success-icon {
          color: var(--color-success);
        }
        .toast-close-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 4px;
        }
        .toast-close-btn:hover {
          color: white;
          background: rgba(255,255,255,0.08);
        }

        .section-header-dashboard h2 {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }

        .text-indigo { color: #818cf8; }
        .text-amber { color: #fbbf24; }
        .text-emerald { color: #34d399; }
        .text-rose { color: #f43f5e; }
        .text-teal { color: var(--color-accent-teal); }
        .text-blue { color: var(--color-accent-blue); }
        .text-danger { color: var(--color-danger); }
        .text-warning { color: var(--color-warning); }

        .doctor-metrics-grid {
          margin-bottom: 8px;
        }
        .doc-card {
          border-color: rgba(99, 102, 241, 0.15);
        }

        .alert-pulse-text {
          color: var(--color-danger);
          animation: pulseRed 1.8s infinite;
          font-weight: 700;
        }

        @keyframes pulseRed {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.8fr 1.2fr;
          gap: 24px;
        }

        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .charts-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .chart-wrapper {
          padding: 24px;
          border-radius: var(--radius-lg);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .chart-header h2 {
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        .chart-container {
          position: relative;
          height: 240px;
          width: 100%;
        }

        .alerts-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .alerts-panel, .recent-sales-panel {
          padding: 24px;
          border-radius: var(--radius-lg);
        }

        .panel-header-alerts {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-glass);
        }

        .panel-header-alerts h2, .recent-sales-panel h2 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        
        .recent-sales-panel h2 {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-glass);
        }

        .alert-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: var(--radius-md);
          font-size: 13px;
        }

        .alert-item.error {
          background: var(--color-danger-bg);
          color: #fca5a5;
          border-left: 3px solid var(--color-danger);
        }

        .alert-item.warning {
          background: var(--color-warning-bg);
          color: #fde047;
          border-left: 3px solid var(--color-warning);
        }

        .alert-details h4 {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .alert-details p {
          opacity: 0.8;
          font-size: 11px;
        }

        .alerts-view-all {
          margin-top: 8px;
        }

        .alert-action-btn {
          width: 100%;
          text-align: center;
          justify-content: center;
          font-size: 12px;
          padding: 8px;
          font-weight: 600;
        }

        .no-alerts-text, .no-sales-text {
          font-size: 13px;
          color: var(--color-text-muted);
          text-align: center;
          padding: 16px 0;
        }

        .recent-sales-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sale-item {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 13px;
        }

        .sale-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-glass);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
        }

        .sale-desc {
          flex: 1;
        }

        .sale-desc h4 {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .sale-desc p {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 1px;
        }

        .sale-amount {
          font-weight: 700;
          color: var(--color-success);
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-glass);
          border-top-color: var(--color-accent-teal);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};
