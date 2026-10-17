import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from local storage or fetch from /api/auth/me
    const restoreUser = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Sync with /me to ensure token is still valid and fetch latest role
          const response = await api.get('/auth/me');
          const updatedUser = {
            ...response.data.user,
            role: response.data.user?.role || parsedUser?.role || 'Cashier'
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
          console.error('Failed to restore user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    restoreUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: newUser, role } = response.data;
      const userWithRole = { ...newUser, role: newUser?.role || role || 'Cashier' };
      
      setToken(newToken);
      setUser(userWithRole);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userWithRole));
      
      return { success: true, role: userWithRole.role };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token: newToken, user: newUser, role } = response.data;
      const userWithRole = { ...newUser, role: newUser?.role || role || 'Owner' };
      
      setToken(newToken);
      setUser(userWithRole);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userWithRole));
      
      return { success: true, role: userWithRole.role };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  };

  const registerCashier = async (cashierData) => {
    try {
      const response = await api.post('/auth/register-cashier', cashierData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isOwner = user?.role === 'Owner';
  const isCashier = user?.role === 'Cashier';

  const value = {
    user,
    token,
    role: user?.role || 'Cashier',
    isOwner,
    isCashier,
    loading,
    login,
    register,
    registerCashier,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
