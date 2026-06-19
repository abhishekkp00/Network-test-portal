import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and check token on load
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await api.get('/auth/me');
          setUser(userData);
        } catch (error) {
          console.error('Failed to restore session:', error.message);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  // Set logout callback on API client to clear state if 401 occurs
  useEffect(() => {
    api.setLogoutCallback(() => {
      setUser(null);
    });
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      
      // Fetch fresh profile details
      const profile = await api.get('/auth/me');
      setUser(profile);
      return profile;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, role) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/register', { username, email, password, role });
      localStorage.setItem('token', data.token);
      
      // Fetch fresh profile details
      const profile = await api.get('/auth/me');
      setUser(profile);
      return profile;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
