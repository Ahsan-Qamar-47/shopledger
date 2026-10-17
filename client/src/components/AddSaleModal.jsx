import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const AddSaleModal = ({ isOpen, onClose, customerId, customerName, onSaleAdded }) => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setItems([{ productId: '', quantity: 1 }]);
      setNotes('');
      setErrorMessage('');
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', { params: { limit: 1000 } });
      setProducts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      if (item.productId && item.quantity > 0) {
        const product = products.find((p) => p._id === item.productId);
        if (product) {
          return total + (product.price || 0) * item.quantity;
        }
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const validItems = items.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage('Please select at least one item with quantity.');
      return;
    }

    for (const item of validItems) {
      const product = products.find((p) => p._id === item.productId);
      if (product && item.quantity > product.stockQuantity) {
        setErrorMessage(
          `Only ${product.stockQuantity} "${product.name}" available in stock.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/transactions/sale', {
        customerId,
        items: validItems,
        notes: notes.trim()
      });
      toast.success(`Sale of ${formatCurrency(calculateTotal())} recorded`);
      onSaleAdded();
      onClose();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Sale (Udhaar)"
      subtitle={customerName ? `For ${customerName} · inventory stock updates automatically` : 'Sales are linked to inventory'}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-2 mb-3">
          {items.map((item, index) => (
            <div className="rowitem" key={index}>
              <select
                className="select"
                value={item.productId}
                onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                required
              >
                <option value="" disabled>Select item...</option>
                {products.map((p) => (
                  <option
                    key={p._id}
                    value={p._id}
                    disabled={p.stockQuantity < 1}
                  >
                    {p.name} ({formatCurrency(p.price)})
                    {p.stockQuantity < 1 ? ' – Out of stock' : ` [${p.stockQuantity} left]`}
                  </option>
                ))}
              </select>

              <input
                className="input"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                }
                aria-label="Quantity"
              />

              {items.length > 1 ? (
                <button
                  type="button"
                  className="icon-btn text-[var(--danger)]"
                  onClick={() => removeItemRow(index)}
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-10" />
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-ghost !p-0 !h-auto text-sm mb-3 flex items-center gap-1.5"
          onClick={addItemRow}
        >
          <Plus className="w-4 h-4" /> Add Another Item
        </button>

        <div className="totalbar">
          <span>Total Amount</span>
          <strong>{formatCurrency(calculateTotal())}</strong>
        </div>

        <label className="field">
          <span>Notes (optional)</span>
          <input
            className="input"
            placeholder="e.g. Evening pickup, will clear on Friday"
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
            Save Sale
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSaleModal;
