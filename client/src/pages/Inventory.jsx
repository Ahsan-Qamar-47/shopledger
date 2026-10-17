import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { Search, Plus, Edit2, Trash2, AlertTriangle, Package } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency } from '../utils/formatters';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

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
    lowStockThreshold: '10'
  });
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, filterLowStock]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', {
        params: {
          search: debouncedSearch,
          lowStock: filterLowStock ? 'true' : undefined,
          limit: 1000
        }
      });
      setProducts(response.data.data || []);
    } catch (_error) {
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
      price: String(product.price),
      costPrice: product.costPrice ? String(product.costPrice) : '',
      stockQuantity: String(product.stockQuantity),
      lowStockThreshold: String(product.lowStockThreshold || 10)
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

    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error('Product name and SKU are required');
      return;
    }

    const price = parseFloat(formData.price);
    const stockQuantity = parseInt(formData.stockQuantity, 10);
    const lowStockThreshold = parseInt(formData.lowStockThreshold, 10) || 10;
    const costPrice = formData.costPrice ? parseFloat(formData.costPrice) : 0;

    if (isNaN(price) || price < 0) {
      toast.error('Enter a valid price');
      return;
    }

    if (isNaN(stockQuantity) || stockQuantity < 0) {
      toast.error('Enter a valid stock quantity');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        price,
        costPrice,
        stockQuantity,
        lowStockThreshold
      };

      if (modalMode === 'add') {
        await api.post('/products', payload);
        toast.success('Product added to inventory');
      } else {
        await api.put(`/products/${selectedProduct._id}`, payload);
        toast.success('Product updated');
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
      toast.success('Product removed');
      setIsDeleteOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const lowStockCount = products.filter(
    (p) => p.stockQuantity <= (p.lowStockThreshold || 5)
  ).length;

  return (
    <div className="view">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Manage Inventory</h1>
          <p>
            {products.length} product{products.length === 1 ? '' : 's'} ·{' '}
            {lowStockCount} low on stock
          </p>
        </div>
        <Button onClick={openAddModal} className="add-btn">
          <Plus className="ico" />
          <span className="hide-sm">Add Product</span>
        </Button>
      </div>

      {/* Search Bar & Low-stock filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="searchbox flex-1">
          <Search className="ico" />
          <input
            className="input"
            placeholder="Search by Name or SKU…"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          className={`btn ${filterLowStock ? 'btn-primary' : 'btn-soft'}`}
          onClick={() => setFilterLowStock(!filterLowStock)}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Low stock only</span>
        </button>
      </div>

      {/* Product List / Cards */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? 'No products found' : 'No products yet'}
          description={
            search
              ? 'Try searching with a different product name or SKU.'
              : 'Add your first item to stock your inventory.'
          }
          actionLabel={search ? '' : '+ Add Product'}
          onAction={search ? undefined : openAddModal}
        />
      ) : (
        <div className="cards">
          {products.map((p) => {
            const threshold = p.lowStockThreshold || 5;
            const isLow = p.stockQuantity <= threshold;
            const maxCap = Math.max(threshold * 3, 30);
            const pct = Math.min(100, (p.stockQuantity / maxCap) * 100);

            return (
              <div
                key={p._id}
                className={`ccard pcard ${isLow ? 'low' : ''}`}
              >
                <div className="top">
                  <div>
                    <b>{p.name}</b>
                    <small>SKU: {p.sku}</small>
                  </div>
                  {isLow ? (
                    <span className="badge warn">
                      <AlertTriangle className="w-3.5 h-3.5" /> Low
                    </span>
                  ) : (
                    <span className="badge ok">In stock</span>
                  )}
                </div>

                <div className="pmeta">
                  <div>
                    <small>Price</small>
                    <strong>{formatCurrency(p.price)}</strong>
                  </div>
                  <div>
                    <small>Stock</small>
                    <strong style={{ color: isLow ? 'var(--warn)' : 'inherit' }}>
                      {p.stockQuantity}
                    </strong>
                    <div className="stockbar">
                      <i style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="acts">
                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    onClick={() => openEditModal(p)}
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-soft btn-sm !text-[var(--danger)] hover:!bg-[var(--danger-bg)]"
                    onClick={() => openDeleteConfirm(p)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={modalMode === 'add' ? 'New Product' : 'Edit Product'}
        subtitle={
          modalMode === 'add'
            ? 'Add an item to your inventory.'
            : 'Update details and stock quantity.'
        }
      >
        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Product name"
            id="name"
            placeholder="e.g. Cooking Oil 5L"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="SKU"
            id="sku"
            placeholder="e.g. OIL-02"
            value={formData.sku}
            onChange={(e) =>
              setFormData({ ...formData, sku: e.target.value.toUpperCase() })
            }
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Selling Price (Rs.)"
              id="price"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="500"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
            />

            <Input
              label="Current Stock"
              id="stockQuantity"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="20"
              value={formData.stockQuantity}
              onChange={(e) =>
                setFormData({ ...formData, stockQuantity: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cost Price (optional)"
              id="costPrice"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="420"
              value={formData.costPrice}
              onChange={(e) =>
                setFormData({ ...formData, costPrice: e.target.value })
              }
            />

            <Input
              label="Low Stock Alert Min"
              id="lowStockThreshold"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="10"
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lowStockThreshold: e.target.value
                })
              }
            />
          </div>

          <div className="btns">
            <Button
              type="button"
              variant="soft"
              onClick={handleModalClose}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={formLoading}>
              {modalMode === 'add' ? 'Add Product' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete product?"
        message={`“${productToDelete?.name}” will be permanently removed from your inventory.`}
        confirmText="Delete"
        isDanger={true}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Inventory;
