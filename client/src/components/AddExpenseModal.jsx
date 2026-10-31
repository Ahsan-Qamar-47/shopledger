import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Home, 
  Zap, 
  Users, 
  Truck, 
  Package, 
  Wrench, 
  Receipt 
} from 'lucide-react';
import api from '../services/api';

export const EXPENSE_CATEGORIES = [
  { name: 'Rent', icon: Home, color: '#7B5EA7' },
  { name: 'Utilities', icon: Zap, color: '#C2570C' },
  { name: 'Salaries', icon: Users, color: '#1D6FB8' },
  { name: 'Transport', icon: Truck, color: '#0B6B5D' },
  { name: 'Supplies', icon: Package, color: '#8A6D1F' },
  { name: 'Maintenance', icon: Wrench, color: '#B4325A' },
  { name: 'Other', icon: Receipt, color: '#68766F' }
];

const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded }) => {
  const todayIso = new Date().toISOString().split('T')[0];

  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter an amount greater than zero.');
      return;
    }

    if (!date) {
      setError('Please select a date.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/expenses', {
        category,
        amount: parsedAmount,
        date,
        notes: notes.trim()
      });

      toast.success(res.data.message || 'Expense recorded successfully');
      setAmount('');
      setNotes('');
      setDate(todayIso);
      setCategory('Rent');
      if (onExpenseAdded) {
        onExpenseAdded(res.data.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="grab" />
        <div className="flex items-center justify-between">
          <h2 id="modal-title">Add Expense</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="ico" />
          </button>
        </div>
        <p className="sub">
          Log a business cost — it updates Net Income instantly.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="lbl-s mb-2">Category</div>
          <div className="catgrid" role="radiogroup" aria-label="Expense Category">
            {EXPENSE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.name;
              return (
                <label key={cat.name}>
                  <input
                    type="radio"
                    name="category"
                    value={cat.name}
                    checked={isSelected}
                    onChange={() => setCategory(cat.name)}
                  />
                  <span>
                    <Icon className="ico" style={{ color: cat.color }} />
                    {cat.name}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="two">
            <label className="field">
              <span>Amount (Rs.)</span>
              <input
                className="input"
                id="amount"
                type="number"
                min="1"
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Date</span>
              <input
                className="input"
                id="date"
                type="date"
                value={date}
                max={todayIso}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
          </div>

          <label className="field">
            <span>Notes (optional)</span>
            <input
              className="input"
              type="text"
              id="notes"
              placeholder="e.g. Shop monthly rent or bill"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {error && <p className="err">{error}</p>}

          <div className="btns">
            <button
              type="button"
              className="btn btn-soft"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
