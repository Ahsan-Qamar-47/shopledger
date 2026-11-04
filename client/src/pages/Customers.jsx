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
import { useAuth } from '../context/AuthContext';

const Customers = () => {
  const { isOwner } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'due' | 'advance' | 'settled'
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

  const fetchCustomers = React.useCallback(async () => {
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
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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

  const counts = React.useMemo(() => {
    let due = 0;
    let advance = 0;
    let settled = 0;
    let totalDue = 0;

    customers.forEach((c) => {
      if (c.totalBalance > 0) {
        due += 1;
        totalDue += c.totalBalance;
      } else if (c.totalBalance < 0) {
        advance += 1;
      } else {
        settled += 1;
      }
    });

    return {
      all: customers.length,
      due,
      advance,
      settled,
      totalDue
    };
  }, [customers]);

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      if (filterTab === 'due') return c.totalBalance > 0;
      if (filterTab === 'advance') return c.totalBalance < 0;
      if (filterTab === 'settled') return c.totalBalance === 0;
      return true;
    });
  }, [customers, filterTab]);

  return (
    <div className="view">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Manage Khata</h1>
          <p>
            {customers.length} customer{customers.length === 1 ? '' : 's'} ·{' '}
            {formatCurrency(counts.totalDue)} total due
            {filterTab !== 'all' && ` · ${filteredCustomers.length} in ${filterTab}`}
          </p>
        </div>
        <Button onClick={openAddModal} className="add-btn">
          <Plus className="ico" />
          <span className="hide-sm">Add Customer</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="searchbox mb-3">
        <Search className="ico" />
        <input
          className="input"
          placeholder="Search by Name or Phone…"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Balance Filter Tabs */}
      <div className="seg mb-5" role="tablist" aria-label="Customer balance filters">
        <button
          type="button"
          role="tab"
          aria-selected={filterTab === 'all'}
          className={filterTab === 'all' ? 'active' : ''}
          onClick={() => setFilterTab('all')}
        >
          <span>All</span>
          <span className="count-pill">{counts.all}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filterTab === 'due'}
          className={filterTab === 'due' ? 'active' : ''}
          onClick={() => setFilterTab('due')}
        >
          <span>Due</span>
          <span className="count-pill due">{counts.due}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filterTab === 'advance'}
          className={filterTab === 'advance' ? 'active' : ''}
          onClick={() => setFilterTab('advance')}
        >
          <span>Advance</span>
          <span className="count-pill adv">{counts.advance}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filterTab === 'settled'}
          className={filterTab === 'settled' ? 'active' : ''}
          onClick={() => setFilterTab('settled')}
        >
          <span>Settled</span>
          <span className="count-pill set">{counts.settled}</span>
        </button>
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
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            filterTab === 'due'
              ? 'No customers with due balance'
              : filterTab === 'advance'
              ? 'No customers with advance payments'
              : 'No settled customers'
          }
          description={
            filterTab === 'due'
              ? 'None of your customers have outstanding debt at this time.'
              : filterTab === 'advance'
              ? 'No customers currently have advance payment credits.'
              : 'No customers with zero balance were found in this view.'
          }
          actionLabel="View All Customers"
          onAction={() => setFilterTab('all')}
        />
      ) : (
        <div className="cards">
          {filteredCustomers.map((c) => {
            const hasDue = c.totalBalance > 0;
            const hasAdvance = c.totalBalance < 0;

            return (
              <div
                key={c._id}
                className="ccard custcard group cursor-pointer"
                onClick={() => navigate(`/customers/${c._id}`)}
              >
                <div className="top">
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
                    <span className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
                      {hasDue ? 'Due' : hasAdvance ? 'Advance' : 'Settled'}
                    </span>
                  </div>
                </div>

                <div className="foot">
                  <span className="view-link">
                    View Statement <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  <div className="acts" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => openEditModal(e, c)}
                      className="btn btn-soft btn-sm !h-8 !px-3 text-xs font-semibold"
                      title="Edit Customer"
                      aria-label="Edit customer"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={(e) => openDeleteConfirm(e, c)}
                        className="btn btn-soft btn-sm !h-8 !px-3 text-xs font-semibold !text-[var(--danger)] hover:!bg-[var(--danger-bg)]"
                        title="Delete Customer"
                        aria-label="Delete customer"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
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
