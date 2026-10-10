import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Wallet, TrendingUp, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-slate-900 rounded-2xl animate-pulse"></div>
          <div className="h-32 bg-slate-900 rounded-2xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-900 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-slate-900 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Welcome Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Welcome, {user?.shopName || 'Shop'}
          </h2>
          <p className="text-slate-400 mt-1">Here is what is happening today.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Total Udhaar</p>
            <p className="text-3xl font-bold text-red-400 mt-2">
              Rs {stats?.totalReceivables?.toLocaleString() || 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-400/10 flex items-center justify-center text-red-400">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Sales Today</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              Rs {stats?.totalSalesToday?.toLocaleString() || 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center text-green-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {stats?.salesLast7Days && stats.salesLast7Days.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-6">Sales - Last 7 Days</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesLast7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22396f" vertical={false} />
                <XAxis dataKey="displayDate" stroke="#8b9fc6" axisLine={false} tickLine={false} />
                <YAxis stroke="#8b9fc6" axisLine={false} tickLine={false} tickFormatter={(value) => `Rs ${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1c42', borderColor: '#22396f', borderRadius: '0.5rem', color: '#fcf1d0' }}
                  itemStyle={{ color: '#4ade80' }}
                  formatter={(value) => [`Rs ${value}`, 'Sales']}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Low Stock Alerts
            </h3>
            {stats?.lowStockItemCount > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
                {stats.lowStockItemCount} Items
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-80 pr-2">
            {!stats?.lowStockItems || stats.lowStockItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
                <p className="text-slate-400 font-medium">No low stock items</p>
                <p className="text-slate-500 text-sm mt-1">Your inventory is looking good!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {stats.lowStockItems.map(item => (
                  <li key={item._id} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-slate-400 text-xs">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-bold">{item.stockQuantity} left</p>
                      <p className="text-slate-500 text-xs">Min: {item.lowStockThreshold}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-800">
            <Link to="/inventory" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center justify-center w-full transition-colors">
              Manage Inventory →
            </Link>
          </div>
        </div>

        {/* Top Debtors */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Top Debtors
          </h3>
          
          <div className="flex-1 overflow-y-auto max-h-80 pr-2">
            {!stats?.topDebtors || stats.topDebtors.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
                <p className="text-slate-400 font-medium">No outstanding udhaar</p>
                <p className="text-slate-500 text-sm mt-1">All customers have cleared their dues.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {stats.topDebtors.map(customer => (
                  <li key={customer._id} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                    <div>
                      <p className="text-white font-medium">{customer.name}</p>
                      <p className="text-slate-400 text-xs">{customer.phone}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-red-400 font-bold">Rs {customer.totalBalance.toLocaleString()}</p>
                      <Link 
                        to={`/customers/${customer._id}`}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-medium px-2 py-1 bg-indigo-500/10 rounded-lg transition-colors"
                      >
                        View Khata
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-800">
            <Link to="/customers" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center justify-center w-full transition-colors">
              View All Customers →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
