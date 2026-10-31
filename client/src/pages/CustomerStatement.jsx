import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { getWhatsAppLink } from '../utils/phone';
import { generateStatementPdf } from '../utils/generateStatementPdf';
import {
  ArrowLeft,
  ShoppingCart,
  ArrowDown,
  MessageCircle,
  FileText,
  AlertTriangle,
  Check,
  Wrench
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import AddSaleModal from '../components/AddSaleModal';
import AddPaymentModal from '../components/AddPaymentModal';
import { formatCurrency, formatDate, initials } from '../utils/formatters';

const CustomerStatement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

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
        setTransactions((prev) => [
          ...prev,
          ...(response.data.data.transactions || [])
        ]);
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
      toast('This customer has no outstanding balance.');
      return;
    }

    const shopName = user?.shopName || user?.name || 'ShopLedger';
    const message = `Assalam-o-Alaikum ${customer.name},\n\nThis is a friendly reminder from ${shopName}. Your outstanding balance is ${formatCurrency(balance)}.\n\nPlease clear it at your earliest convenience. Thank you!`;

    const link = getWhatsAppLink(customer.phone, message);
    if (!link) {
      toast.error('Invalid or missing phone number for this customer.');
      return;
    }

    window.open(link, '_blank', 'noopener');
  };

  const handleDownloadPDF = async () => {
    if (!customer) return;

    setPdfLoading(true);
    try {
      const response = await api.get(`/transactions/customer/${id}`, {
        params: { page: 1, limit: 1000 }
      });
      const allTransactions = response.data.data.transactions || [];

      generateStatementPdf(customer, allTransactions, user);
      toast.success('Statement PDF generated');
    } catch (_error) {
      // Fallback to browser print if jsPDF has any issue
      window.print();
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="view">
        <button className="back" onClick={() => navigate('/customers')}>
          <ArrowLeft className="ico" /> Back
        </button>
        <EmptyState
          icon={<AlertTriangle />}
          title="Customer Not Found"
          description="The customer statement you are looking for does not exist or has been removed."
          actionLabel="Back to Khata"
          onAction={() => navigate('/customers')}
        />
      </div>
    );
  }

  const balance = customer.totalBalance || 0;
  const isDue = balance > 0;
  const isAdv = balance < 0;

  return (
    <div className="view">
      {/* Back button */}
      <button
        type="button"
        className="back"
        onClick={() => navigate('/customers')}
      >
        <ArrowLeft className="ico" /> Back to Khata
      </button>

      {/* Print Statement Header */}
      <div className="print-only">
        <h2 style={{ fontFamily: 'var(--display)' }}>
          ShopLedger – Customer Statement
        </h2>
        <p>
          {user?.shopName || 'ShopLedger'} · Generated {formatDate(new Date())}
        </p>
      </div>

      {/* 2-Column Statement View */}
      <div className="stmt">
        {/* Left Column: Customer Profile & Quick Actions */}
        <div className="card profile">
          <div className="head">
            <div className="who">
              <div className="av">{initials(customer.name)}</div>
              <div>
                <h2>{customer.name}</h2>
                <div className="phone">{customer.phone}</div>
                {customer.address && (
                  <div className="text-xs opacity-70 mt-0.5">{customer.address}</div>
                )}
              </div>
            </div>

            <div className="big">
              <small>
                {isDue ? 'Balance due' : isAdv ? 'Advance paid' : 'Account status'}
              </small>
              <strong>
                {balance === 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    Settled <Check className="w-6 h-6 inline text-[var(--ok)]" />
                  </span>
                ) : (
                  formatCurrency(Math.abs(balance))
                )}
              </strong>
            </div>
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsSaleModalOpen(true)}
            >
              <ShoppingCart className="ico" /> Add Sale
            </button>

            <button
              type="button"
              className="btn btn-soft"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              <ArrowDown className="ico" /> Add Payment
            </button>

            <button
              type="button"
              className="btn btn-wa"
              onClick={handleWhatsAppReminder}
            >
              <MessageCircle className="ico" /> WhatsApp
            </button>

            <button
              type="button"
              className="btn btn-soft"
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
            >
              <FileText className="ico" /> {pdfLoading ? 'Loading...' : 'PDF'}
            </button>
          </div>
        </div>

        {/* Right Column: Transaction History */}
        <div>
          <div className="page-head" style={{ marginBottom: '14px' }}>
            <h1 style={{ fontSize: '1.15rem' }}>Transaction history</h1>
            <span className="badge ok">
              {transactions.length} record{transactions.length === 1 ? '' : 's'}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="card empty">
              <div className="em-ico">
                <FileText className="w-6 h-6 text-[var(--ok)]" />
              </div>
              <b>No transactions yet</b>
              Click Add Sale to start recording transactions.
            </div>
          ) : (
            <div className="tl">
              {transactions.map((tx, i) => {
                const isSale = tx.type === 'SALE';
                const isService = isSale && tx.isInventorySale === false;
                const itemsSummary =
                  isSale && tx.items && tx.items.length > 0
                    ? tx.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')
                    : isService
                    ? 'Service revenue'
                    : '';

                return (
                  <div
                    key={tx._id || i}
                    className={`tx ${isSale ? 'sale' : 'pay'}`}
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <div className="ic">
                      {isSale ? (
                        isService ? (
                          <Wrench className="ico" />
                        ) : (
                          <ShoppingCart className="ico" />
                        )
                      ) : (
                        <ArrowDown className="ico" />
                      )}
                    </div>

                    <div className="grow">
                      <div className="t1">
                        <b>
                          {isSale
                            ? isService
                              ? 'Service (Udhaar)'
                              : 'Sale (Udhaar)'
                            : 'Payment received'}
                        </b>
                        <span className="amt">
                          {isSale ? '+' : '−'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>

                      <small>
                        {formatDate(tx.date || tx.createdAt)}
                        {itemsSummary ? ` · ${itemsSummary}` : ''}
                      </small>

                      {tx.notes && <div className="note">{tx.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="mt-5 flex justify-center no-print">
              <Button
                variant="soft"
                onClick={handleLoadMore}
                isLoading={loadingMore}
              >
                Load More Transactions
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sale Modal */}
      <AddSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        customerId={id}
        customerName={customer.name}
        onSaleAdded={() => fetchStatement(1)}
      />

      {/* Payment Modal */}
      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customerId={id}
        customerName={customer.name}
        currentBalance={balance}
        onPaymentAdded={() => fetchStatement(1)}
      />
    </div>
  );
};

export default CustomerStatement;
