import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Package, 
  Receipt, 
  Users, 
  LogOut, 
  Sun, 
  Moon, 
  PanelLeftClose, 
  PanelLeft 
} from 'lucide-react';
import { initials } from '../utils/formatters';

const Layout = () => {
  const { user, isOwner, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Tablet & Desktop collapsible sidebar state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sl_sidebar_collapsed');
    if (saved !== null) {
      return saved === 'true';
    }
    // Default to collapsed on tablet screens (768px - 1023px) to maximize content workspace
    return typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sl_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, ownerOnly: false },
    { name: 'Khata', path: '/customers', icon: BookOpen, ownerOnly: false },
    { name: 'Inventory', path: '/inventory', icon: Package, ownerOnly: false },
    { name: 'Expenses', path: '/expenses', icon: Receipt, ownerOnly: true },
    { name: 'Cashiers', path: '/cashiers', icon: Users, ownerOnly: true },
  ];

  const navItems = allNavItems.filter((item) => !item.ownerOnly || isOwner);
  const shopName = user?.shopName || 'ShopLedger';

  return (
    <div id="app" className={isCollapsed ? 'collapsed' : ''}>
      {/* Tablet & Desktop Sidebar (Collapsible) */}
      <aside className={`sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
        <div className={`logo-box ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="logo-mark flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <b>ShopLedger</b>
                <small>Digital Khata System</small>
              </div>
            )}
          </div>
          <button
            type="button"
            className="collapse-btn icon-btn"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <nav id="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="ico" />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="side-foot">
          <div className={`shopchip ${isCollapsed ? 'justify-center !p-2' : ''}`} title={shopName}>
            <div
              className="av flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--brand), var(--brand2))'
              }}
            >
              {initials(shopName)}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <b className="truncate">{shopName}</b>
                <small>{user?.role === 'Cashier' ? 'Cashier' : 'Shop Owner'}</small>
              </div>
            )}
          </div>

          <button
            type="button"
            className={`btn btn-soft ${isCollapsed ? '!p-0 !w-10 !h-10 mx-auto' : 'btn-block'}`}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="ico" /> : <Moon className="ico" />}
            {!isCollapsed && (
              <span className="theme-lbl">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`btn btn-soft ${isCollapsed ? '!p-0 !w-10 !h-10 mx-auto !text-[var(--danger)] hover:!bg-[var(--danger-bg)]' : 'btn-block'}`}
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="ico" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content & Mobile Topbar */}
      <div className="main-wrap">
        <header className="topbar">
          <div className="logo flex items-center gap-2.5">
            <div className="logo-mark">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <b>ShopLedger</b>
              <small>Digital Khata</small>
            </div>
          </div>
          <div className="top-actions">
            <span className={`rolepill ${user?.role === 'Cashier' ? 'cashier' : ''}`}>
              {user?.role || 'Owner'}
            </span>
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

      {/* Mobile Bottom Navigation Bar (Phones only) */}
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
