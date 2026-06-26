import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Clock, ListFilter, TrendingUp, CreditCard, Download } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const Sales: React.FC = () => {
  const { user } = useAuth();
  
  const [sales, setSales] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Aggregate stats
  const [totals, setTotals] = useState({
    grossRevenue: 0,
    totalTax: 0,
    netRevenue: 0,
    transactionCount: 0
  });

  const [productPerformance, setProductPerformance] = useState<{
    drugs: any[];
    totalSold: number;
  }>({ drugs: [], totalSold: 0 });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${user?.token || ''}` };
        
        // Fetch historical sales logs
        const response = await fetch('/api/sales', { headers });
        const data = await response.json();
        const salesList = data.sales || [];
        
        // Calculate stats
        let gross = 0;
        let tax = 0;
        salesList.forEach((s: any) => {
          gross += parseFloat(s.totalPrice || 0);
          tax += parseFloat(s.tax || 0);
        });

        const salesListNewestFirst = [...salesList].reverse();
        setSales(salesListNewestFirst);
        setTotals({
          grossRevenue: gross,
          totalTax: tax,
          netRevenue: gross - tax,
          transactionCount: salesList.length
        });

        // Compute product performance data for the 100 most recent transactions
        const recentTransactions = salesListNewestFirst.slice(0, 100);
        const drugQuantities: Record<string, number> = {};
        let totalDrugsSold = 0;

        recentTransactions.forEach((sale: any) => {
          const drugNameStr = Array.isArray(sale.drugName) 
            ? sale.drugName.join(', ') 
            : (sale.drugName || '');
          
          // Split by comma in case multiple items are checked out
          const items = drugNameStr.split(',');
          items.forEach((item: string) => {
            const cleanItem = item.trim();
            if (!cleanItem) return;
            
            // Regex to parse "Name (Qty x Price)"
            const match = cleanItem.match(/^(.+?)\s*\(\s*(\d+)\s*x/i);
            if (match) {
              const name = match[1].trim();
              const qty = parseInt(match[2], 10);
              drugQuantities[name] = (drugQuantities[name] || 0) + qty;
              totalDrugsSold += qty;
            } else {
              drugQuantities[cleanItem] = (drugQuantities[cleanItem] || 0) + 1;
              totalDrugsSold += 1;
            }
          });
        });

        const sortedDrugs = Object.entries(drugQuantities)
          .map(([name, qty]) => ({
            name,
            quantity: qty,
            ratio: totalDrugsSold > 0 ? (qty / totalDrugsSold) : 0
          }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 15); // Top 15 items

        setProductPerformance({
          drugs: sortedDrugs,
          totalSold: totalDrugsSold
        });

        // Fetch monthly chart aggregates
        const chartRes = await fetch('/api/sales/getSalesChartInfo', { headers });
        const chartDataJson = await chartRes.json();
        const monthlySales = chartDataJson.sales || [];

        const formattedChart = monthNames.map((name, index) => {
          const monthNum = index + 1;
          const match = monthlySales.find((m: any) => m._id === monthNum);
          return {
            month: name,
            sales: match ? match.total : 0
          };
        });
        setChartData(formattedChart);

      } catch (err) {
        console.error('Failed to load sales database', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesData();
  }, [user]);

  // Bar Chart Configuration
  const barConfig = {
    labels: chartData.map(d => d.month),
    datasets: [
      {
        label: 'Monthly Earnings (EGP)',
        data: chartData.map(d => d.sales),
        backgroundColor: 'rgba(13, 148, 136, 0.4)',
        borderColor: 'rgba(13, 148, 136, 1)',
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(13, 148, 136, 0.7)',
      }
    ]
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
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b' } }
    }
  };

  // Horizontal Bar Chart Configuration for Product Performance
  const horizontalBarConfig = {
    labels: productPerformance.drugs.map(d => d.name),
    datasets: [
      {
        label: 'Number of Drugs Sold (Quantity)',
        data: productPerformance.drugs.map(d => d.quantity),
        backgroundColor: 'rgba(20, 184, 166, 0.4)',
        borderColor: 'rgba(20, 184, 166, 1)',
        borderWidth: 1.5,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(20, 184, 166, 0.7)',
      }
    ]
  };

  const horizontalChartOptions = {
    indexAxis: 'y' as const,
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
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            const percentage = ((val / productPerformance.totalSold) * 100).toFixed(1);
            return ` Quantity: ${val} (${percentage}% of total sales)`;
          }
        }
      }
    },
    scales: {
      x: { 
        grid: { color: 'rgba(255,255,255,0.03)' }, 
        ticks: { color: '#64748b' },
        title: {
          display: true,
          text: 'Quantity Sold',
          color: '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 10 }
        }
      },
      y: { 
        grid: { color: 'rgba(255,255,255,0.03)' }, 
        ticks: { color: '#94a3b8' } 
      }
    }
  };

  return (
    <div className="sales-analytics-page animated-fade">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Sales & Analytics Portal</h1>
          <p>Review comprehensive historical transactions, revenue margins, and tax reporting summaries</p>
        </div>
        <button 
          className="btn btn-primary btn-print-report" 
          onClick={() => window.print()} 
          disabled={loading || sales.length === 0}
        >
          <Download size={16} style={{ marginRight: '8px' }} />
          Print Sales Report
        </button>
      </div>

      {/* Grid Summaries */}
      <div className="stat-grid">
        <div className="stat-card glass-panel">
          <div className="stat-card-icon text-teal">
            <DollarSign size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Gross Earnings</h3>
            <p>EGP {totals.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-card-icon text-blue">
            <TrendingUp size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Net Revenue</h3>
            <p>EGP {totals.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-card-icon text-warning">
            <CreditCard size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Tax Liabilities (5%)</h3>
            <p>EGP {totals.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-card-icon text-success">
            <Clock size={22} />
          </div>
          <div className="stat-card-info">
            <h3>Transactions Logged</h3>
            <p>{totals.transactionCount} Orders</p>
          </div>
        </div>
      </div>

      {/* Sales Analytics Chart */}
      <div className="chart-wrapper glass-panel animated-fade" style={{ marginBottom: '24px', padding: '24px' }}>
        <div className="panel-header-sales" style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--border-glass)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} className="text-teal" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>Monthly Revenue Chart</h2>
        </div>
        <div className="chart-container-large" style={{ position: 'relative', height: '300px', width: '100%' }}>
          {loading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <Bar data={barConfig} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Product Performance Chart */}
      <div className="chart-wrapper glass-panel animated-fade" style={{ marginBottom: '24px', padding: '24px' }}>
        <div className="panel-header-sales" style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--border-glass)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} className="text-teal" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>Product Performance (Top Fast-Moving Drugs)</h2>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px', marginTop: '-10px' }}>
          Visualizing the ratio and total quantity of drugs sold in the 100 most recent transactions.
        </p>
        <div className="chart-container-large" style={{ position: 'relative', height: '400px', width: '100%' }}>
          {loading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : productPerformance.drugs.length === 0 ? (
            <div className="empty-cart-view" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p>No transaction details available to plot drug ratio.</p>
            </div>
          ) : (
            <Bar data={horizontalBarConfig} options={horizontalChartOptions} />
          )}
        </div>
      </div>

      {/* Transaction Log Table */}
      <div className="table-container glass-panel animated-fade printable-table-section">
        <div className="panel-header-sales">
          <ListFilter size={18} className="text-teal" />
          <h2>Historical Sales Transactions</h2>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Retrieving transaction history...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="empty-cart-view">
            <p>No transactions registered in database yet.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Purchased Items (Qty)</th>
                <th>Tax Charged</th>
                <th>Total Price</th>
                <th>Paid Amount</th>
                <th>Change Returned</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td>{new Date(sale.dateTime || Date.now()).toLocaleString()}</td>
                  <td><strong>{sale.drugName}</strong></td>
                  <td className="text-warning">EGP {parseFloat(sale.tax).toFixed(2)}</td>
                  <td className="text-teal"><strong>EGP {parseFloat(sale.totalPrice).toFixed(2)}</strong></td>
                  <td>EGP {parseFloat(sale.paidAmount).toFixed(2)}</td>
                  <td className="text-success">EGP {parseFloat(sale.balance).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .panel-header-sales {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-glass);
        }

        .panel-header-sales h2 {
          font-size: 15px;
          font-weight: 700;
          color: white;
        }

        .text-success {
          color: var(--color-success);
        }

        .btn-print-report {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .app-container {
            display: block !important;
          }
          .sidebar, .top-header, .page-header, .stat-grid, .chart-wrapper, .panel-header-sales {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .printable-table-section {
            border: none !important;
            background: none !important;
            box-shadow: none !important;
          }
          .custom-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .custom-table th, .custom-table td {
            color: black !important;
            border: 1px solid #ddd !important;
            background: transparent !important;
            padding: 8px !important;
            font-size: 11px !important;
          }
          .custom-table td strong, .custom-table td.text-teal strong {
            color: black !important;
          }
        }
      `}} />
    </div>
  );
};
