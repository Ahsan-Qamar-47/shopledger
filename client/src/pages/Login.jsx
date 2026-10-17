import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { BookOpen, Sun, Moon } from 'lucide-react';
import Button from '../components/ui/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } else {
      setErrorMessage(result.message || 'Invalid email or password');
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

          <h1>Welcome back</h1>
          <p className="sub">Log in to manage your khata and inventory.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>Email address</span>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <div className="pw">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              Login
            </Button>
          </form>

          <p className="auth-switch">
            <span>Don't have an account? </span>
            <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;
