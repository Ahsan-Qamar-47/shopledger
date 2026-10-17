import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Wallet, TrendingUp, Users, AlertTriangle, CheckCircle2, Coins, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, colorFor, initials } from '../utils/formatters';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [customerCount, setCustomerCount] = useState(0);
  const [selectedRange, setSelectedRange] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsEndpoint = user?.role === 'Cashier' ? '/dashboard/cashier-stats' : '/dashboard/stats';
        const [statsRes, custRes] = await Promise.all([
          api.get(statsEndpoint),
          api.get('/customers').catch(() => ({ data: { data: [] } }))
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (custRes.data?.data) {
          setCustomerCount(custRes.data.data.length);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.role]);

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

  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const shopName = user?.shopName || 'ShopLedger';

  const totalReceivables = stats?.totalReceivables || 0;
  const totalSalesToday = stats?.totalSalesToday || 0;
  const topDebtors = stats?.topDebtors || [];
  const lowStockItems = stats?.lowStockItems || [];
  const salesDays = stats?.salesLast7Days || [];
  const weekTotal = salesDays.reduce((acc, curr) => acc + (curr.sales || 0), 0);
  const maxSale = Math.max(...salesDays.map((d) => d.sales || 0), 1);

  const currentMetrics = stats?.breakdown?.[selectedRange] || {
    totalSales: stats?.totalSales || 0,
    profitAmount: stats?.profitAmount || 0,
    grossProfit: stats?.grossProfit || 0,
    totalExpenses: stats?.totalExpenses || 0,
    netIncome: stats?.netIncome || 0
  };

  return (
    <div className="view">
      {/* Welcome Header */}
      <div className="page-head">
        <div>
          <p>{greet}</p>
          <h1>Welcome, {shopName}</h1>
        </div>
      </div>

      {/* Business Intelligence & Profit Overview (Owner only) vs Operational Terminal (Cashier) */}
      {user?.role === 'Cashier' ? (
        <div className="card mb-6 bg-[var(--surface2)] border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--ok-bg)] text-[var(--ok)] flex items-center justify-center flex-none">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Operational Terminal (Cashier)</h2>
              <p className="text-xs text-[var(--muted)]">Displaying active customer accounts, credit balances, and stock inventory</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--line)]">
            <div>
              <h2 className="text-base md:text-lg font-bold">Business Intelligence & Profitability</h2>
              <p className="text-xs text-[var(--muted)]">Aggregated sales, gross profit, expenses, and net earnings</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[var(--surface2)] rounded-xl border border-[var(--line)] self-start sm:self-auto">
              <button
                type="button"
                className={`btn btn-sm ${selectedRange === 'today' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedRange('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedRange === 'week' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedRange('week')}
              >
                This Week
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedRange === 'month' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedRange('month')}
              >
                This Month
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)]">
              <div className="lbl flex items-center gap-2 text-xs font-semibold text-[var(--muted)] mb-1 uppercase">
                <TrendingUp className="w-4 h-4 text-[var(--brand2)]" /> Total Sales
              </div>
              <div className="text-xl md:text-2xl font-bold font-serif text-[var(--ink)]">
                {formatCurrency(currentMetrics.totalSales)}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">Revenue for selected period</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)]">
              <div className="lbl flex items-center gap-2 text-xs font-semibold text-[var(--muted)] mb-1 uppercase">
                <Coins className="w-4 h-4 text-[var(--ok)]" /> Gross Profit
              </div>
              <div className="text-xl md:text-2xl font-bold font-serif text-[var(--ok)]">
                {formatCurrency(currentMetrics.grossProfit)}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">Sales minus product cost</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)]">
              <div className="lbl flex items-center gap-2 text-xs font-semibold text-[var(--muted)] mb-1 uppercase">
                <Receipt className="w-4 h-4 text-[var(--warn)]" /> Total Expenses
              </div>
              <div className="text-xl md:text-2xl font-bold font-serif text-[var(--warn)]">
                {formatCurrency(currentMetrics.totalExpenses)}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">Operating costs & overhead</div>
            </div>

            <div className={`p-4 rounded-2xl border ${currentMetrics.netIncome >= 0 ? 'bg-[var(--ok-bg)] border-[var(--ok)]/30' : 'bg-[var(--danger-bg)] border-[var(--danger)]/30'}`}>
              <div className="lbl flex items-center gap-2 text-xs font-semibold text-[var(--muted)] mb-1 uppercase">
                {currentMetrics.netIncome >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-[var(--ok)]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-[var(--danger)]" />
                )}
                Net Income
              </div>
              <div className={`text-xl md:text-2xl font-bold font-serif ${currentMetrics.netIncome >= 0 ? 'text-[var(--ok)]' : 'text-[var(--danger)]'}`}>
                {formatCurrency(currentMetrics.netIncome)}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">Gross profit minus expenses</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats Row */}
      <div className="stats">
        <div className="stat hero">
          <div className="lbl">
            <Wallet className="ico" /> Total Udhaar
          </div>
          <div className="val">{formatCurrency(totalReceivables)}</div>
          <div className="meta">
            Outstanding across {topDebtors.length} debtor{topDebtors.length === 1 ? '' : 's'}
          </div>
        </div>

        {user?.role !== 'Cashier' && (
          <div className="stat">
            <div className="lbl">
              <TrendingUp className="ico" /> Sales Today
            </div>
            <div className="val">{formatCurrency(totalSalesToday)}</div>
            <div className="meta">{formatCurrency(weekTotal)} this week</div>
          </div>
        )}

        <div className="stat">
          <div className="lbl">
            <Users className="ico" /> Customers
          </div>
          <div className="val">{customerCount}</div>
          <div className="meta">
            {stats?.lowStockItemCount || 0} low-stock item
            {(stats?.lowStockItemCount || 0) === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Grid: 7-Day Chart (Owner only) & Low Stock */}
      <div className={user?.role === 'Cashier' ? 'grid-1' : 'grid-2'}>
        {user?.role !== 'Cashier' && (
          <div className="card">
            <h3>Sales · last 7 days</h3>
            <div className="bars">
              {salesDays.map((d, i) => {
                const isToday = i === salesDays.length - 1;
                const heightPct = Math.max(6, ((d.sales || 0) / maxSale) * 100);
                return (
                  <div
                    key={d.date || i}
                    className={`bar ${isToday ? 'today' : ''}`}
                    title={`${d.displayDate}: ${formatCurrency(d.sales || 0)}`}
                  >
                    <i
                      style={{
                        height: `${heightPct}%`,
                        animationDelay: `${i * 60}ms`
                      }}
                    />
                    <span>{isToday ? 'Today' : d.displayDate?.split(' ')[0] || d.displayDate}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card">
          <h3>
            Low stock alerts{' '}
            {lowStockItems.length > 0 && (
              <Link className="badge warn" to="/inventory">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}
              </Link>
            )}
          </h3>

          {lowStockItems.length > 0 ? (
            <div className="list">
              {lowStockItems.slice(0, 5).map((p) => (
                <Link
                  key={p._id}
                  className="li"
                  to="/inventory"
                >
                  <div className="grow">
                    <b>{p.name}</b>
                    <small>SKU: {p.sku}</small>
                  </div>
                  <span className="badge warn">
                    <AlertTriangle className="w-3.5 h-3.5" /> {p.stockQuantity} left
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="em-ico">
                <CheckCircle2 className="w-6 h-6 text-[var(--ok)]" />
              </div>
              <b>No low stock items</b>
              Everything is well stocked.
            </div>
          )}
        </div>
      </div>

      {/* Top Debtors List Card */}
      <div className="card mt-4">
        <h3>
          Top debtors{' '}
          {topDebtors.length > 0 && (
            <Link className="btn-ghost btn btn-sm" to="/customers">
              View all
            </Link>
          )}
        </h3>

        {topDebtors.length > 0 ? (
          <div className="list">
            {topDebtors.map((x, i) => (
              <Link
                key={x._id}
                className="li"
                to={`/customers/${x._id}`}
              >
                <div className="rank">{i + 1}</div>
                <div
                  className="av"
                  style={{
                    background: colorFor(x.name),
                    width: '38px',
                    height: '38px',
                    fontSize: '0.8rem',
                    borderRadius: '12px'
                  }}
                >
                  {initials(x.name)}
                </div>
                <div className="grow">
                  <b>{x.name}</b>
                  <small>{x.phone}</small>
                </div>
                <b style={{ fontFamily: 'var(--display)' }}>
                  {formatCurrency(x.totalBalance)}
                </b>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="em-ico">
              <CheckCircle2 className="w-6 h-6 text-[var(--ok)]" />
            </div>
            <b>No outstanding udhaar</b>
            Your customers are all settled up.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
