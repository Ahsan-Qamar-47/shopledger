import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'react-hot-toast';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
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
      toast.error('Failed to load customers');
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
    e.stopPropagation(); // prevent navigation to statement
    setModalMode('edit');
    setSelectedCustomer(customer);
    setFormData({ name: customer.name, phone: customer.phone || '', address: customer.address || '' });
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
    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone are required');
      return;
    }
    
    setFormLoading(true);
    try {
      if (modalMode === 'add') {
        await api.post('/customers', formData);
        toast.success('Customer added successfully');
      } else {
        await api.put(`/customers/${selectedCustomer._id}`, formData);
        toast.success('Customer updated successfully');
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
      toast.success('Customer deleted');
      setIsDeleteOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setDeleteLoading(false);
    }
  };

  const navigateToStatement = (id) => {
    navigate(`/customers/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Khata (Customers)</h2>
          <p className="text-sm text-slate-400">Manage your customers and track their balances</p>
        </div>
        <Button onClick={openAddModal}>
          + Add Customer
        </Button>
      </div>

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState 
          icon="👥"
          title={search ? 'No matches found' : 'No customers yet'}
          description={search ? `No customer matched "${search}"` : 'Add your first customer to start tracking khata'}
          actionLabel={search ? '' : 'Add Customer'}
          onAction={search ? undefined : openAddModal}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-sm font-medium border-b border-slate-800">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 text-right">Balance (Rs)</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {customers.map((customer) => (
                  <tr 
                    key={customer._id} 
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    onClick={() => navigateToStatement(customer._id)}
                  >
                    <td className="p-4">
                      <div className="font-semibold text-slate-100">{customer.name}</div>
                      <div className="text-xs text-slate-500 md:hidden">{customer.phone}</div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-slate-300">
                      <div>{customer.phone}</div>
                      {customer.address && <div className="text-xs text-slate-500 mt-0.5">{customer.address}</div>}
                    </td>
                    <td className="p-4 text-right">
                      <div className={`font-bold ${customer.balance > 0 ? 'text-emerald-400' : customer.balance < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                        {Math.abs(customer.balance).toLocaleString()} {customer.balance > 0 ? ' Adv' : customer.balance < 0 ? ' Due' : ''}
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        className="text-slate-400 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        onClick={(e) => openEditModal(e, customer)}
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        onClick={(e) => openDeleteConfirm(e, customer)}
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        title={modalMode === 'add' ? 'Add Customer' : 'Edit Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Full Name" 
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="John Doe"
            required
          />
          <Input 
            label="Phone Number" 
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="03001234567"
            required
          />
          <Input 
            label="Address (Optional)" 
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            placeholder="Main Market, Shop 42"
          />
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={handleModalClose} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={formLoading}>
              {modalMode === 'add' ? 'Add Customer' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customerToDelete?.name}? This action cannot be undone and will delete all their transactions.`}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Customers;
