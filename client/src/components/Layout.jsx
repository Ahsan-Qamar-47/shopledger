import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, BookOpen, Package, LogOut, Sun, Moon } from 'lucide-react';
import { initials } from '../utils/formatters';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Khata', path: '/customers', icon: BookOpen },
    { name: 'Inventory', path: '/inventory', icon: Package },
  ];

  const shopName = user?.shopName || 'ShopLedger';

  return (
    <div id="app">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <b>ShopLedger</b>
            <small>Digital Khata System</small>
          </div>
        </div>

        <nav id="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon className="ico" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="side-foot">
          <div className="shopchip">
            <div
              className="av"
              style={{
                background: 'linear-gradient(135deg, var(--brand), var(--brand2))'
              }}
            >
              {initials(shopName)}
            </div>
            <div className="overflow-hidden">
              <b className="truncate">{shopName}</b>
              <small>{user?.role === 'Cashier' ? 'Cashier' : 'Shop Owner'}</small>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-soft btn-block"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="ico" /> : <Moon className="ico" />}
            <span className="theme-lbl">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>

          <button
            type="button"
            className="btn btn-soft btn-block"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut className="ico" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content & Mobile Topbar */}
      <div>
        <header className="topbar">
          <div className="logo">
            <div className="logo-mark">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <b>ShopLedger</b>
              <small>Digital Khata</small>
            </div>
          </div>
          <div className="top-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="ico" /> : <Moon className="ico" />}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="ico" />
            </button>
          </div>
        </header>

        <main className="p-4 md:p-10 max-w-[1180px] mx-auto min-h-[calc(100vh-var(--nav-h))] pb-24 md:pb-14">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="bottomnav" id="bottom-nav" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon className="ico" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
