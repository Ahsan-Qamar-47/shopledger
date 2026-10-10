import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Package, LogOut } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Khata', path: '/customers', icon: Users },
    { name: 'Inventory', path: '/inventory', icon: Package },
  ];

  return (
    <div className="flex h-dvh bg-slate-950 text-slate-100 flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/30">
            {user?.shopName?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">{user?.shopName || 'ShopLedger'}</h1>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar for Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
              {user?.shopName?.charAt(0).toUpperCase() || 'S'}
            </div>
            <h1 className="text-lg font-bold text-white">{user?.shopName || 'ShopLedger'}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-400 hover:text-white"
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-8 max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </div>

        {/* Bottom Navigation for Mobile */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex items-center justify-around pb-safe z-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-3 px-2 w-full transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-400'
                  }`
                }
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </main>
    </div>
  );
};

export default Layout;
