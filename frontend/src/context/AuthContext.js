// frontend/src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('bukCurrentUser');
    const token = localStorage.getItem('accessToken');
    if (storedUser && token) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('bukCurrentUser');
      }
    }
    setIsLoadingAuth(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    const { access, refresh, user } = response.data;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    const userData = user || response.data;
    localStorage.setItem('bukCurrentUser', JSON.stringify(userData));
    setCurrentUser(userData);
    return userData;
  };

  const logout = () => {
    // Best-effort server-side revocation: blacklists the refresh token so it
    // can never mint new access tokens, even if a copy of it still exists.
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) {
      api.post('/auth/logout/', { refresh }).catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('bukCurrentUser');
    setCurrentUser(null);
  };

  const updateUser = (updatedData) => {
    const merged = { ...currentUser, ...updatedData };
    setCurrentUser(merged);
    localStorage.setItem('bukCurrentUser', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoadingAuth, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
