import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Receipt, 
  Trash2, 
  CreditCard,
  Home, 
  Zap, 
  Users, 
  Truck, 
  Package, 
  Wrench 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import AddExpenseModal, { EXPENSE_CATEGORIES } from '../components/AddExpenseModal';
import { fmt, dateFmt } from '../utils/formatters';

const categoryIconMap = {
  Rent: Home,
  Utilities: Zap,
  Salaries: Users,
  Transport: Truck,
  Supplies: Package,
  Maintenance: Wrench,
  Other: Receipt
};

const categoryColorMap = {
  Rent: '#7B5EA7',
  Utilities: '#C2570C',
  Salaries: '#1D6FB8',
  Transport: '#0B6B5D',
  Supplies: '#8A6D1F',
  Maintenance: '#B4325A',
  Other: '#68766F'
};

const Expenses = () => {
  const { isOwner } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Restrict page to Owner
  if (!isOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses?limit=100');
      setExpenses(res.data.data || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDeleteExpense = async (id, category, amount) => {
    if (!window.confirm(`Delete expense of ${fmt(amount)} (${category})? It will be removed from profit calculations.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted successfully');
      setExpenses((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExpenseAdded = (newExpense) => {
    if (newExpense) {
      setExpenses((prev) => [newExpense, ...prev]);
    } else {
      fetchExpenses();
    }
  };

  // Calculate 30-day metrics
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const last30DaysExpenses = expenses.filter(
    (e) => new Date(e.date).getTime() >= thirtyDaysAgo
  );
  const sum30Days = last30DaysExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const sumAllTime = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Filtered expenses by search query
  const filteredExpenses = expenses.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const cat = (e.category || '').toLowerCase();
    const notes = (e.notes || '').toLowerCase();
    return cat.includes(q) || notes.includes(q);
  });

  return (
    <div className="view">
      <div className="page-head flex items-center justify-between gap-4 mb-6">
        <div>
          <h1>Manage Expenses</h1>
          <p>Owner only · rent, utilities and running costs</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="ico" />
          <span className="hide-sm">Add Expense</span>
        </button>
      </div>

      {/* Summary KPI Tiles */}
      <div className="xsum">
        <div className="stat exp">
          <div className="top">
            <span className="lbl">Last 30 days</span>
            <div className="ibadge">
              <Receipt className="ico" />
            </div>
          </div>
          <div>
            <div className="val">{fmt(sum30Days)}</div>
            <div className="meta">{last30DaysExpenses.length} entries recorded</div>
          </div>
        </div>

        <div className="stat gold">
          <div className="top">
            <span className="lbl">All time</span>
            <div className="ibadge">
              <CreditCard className="ico" />
            </div>
          </div>
          <div>
            <div className="val">{fmt(sumAllTime)}</div>
            <div className="meta">{expenses.length} total entries</div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="searchbox mb-4">
        <Search className="ico" />
        <input
          className="input"
          id="expense-search"
          type="text"
          placeholder="Search by Category or Notes…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Expenses Cards List */}
      <div>
        {loading ? (
          <div className="card empty">
            <b>Loading expenses...</b>
          </div>
        ) : filteredExpenses.length > 0 ? (
          <div className="cards">
            {filteredExpenses.map((x, i) => {
              const Icon = categoryIconMap[x.category] || Receipt;
              const color = categoryColorMap[x.category] || '#68766F';
              return (
                <div
                  key={x._id || i}
                  className="ccard xcard"
                  style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                >
                  <div className="top">
                    <div
                      className="cat"
                      style={{
                        background: `color-mix(in srgb, ${color} 18%, transparent)`,
                        color: color
                      }}
                    >
                      <Icon className="ico" />
                    </div>
                    <div className="grow">
                      <b>{x.category}</b>
                      <small className="text-muted">{dateFmt(x.date)}</small>
                    </div>
                  </div>

                  <div className={`note ${x.notes ? '' : 'none'}`}>
                    {x.notes ? x.notes : 'No notes'}
                  </div>

                  <div className="foot">
                    <strong>{fmt(x.amount)}</strong>
                    <button
                      type="button"
                      className="btn btn-soft btn-sm text-danger"
                      onClick={() => handleDeleteExpense(x._id, x.category, x.amount)}
                      disabled={deletingId === x._id}
                      aria-label="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1 inline" />
                      {deletingId === x._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card empty">
            <div className="em-ico">
              <Receipt className="w-7 h-7 text-brand" />
            </div>
            <b>{searchQuery ? 'No expenses found' : 'No expenses yet'}</b>
            <p className="text-sm text-muted mt-1">
              {searchQuery
                ? 'Try a different category or note search query.'
                : 'Tap "Add Expense" to log your first business expenditure.'}
            </p>
          </div>
        )}
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExpenseAdded={handleExpenseAdded}
      />
    </div>
  );
};

export default Expenses;
