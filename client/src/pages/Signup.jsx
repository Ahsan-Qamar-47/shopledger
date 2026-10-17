import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { BookOpen, Sun, Moon } from 'lucide-react';
import Button from '../components/ui/Button';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    shopName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const { name, shopName, email, password } = formData;

    if (!shopName.trim()) {
      setErrorMessage('Please enter your shop name.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await register({
      name: name.trim(),
      shopName: shopName.trim(),
      email: email.trim(),
      password
    });
    setLoading(false);

    if (result.success) {
      toast.success('Account created successfully');
      navigate('/dashboard');
    } else {
      setErrorMessage(result.message || 'Registration failed');
    }
  };

  return (
    <section id="auth">
      <button
        type="button"
        className="icon-btn auth-theme"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="ico" /> : <Moon className="ico" />}
      </button>

      <aside className="auth-art">
        <div className="logo">
          <div className="logo-mark">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <b>ShopLedger</b>
            <small>Digital Khata System</small>
          </div>
        </div>

        <div>
          <h2>
            Your khata, <em>finally</em> in your pocket.
          </h2>
          <p>
            Track udhaar, record payments, manage stock and remind customers on
            WhatsApp — all in one calm, beautiful place.
          </p>
        </div>

        <div className="glass">
          <small>Total Udhaar</small>
          <strong>Rs. 15,000</strong>
          <div className="row">
            <span>Ahmed Khan</span>
            <b>Rs. 5,000</b>
          </div>
          <div className="row">
            <span>Bilal Hussain</span>
            <b>Rs. 3,500</b>
          </div>
        </div>
      </aside>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="logo">
            <div className="logo-mark">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <b>ShopLedger</b>
              <small>Digital Khata System</small>
            </div>
          </div>

          <h1>Create your account</h1>
          <p className="sub">Start your digital khata in under a minute.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>Shop name</span>
              <input
                className="input"
                id="shopName"
                type="text"
                placeholder="e.g. Al-Madina General Store"
                autoComplete="organization"
                value={formData.shopName}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field">
              <span>Your name</span>
              <input
                className="input"
                id="name"
                type="text"
                placeholder="e.g. Muhammad Umair"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field">
              <span>Email address</span>
              <input
                className="input"
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <div className="pw">
                <input
                  className="input"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {errorMessage && <p className="err">{errorMessage}</p>}

            <Button
              className="btn-block mt-2"
              type="submit"
              isLoading={loading}
            >
              Create Account
            </Button>
          </form>

          <p className="auth-switch">
            <span>Already have an account? </span>
            <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Signup;
