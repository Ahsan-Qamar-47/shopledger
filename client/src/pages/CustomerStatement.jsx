import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { getWhatsAppLink } from '../utils/phone';
import { AlertTriangle, FileText, ArrowLeft, CreditCard, MessageCircle, FileDown } from 'lucide-react';

import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import AddSaleModal from '../components/AddSaleModal';
import AddPaymentModal from '../components/AddPaymentModal';

const CustomerStatement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchStatement(1);
  }, [id]);

  const fetchStatement = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await api.get(`/transactions/customer/${id}`, {
        params: { page: pageNum, limit: 10 }
      });
      
      if (pageNum === 1) {
        setCustomer(response.data.data.customer);
        setTransactions(response.data.data.transactions || []);
      } else {
        setTransactions(prev => [...prev, ...(response.data.data.transactions || [])]);
      }

      const pagination = response.data.data.pagination;
      setHasMore(pagination.page < pagination.pages);
      setPage(pagination.page);

    } catch (error) {
      toast.error('Failed to load statement');
      if (error.message === 'Customer not found or inactive') {
        navigate('/customers');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchStatement(page + 1);
    }
  };

  const handleWhatsAppReminder = () => {
    if (!customer) return;
    const balance = customer.totalBalance;
    if (balance <= 0) {
      toast('Customer has no pending dues.', { icon: <MessageCircle className="w-4 h-4 text-emerald-400" /> });
      return;
    }
    const message = `Hello ${customer.name},\nThis is a friendly reminder from ShopLedger regarding your pending khata balance of Rs. ${balance.toLocaleString()}.\nPlease arrange for payment at your earliest convenience.\nThank you!`;
    const link = getWhatsAppLink(customer.phone, message);
    window.open(link, '_blank');
  };

  const handleDownloadPDF = () => {
    // Basic fallback for now - can be expanded later with jsPDF
    window.print();
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (!customer) {
    return (
      <EmptyState 
        icon={<AlertTriangle />}
        title="Customer Not Found"
        description="The customer you are looking for does not exist or has been deleted."
        actionLabel="Back to Customers"
        onAction={() => navigate('/customers')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/customers')}
              className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{customer.name}</h2>
              <p className="text-sm text-slate-400">{customer.phone}</p>
            </div>
          </div>
          
          <div className="text-left md:text-right bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Balance</p>
            <div className={`text-2xl font-bold ${customer.totalBalance > 0 ? 'text-emerald-400' : customer.totalBalance < 0 ? 'text-red-400' : 'text-slate-300'}`}>
              Rs. {Math.abs(customer.totalBalance).toLocaleString()}
              <span className="text-sm font-medium ml-2">
                {customer.totalBalance > 0 ? 'Adv' : customer.totalBalance < 0 ? 'Due' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
          <Button variant="primary" onClick={() => setIsSaleModalOpen(true)}>
            + Add Sale
          </Button>
          <Button variant="secondary" onClick={() => setIsPaymentModalOpen(true)} className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Add Payment
          </Button>
          <Button variant="ghost" onClick={handleWhatsAppReminder} className="!text-emerald-400 hover:!bg-emerald-400/10 border border-emerald-400/20 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp Reminder
          </Button>
          <Button variant="ghost" onClick={handleDownloadPDF} className="!text-indigo-400 hover:!bg-indigo-400/10 border border-indigo-400/20 md:ml-auto flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Print PDF
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <h3 className="text-lg font-bold text-white px-1">Transaction History</h3>
      
      {transactions.length === 0 ? (
        <EmptyState 
          icon={<FileText />}
          title="No transactions yet"
          description="Click Add Sale to begin tracking history."
          actionLabel="Add Sale"
          onAction={() => setIsSaleModalOpen(true)}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm print:border-none print:shadow-none print:bg-white print:text-black">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800 print:bg-slate-100 print:text-slate-600 print:border-slate-300">
                  <th className="p-4">Date</th>
                  <th className="p-4">Details</th>
                  <th className="p-4 text-right">Amount (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 print:divide-slate-200">
                {transactions.map((tx) => {
                  const date = new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const isSale = tx.type === 'SALE';
                  
                  return (
                    <tr key={tx._id} className="hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                      <td className="p-4 align-top whitespace-nowrap">
                        <div className="font-medium text-slate-300 print:text-black">{date}</div>
                        <div className={`text-xs font-bold mt-1 ${isSale ? 'text-indigo-400' : 'text-emerald-400'}`}>
                          {isSale ? 'SALE' : 'PAYMENT'}
                        </div>
                      </td>
                      <td className="p-4">
                        {isSale && tx.items && tx.items.length > 0 && (
                          <div className="space-y-1 mb-2">
                            {tx.items.map((item, idx) => (
                              <div key={idx} className="text-sm text-slate-200 print:text-black flex items-center">
                                <span className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs mr-2 text-slate-400 print:border print:bg-transparent">{item.quantity}x</span>
                                {item.name}
                              </div>
                            ))}
                          </div>
                        )}
                        {tx.notes && (
                          <div className="text-xs text-slate-400 italic bg-slate-800/30 p-2 rounded-lg border border-slate-700/50 print:bg-transparent print:border-none print:p-0">
                            "{tx.notes}"
                          </div>
                        )}
                        {!tx.notes && tx.type === 'PAYMENT' && (
                          <div className="text-sm text-slate-400">Cash Received</div>
                        )}
                      </td>
                      <td className="p-4 text-right align-top">
                        <div className={`font-bold ${isSale ? 'text-red-400' : 'text-emerald-400'} print:text-black`}>
                          {isSale ? '+' : '-'}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 print:text-slate-500">
                          Bal: {tx.balanceAfter != null ? tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {hasMore && (
            <div className="p-4 border-t border-slate-800 flex justify-center bg-slate-900/50 print:hidden">
              <Button 
                variant="secondary" 
                onClick={handleLoadMore} 
                isLoading={loadingMore}
                className="w-full sm:w-auto"
              >
                Load More Transactions
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddSaleModal 
        isOpen={isSaleModalOpen} 
        onClose={() => setIsSaleModalOpen(false)}
        customerId={id}
        onSaleAdded={() => fetchStatement(1)}
      />
      
      <AddPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        customerId={id}
        onPaymentAdded={() => fetchStatement(1)}
      />
    </div>
  );
};

export default CustomerStatement;
