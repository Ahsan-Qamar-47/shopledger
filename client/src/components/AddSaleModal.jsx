import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';

const AddSaleModal = ({ isOpen, onClose, customerId, onSaleAdded }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && products.length === 0) {
      fetchProducts();
    }
    if (!isOpen) {
      // Reset state when closed
      setItems([{ productId: '', quantity: 1 }]);
      setNotes('');
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await api.get('/products', { params: { limit: 1000 } });
      setProducts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
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

  // Calculate live total
  const calculateTotal = () => {
    let total = 0;
    items.forEach(item => {
      if (item.productId && item.quantity > 0) {
        const product = products.find(p => p._id === item.productId);
        if (product) {
          total += product.price * item.quantity;
        }
      }
    });
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const validItems = items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one valid product');
      return;
    }

    // Check stock boundaries on frontend
    for (const item of validItems) {
      const product = products.find(p => p._id === item.productId);
      if (product && item.quantity > product.stockQuantity) {
        toast.error(`Quantity for ${product.name} exceeds available stock (${product.stockQuantity})`);
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/transactions/sale', {
        customerId,
        items: validItems,
        notes
      });
      toast.success('Sale recorded successfully');
      onSaleAdded();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  const productOptions = products
    .filter(p => p.stockQuantity > 0) // Only show items in stock
    .map(p => ({
      label: `${p.name} - Rs. ${p.price} (${p.stockQuantity} in stock)`,
      value: p._id
    }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Sale">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 max-h-[50dvh] overflow-y-auto pr-2">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 relative">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors shadow-lg z-10"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              <div className="flex-1">
                <Select
                  id={`product-${index}`}
                  label={index === 0 ? "Select Product" : ""}
                  options={productOptions}
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  required
                />
              </div>
              <div className="w-full sm:w-28">
                <Input
                  id={`qty-${index}`}
                  label={index === 0 ? "Qty" : ""}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                  required
                />
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addItemRow}
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Another Item</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
          <span className="text-slate-400 font-medium">Live Total Preview</span>
          <span className="text-xl font-bold text-emerald-400">Rs. {calculateTotal().toLocaleString()}</span>
        </div>

        <div className="space-y-1">
          <label htmlFor="sale-notes" className="block text-sm font-medium text-slate-300">
            Notes (Optional)
          </label>
          <textarea
            id="sale-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Any additional details..."
            rows={2}
          />
        </div>

        <div className="pt-2 flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
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
