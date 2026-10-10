import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';

const AddPaymentModal = ({ isOpen, onClose, customerId, onPaymentAdded }) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await api.post('/transactions/payment', {
        customerId,
        amount: Number(amount),
        notes
      });
      toast.success('Payment recorded successfully');
      setAmount('');
      setNotes('');
      onPaymentAdded();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Payment Amount (Rs)"
          id="amount"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="5000"
          required
        />
        <div className="space-y-1">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Cash received..."
            rows={3}
          />
        </div>
        <div className="pt-4 flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPaymentModal;
