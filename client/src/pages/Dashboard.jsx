import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Wallet, TrendingUp, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, colorFor, initials } from '../utils/formatters';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, custRes] = await Promise.all([
          api.get('/dashboard/stats'),
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
  }, []);

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

  return (
    <div className="view">
      {/* Welcome Header */}
      <div className="page-head">
        <div>
          <p>{greet}</p>
          <h1>Welcome, {shopName}</h1>
        </div>
      </div>

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

        <div className="stat">
          <div className="lbl">
            <TrendingUp className="ico" /> Sales Today
          </div>
          <div className="val">{formatCurrency(totalSalesToday)}</div>
          <div className="meta">{formatCurrency(weekTotal)} this week</div>
        </div>

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

      {/* 2-Column Grid: 7-Day Chart & Low Stock */}
      <div className="grid-2">
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
