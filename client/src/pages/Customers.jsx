import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { Search, Plus, ChevronRight, Edit2, Trash2, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency, colorFor, initials } from '../utils/formatters';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const navigate = useNavigate();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers', {
        params: { search: debouncedSearch }
      });
      setCustomers(response.data.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', phone: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (e, customer) => {
    e.stopPropagation();
    setModalMode('edit');
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || ''
    });
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (e, customer) => {
    e.stopPropagation();
    setCustomerToDelete(customer);
    setIsDeleteOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Name and Phone are required');
      return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'add') {
        await api.post('/customers', formData);
        toast.success('Customer added to khata');
      } else {
        await api.put(`/customers/${selectedCustomer._id}`, formData);
        toast.success('Customer details updated');
      }
      handleModalClose();
      fetchCustomers();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/customers/${customerToDelete._id}`);
      toast.success('Customer removed from khata');
      setIsDeleteOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalOutstanding = customers.reduce(
    (sum, c) => sum + (c.totalBalance > 0 ? c.totalBalance : 0),
    0
  );

  return (
    <div className="view">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Manage Khata</h1>
          <p>
            {customers.length} customer{customers.length === 1 ? '' : 's'} ·{' '}
            {formatCurrency(totalOutstanding)} outstanding
          </p>
        </div>
        <Button onClick={openAddModal} className="add-btn">
          <Plus className="ico" />
          <span className="hide-sm">Add Customer</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="searchbox mb-5">
        <Search className="ico" />
        <input
          className="input"
          placeholder="Search by Name or Phone…"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customers List / Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No customers found' : 'No customers yet'}
          description={
            search
              ? 'Try searching with a different name or phone number.'
              : 'Add your first customer to begin tracking your digital khata.'
          }
          actionLabel={search ? '' : '+ Add Customer'}
          onAction={search ? undefined : openAddModal}
        />
      ) : (
        <div className="cards">
          {customers.map((c) => {
            const hasDue = c.totalBalance > 0;
            const hasAdvance = c.totalBalance < 0;

            return (
              <div
                key={c._id}
                className="ccard group relative cursor-pointer"
                onClick={() => navigate(`/customers/${c._id}`)}
              >
                <div
                  className="av"
                  style={{ background: colorFor(c.name) }}
                >
                  {initials(c.name)}
                </div>

                <div className="grow">
                  <b>{c.name}</b>
                  <small>{c.phone}</small>
                </div>

                <div className="bal">
                  <strong
                    style={{
                      color: hasDue
                        ? 'var(--danger)'
                        : hasAdvance
                        ? 'var(--warn)'
                        : 'var(--ok)'
                    }}
                  >
                    {hasDue
                      ? formatCurrency(c.totalBalance)
                      : hasAdvance
                      ? `${formatCurrency(Math.abs(c.totalBalance))} Adv`
                      : 'Settled'}
                  </strong>
                  <span>
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Hover Action Buttons */}
                <div
                  className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--surface)]/90 p-1 rounded-lg backdrop-blur-sm border border-[var(--line)] shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => openEditModal(e, c)}
                    className="p-1.5 text-[var(--muted)] hover:text-[var(--brand)] rounded transition-colors"
                    title="Edit Customer"
                    aria-label="Edit customer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openDeleteConfirm(e, c)}
                    className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)] rounded transition-colors"
                    title="Delete Customer"
                    aria-label="Delete customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={modalMode === 'add' ? 'New Customer' : 'Edit Customer'}
        subtitle={
          modalMode === 'add'
            ? 'Add someone to your khata.'
            : 'Update customer contact details.'
        }
      >
        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Full name"
            id="name"
            placeholder="e.g. Kamran Raza"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Phone number"
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="03XX-XXXXXXX"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />

          <Input
            label="Address (optional)"
            id="address"
            placeholder="e.g. Shop 42, Main Market"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

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
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete customer?"
        message={`"${customerToDelete?.name}" will be removed from your khata along with their transaction history.`}
        confirmText="Delete"
        isDanger={true}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Customers;
