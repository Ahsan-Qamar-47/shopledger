import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout & Protection
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerStatement from './pages/CustomerStatement';
import Inventory from './pages/Inventory';
import Cashiers from './pages/Cashiers';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '0.88rem',
                boxShadow: 'var(--shadow-lg)',
              }
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id" element={<CustomerStatement />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/cashiers" element={<Cashiers />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
