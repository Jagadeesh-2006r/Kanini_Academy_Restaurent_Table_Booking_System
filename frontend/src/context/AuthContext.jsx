import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('savoria_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('savoria_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data.user);
          setToken(storedToken);
        } catch (err) {
          console.error('Session restoration failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: loggedInUser } = res.data.data;

    localStorage.setItem('savoria_token', receivedToken);
    localStorage.setItem('savoria_user', JSON.stringify(loggedInUser));

    setToken(receivedToken);
    setUser(loggedInUser);
    return loggedInUser;
  };

  // Register handler
  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token: receivedToken, user: registeredUser } = res.data.data;

    localStorage.setItem('savoria_token', receivedToken);
    localStorage.setItem('savoria_user', JSON.stringify(registeredUser));

    setToken(receivedToken);
    setUser(registeredUser);
    return registeredUser;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('savoria_token');
    localStorage.removeItem('savoria_user');
    setToken(null);
    setUser(null);
  };

  // Update profile
  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    const updatedUser = res.data.data.user;
    setUser(prev => ({ ...prev, ...updatedUser }));
    localStorage.setItem('savoria_user', JSON.stringify({ ...user, ...updatedUser }));
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
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
