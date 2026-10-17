import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Info, X } from 'lucide-react';
import api from '../services/api';

const RegisterCashierModal = ({ isOpen, onClose, onCashierRegistered }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password } = formData;

    if (!name.trim()) {
      setError('Cashier name is required');
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please provide a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/register-cashier', {
        name: name.trim(),
        email: email.trim(),
        password
      });

      toast.success(response.data.message || 'Cashier registered successfully');
      setFormData({ name: '', email: '', password: '' });
      if (onCashierRegistered) {
        onCashierRegistered(response.data.data || response.data.user);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register cashier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="grab" />
        <div className="flex items-center justify-between">
          <h2 id="modal-title">Register Cashier</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="ico" />
          </button>
        </div>
        <p className="sub">
          Create a login for your cashier. Their role is set to Cashier automatically.
        </p>

        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          <label className="field">
            <span>Name</span>
            <input
              className="input"
              type="text"
              id="name"
              placeholder="e.g. Sana Iqbal"
              value={formData.name}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              id="email"
              placeholder="cashier@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="pw">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <div className="hint info">
            <Info className="ico flex-none mt-0.5" />
            <span>
              The password is stored securely hashed. Share it with your cashier directly — they log in on the normal login page.
            </span>
          </div>

          {error && <p className="err">{error}</p>}

          <div className="btns">
            <button
              type="button"
              className="btn btn-soft"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterCashierModal;
