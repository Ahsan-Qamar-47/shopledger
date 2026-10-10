import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { Package, Search, Edit2, Trash2 } from 'lucide-react';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({ 
    name: '', 
    sku: '', 
    price: '', 
    costPrice: '', 
    stockQuantity: '', 
    lowStockThreshold: '' 
  });
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', {
        params: { search: debouncedSearch }
      });
      setProducts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ 
      name: '', 
      sku: '', 
      price: '', 
      costPrice: '', 
      stockQuantity: '', 
      lowStockThreshold: '10' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({ 
      name: product.name, 
      sku: product.sku || '', 
      price: product.price, 
      costPrice: product.costPrice || '', 
      stockQuantity: product.stockQuantity, 
      lowStockThreshold: product.lowStockThreshold || 10 
    });
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (product) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.price === '' || formData.stockQuantity === '') {
      toast.error('Name, Price, and Stock are required');
      return;
    }
    
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        costPrice: formData.costPrice !== '' ? Number(formData.costPrice) : undefined,
        stockQuantity: Number(formData.stockQuantity),
        lowStockThreshold: formData.lowStockThreshold !== '' ? Number(formData.lowStockThreshold) : 10
      };

      if (modalMode === 'add') {
        await api.post('/products', payload);
        toast.success('Product added successfully');
      } else {
        await api.put(`/products/${selectedProduct._id}`, payload);
        toast.success('Product updated successfully');
      }
      handleModalClose();
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/products/${productToDelete._id}`);
      toast.success('Product deleted');
      setIsDeleteOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Inventory</h2>
          <p className="text-sm text-slate-400">Manage your products and stock levels</p>
        </div>
        <Button onClick={openAddModal}>
          + Add Product
        </Button>
      </div>

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search by name or SKU..."
          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      ) : products.length === 0 ? (
        <EmptyState 
          icon={<Package />}
          title={search ? 'No matches found' : 'No products yet'}
          description={search ? `No product matched "${search}"` : 'Add your first product to start tracking inventory'}
          actionLabel={search ? '' : 'Add Product'}
          onAction={search ? undefined : openAddModal}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-sm font-medium border-b border-slate-800">
                  <th className="p-4">Product Name</th>
                  <th className="p-4 hidden sm:table-cell">SKU</th>
                  <th className="p-4 text-right">Price (Rs)</th>
                  <th className="p-4 text-right">Stock</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {products.map((product) => {
                  const isLowStock = product.stockQuantity <= (product.lowStockThreshold || 10);
                  
                  return (
                    <tr key={product._id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-100">{product.name}</span>
                          {isLowStock && (
                            <span title="Low Stock" className="text-amber-500 flex items-center">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 sm:hidden">{product.sku || 'N/A'}</div>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-slate-400 text-sm">
                        {product.sku || '-'}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-200">
                        {product.price.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isLowStock ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          className="text-slate-400 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          onClick={() => openEditModal(product)}
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          onClick={() => openDeleteConfirm(product)}
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        title={modalMode === 'add' ? 'Add Product' : 'Edit Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Product Name" 
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Milk 1L"
            required
          />
          <Input 
            label="SKU / Barcode" 
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
            placeholder="MLK-001"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Selling Price (Rs)" 
              id="price"
              type="number"
              min="0"
              step="any"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="150"
              required
            />
            <Input 
              label="Cost Price (Optional)" 
              id="costPrice"
              type="number"
              min="0"
              step="any"
              value={formData.costPrice}
              onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
              placeholder="135"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Current Stock" 
              id="stockQuantity"
              type="number"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
              placeholder="50"
              required
            />
            <Input 
              label="Low Stock Warning At" 
              id="lowStockThreshold"
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})}
              placeholder="10"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={handleModalClose} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={formLoading}>
              {modalMode === 'add' ? 'Add Product' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete ${productToDelete?.name}? This action cannot be undone.`}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Inventory;
