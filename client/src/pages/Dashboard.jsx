import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  Receipt, 
  Package,
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { fmt, colorFor, initials } from '../utils/formatters';
import GrossProfitChart from '../components/GrossProfitChart';

const Dashboard = () => {
  const { user, isOwner } = useAuth();
  const [stats, setStats] = useState(null);
  const [customerCount, setCustomerCount] = useState(0);
  const [range, setRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [isFetchingRange, setIsFetchingRange] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!stats) {
          setLoading(true);
        } else {
          setIsFetchingRange(true);
        }

        const statsEndpoint =
          user?.role === 'Cashier'
            ? '/dashboard/cashier-stats'
            : `/dashboard/stats?range=${range}`;

        const [statsRes, custRes] = await Promise.all([
          api.get(statsEndpoint),
          customerCount === 0
            ? api.get('/customers').catch(() => ({ data: { data: [] } }))
            : Promise.resolve(null)
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (custRes?.data?.data) {
          setCustomerCount(custRes.data.data.length);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
        setIsFetchingRange(false);
      }
    };

    fetchDashboardData();
  }, [user?.role, range]);

  if (loading) {
    return (
      <div className="view space-y-6">
        <div className="h-10 w-64 bg-[var(--surface)] border border-[var(--line)] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 h-36 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] animate-pulse" />
          <div className="h-36 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] animate-pulse" />
          <div className="h-36 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-56 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] animate-pulse" />
          <div className="h-56 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] animate-pulse" />
        </div>
      </div>
    );
  }

  const totalReceivables = stats?.totalReceivables || 0;
  const topDebtors = stats?.topDebtors || [];
  const lowStockItems = stats?.lowStockItems || [];
  const salesDays = stats?.salesLast7Days || [];
  const maxSale = Math.max(...salesDays.map((d) => d.sales || 0), 1);

  // Cashier View: Strip all financial metrics, display operational terminal
  if (user?.role === 'Cashier') {
    return (
      <div className="view">
        <div className="dash-head">
          <div>
            <p>Cashier view</p>
            <h1>Welcome, {user?.name || 'Cashier'} (Cashier)</h1>
          </div>
        </div>

        {/* Single Hero Receivables Card */}
        <div className="kpis single">
          <div className="stat hero">
            <div className="top">
              <div className="lbl">Total Udhaar (Receivables)</div>
              <div className="ibadge">
                <Wallet className="ico" />
              </div>
            </div>
            <div>
              <div className="val">{fmt(totalReceivables)}</div>
              <div className="meta">
                Owed by {topDebtors.length} customer{topDebtors.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>
        </div>

        {/* Operational Cards: Debtors & Stock */}
        <div className="grid-2">
          {/* Top Debtors Card */}
          <div className="card">
            <h3>
              Top debtors
              {topDebtors.length > 0 && (
                <Link className="btn btn-ghost btn-sm" to="/customers">
                  View all
                </Link>
              )}
            </h3>
            {topDebtors.length > 0 ? (
              <div className="list">
                {topDebtors.map((c, i) => (
                  <Link key={c._id || i} className="li" to={`/customers/${c._id}`}>
                    <div className="rank">{i + 1}</div>
                    <div
                      className="av"
                      style={{
                        background: colorFor(c.name),
                        width: '38px',
                        height: '38px',
                        fontSize: '0.8rem',
                        borderRadius: '12px'
                      }}
                    >
                      {initials(c.name)}
                    </div>
                    <div className="grow">
                      <b>{c.name}</b>
                      <small>{c.phone}</small>
                    </div>
                    <b style={{ fontFamily: 'var(--display)', flex: 'none' }}>
                      {fmt(c.totalBalance)}
                    </b>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty">
                <div className="em-ico">
                  <CheckCircle2 className="w-7 h-7 text-brand" />
                </div>
                <b>No outstanding udhaar</b>
                <p className="text-sm text-muted mt-1">
                  Your customers are all settled up.
                </p>
              </div>
            )}
          </div>

          {/* Low Stock Alerts Card */}
          <div className="card">
            <h3>
              Low stock alerts
              {lowStockItems.length > 0 && (
                <Link className="badge warn" to="/inventory">
                  {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}
                </Link>
              )}
            </h3>
            {lowStockItems.length > 0 ? (
              <div className="list">
                {lowStockItems.map((p, i) => (
                  <Link key={p._id || i} className="li" to="/inventory">
                    <div className="grow">
                      <b>{p.name}</b>
                      <small>{p.sku}</small>
                    </div>
                    <span className="badge warn">
                      <AlertTriangle className="ico" /> {p.stockQuantity} left
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty">
                <div className="em-ico">
                  <CheckCircle2 className="w-7 h-7 text-brand" />
                </div>
                <b>No low stock items</b>
                <p className="text-sm text-muted mt-1">
                  Everything is well stocked in your store.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Owner View: Full Financial Intelligence & Dashboard
  const currentMetrics = {
    totalSales: stats?.totalSales ?? stats?.breakdown?.[range]?.totalSales ?? 0,
    grossProfit: stats?.grossProfit ?? stats?.breakdown?.[range]?.grossProfit ?? 0,
    totalExpenses: stats?.totalExpenses ?? stats?.breakdown?.[range]?.totalExpenses ?? 0,
    netIncome: stats?.netIncome ?? stats?.breakdown?.[range]?.netIncome ?? 0
  };

  const margin = currentMetrics.totalSales > 0 
    ? Math.round((currentMetrics.netIncome / currentMetrics.totalSales) * 100) 
    : 0;

  const rangeLabel = range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month';

  return (
    <div className="view">
      {/* Dashboard Header with Date Range Segmented Control */}
      <div className="dash-head">
        <div>
          <p>{rangeLabel}</p>
          <h1>Welcome, {user?.shopName || 'ShopLedger'} (Owner)</h1>
        </div>
        <div className="seg" role="group" aria-label="Date range selector">
          <button
            type="button"
            className={range === 'today' ? 'active' : ''}
            onClick={() => setRange('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={range === 'week' ? 'active' : ''}
            onClick={() => setRange('week')}
          >
            This Week
          </button>
          <button
            type="button"
            className={range === 'month' ? 'active' : ''}
            onClick={() => setRange('month')}
          >
            This Month
          </button>
        </div>
      </div>

      {/* 4 Metric Cards + Hero Net Income + Total Udhaar */}
      <div className="kpis">
        {/* Hero Card: Net Income */}
        <div className={`stat hero ${currentMetrics.netIncome < 0 ? 'loss' : ''}`}>
          <div className="top">
            <div className="lbl">Net Income</div>
            <span className="pill">
              {currentMetrics.netIncome >= 0 ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 inline" /> Profitable
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 inline" /> Below break-even
                </>
              )}
            </span>
          </div>
          <div>
            <div className="val">{fmt(currentMetrics.netIncome)}</div>
            <div className="meta">
              {margin}% profit margin · {rangeLabel.toLowerCase()}
            </div>
          </div>
        </div>

        {/* Card 1: Gross Profit */}
        <div className="stat">
          <div className="top">
            <div className="lbl">Gross Profit</div>
            <div className="ibadge">
              <Coins className="ico" />
            </div>
          </div>
          <div>
            <div className="val">{fmt(currentMetrics.grossProfit)}</div>
            <div className="meta">Sales revenue minus item cost</div>
          </div>
        </div>

        {/* Card 2: Total Sales */}
        <div className="stat gold">
          <div className="top">
            <div className="lbl">Total Sales</div>
            <div className="ibadge">
              <TrendingUp className="ico" />
            </div>
          </div>
          <div>
            <div className="val">{fmt(currentMetrics.totalSales)}</div>
            <div className="meta">Total revenue billed</div>
          </div>
        </div>

        {/* Card 3: Expenses */}
        <div className="stat exp">
          <div className="top">
            <div className="lbl">Expenses</div>
            <div className="ibadge">
              <Receipt className="ico" />
            </div>
          </div>
          <div>
            <div className="val">{fmt(currentMetrics.totalExpenses)}</div>
            <div className="meta">Rent, utilities &amp; running costs</div>
          </div>
        </div>

        {/* Card 4: Total Udhaar */}
        <div className="stat gold">
          <div className="top">
            <div className="lbl">Total Udhaar</div>
            <div className="ibadge">
              <Wallet className="ico" />
            </div>
          </div>
          <div>
            <div className="val">{fmt(totalReceivables)}</div>
            <div className="meta">
              {topDebtors.length} debtor{topDebtors.length === 1 ? '' : 's'} owe your store
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Gross Profit Trend Chart Card (Recharts) */}
      <div className="card mb-4" style={{ marginBottom: '16px' }}>
        <div className="chart-head">
          <div>
            <h3>Gross Profit &amp; Sales Trend</h3>
            <small>Last 30 days daily performance breakdown</small>
          </div>
          <div className="legend">
            <span>
              <i style={{ background: 'var(--brand2)' }} />
              Gross Profit
            </span>
            <span>
              <i style={{ background: 'var(--gold)' }} />
              Total Sales
            </span>
          </div>
        </div>

        <div className="pt-2">
          <GrossProfitChart data={stats?.profitTrend30Days || []} />
        </div>
      </div>

      {/* Grid: Low Stock Alerts & Top Debtors */}
      <div className="grid-2">
        {/* Low Stock Alerts Card */}
        <div className="card">
          <h3>
            Low stock alerts
            {lowStockItems.length > 0 && (
              <Link className="badge warn" to="/inventory">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}
              </Link>
            )}
          </h3>
          {lowStockItems.length > 0 ? (
            <div className="list">
              {lowStockItems.map((p, i) => (
                <Link key={p._id || i} className="li" to="/inventory">
                  <div className="grow">
                    <b>{p.name}</b>
                    <small>{p.sku}</small>
                  </div>
                  <span className="badge warn">
                    <AlertTriangle className="ico" /> {p.stockQuantity} left
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="em-ico">
                <CheckCircle2 className="w-7 h-7 text-brand" />
              </div>
              <b>No low stock items</b>
              <p className="text-sm text-muted mt-1">
                All inventory levels are above their threshold.
              </p>
            </div>
          )}
        </div>

        {/* Top Debtors Card */}
        <div className="card">
          <h3>
            Top debtors
            {topDebtors.length > 0 && (
              <Link className="btn btn-ghost btn-sm" to="/customers">
                View all
              </Link>
            )}
          </h3>
          {topDebtors.length > 0 ? (
            <div className="list">
              {topDebtors.map((c, i) => (
                <Link key={c._id || i} className="li" to={`/customers/${c._id}`}>
                  <div className="rank">{i + 1}</div>
                  <div
                    className="av"
                    style={{
                      background: colorFor(c.name),
                      width: '38px',
                      height: '38px',
                      fontSize: '0.8rem',
                      borderRadius: '12px'
                    }}
                  >
                    {initials(c.name)}
                  </div>
                  <div className="grow">
                    <b>{c.name}</b>
                    <small>{c.phone}</small>
                  </div>
                  <b style={{ fontFamily: 'var(--display)', flex: 'none' }}>
                    {fmt(c.totalBalance)}
                  </b>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="em-ico">
                <CheckCircle2 className="w-7 h-7 text-brand" />
              </div>
              <b>No outstanding udhaar</b>
              <p className="text-sm text-muted mt-1">
                Your customers are all settled up.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
