import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, X, Users, Mail, Calendar } from 'lucide-react';
import api from '../services/api';
import RegisterCashierModal from '../components/RegisterCashierModal';
import { initials, dateFmt } from '../utils/formatters';

const Cashiers = () => {
  const { user, isOwner } = useAuth();
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cashiers tab is Owner only
  if (!isOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchCashiers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/cashiers');
      setCashiers(res.data.cashiers || []);
    } catch (err) {
      console.error('Failed to load cashiers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, []);

  const handleCashierRegistered = (newCashier) => {
    if (newCashier) {
      setCashiers((prev) => [newCashier, ...prev]);
    } else {
      fetchCashiers();
    }
  };

  return (
    <div className="view">
      <div className="page-head flex items-center justify-between gap-4 mb-6">
        <div>
          <h1>Manage Cashiers</h1>
          <p>Owner only · {cashiers.length} registered</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="ico" />
          <span className="hide-sm">Register Cashier</span>
        </button>
      </div>

      {/* Permissions Guide Card */}
      <div className="card perm mb-6">
        <div className="yes">
          <h4>Cashiers can</h4>
          <ul>
            <li>
              <Check className="ico" />
              <span>Record sales, service sales &amp; payments</span>
            </li>
            <li>
              <Check className="ico" />
              <span>View customers, balances &amp; stock levels</span>
            </li>
            <li>
              <Check className="ico" />
              <span>Send WhatsApp reminders to debtors</span>
            </li>
          </ul>
        </div>
        <div className="no">
          <h4>Cashiers can't</h4>
          <ul>
            <li>
              <X className="ico" />
              <span>See profit, expenses or product cost prices</span>
            </li>
            <li>
              <X className="ico" />
              <span>Add, edit or delete products</span>
            </li>
            <li>
              <X className="ico" />
              <span>Register or manage other cashiers</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Cashiers List */}
      <div style={{ marginTop: '16px' }}>
        {loading ? (
          <div className="card empty">
            <b>Loading cashiers...</b>
          </div>
        ) : cashiers.length > 0 ? (
          <div className="cards">
            {cashiers.map((c, i) => (
              <div
                key={c._id || c.id || i}
                className="ccard"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div
                  className="av"
                  style={{
                    background: 'linear-gradient(135deg, var(--gold), #b38b36)'
                  }}
                >
                  {initials(c.name)}
                </div>
                <div className="grow">
                  <b>{c.name}</b>
                  <small className="mail flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 inline text-muted" />
                    {c.email}
                  </small>
                  <div className="sub2">
                    <span className="badge warn">Cashier</span>
                    <small className="flex items-center gap-1 text-muted">
                      <Calendar className="w-3 h-3 inline" />
                      Added {dateFmt(c.createdAt || Date.now())}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card empty">
            <div className="em-ico">
              <Users className="w-7 h-7 text-brand" />
            </div>
            <b>No cashiers yet</b>
            <p className="text-sm text-muted mt-1">
              Tap "Register Cashier" to create your first cashier login credentials.
            </p>
          </div>
        )}
      </div>

      <RegisterCashierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCashierRegistered={handleCashierRegistered}
      />
    </div>
  );
};

export default Cashiers;
