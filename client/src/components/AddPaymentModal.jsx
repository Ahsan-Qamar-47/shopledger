import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { formatCurrency } from '../utils/formatters';

const AddPaymentModal = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  currentBalance = 0,
  onPaymentAdded
}) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNotes('');
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage('Please enter an amount greater than zero.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/transactions/payment', {
        customerId,
        amount: numericAmount,
        notes: notes.trim()
      });
      toast.success(`Payment of ${formatCurrency(numericAmount)} recorded`);
      onPaymentAdded();
      onClose();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleFillFullBalance = () => {
    if (currentBalance > 0) {
      setAmount(String(currentBalance));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Customer Payment"
      subtitle={
        customerName
          ? `${customerName} · currently owes ${formatCurrency(Math.max(0, currentBalance))}`
          : 'Record cash or online payment received'
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Amount received (Rs.)</span>
          <input
            className="input"
            type="number"
            min="1"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        {currentBalance > 0 && (
          <button
            type="button"
            className="btn btn-ghost !p-0 !h-auto text-sm mb-3 block text-left"
            onClick={handleFillFullBalance}
          >
            Fill full balance ({formatCurrency(currentBalance)})
          </button>
        )}

        <label className="field">
          <span>Notes (optional)</span>
          <input
            className="input"
            placeholder="e.g. Partial cash payment, Easypaisa, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {errorMessage && <p className="err">{errorMessage}</p>}

        <div className="btns">
          <Button type="button" variant="soft" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Save Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPaymentModal;
