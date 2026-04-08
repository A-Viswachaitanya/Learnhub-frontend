import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle } from '../components/Icons.jsx';
import { api, initializeDB, STORAGE_KEYS } from '../services/api';

// Create Contexts
export const AuthContext = createContext(null);
export const NotificationContext = createContext(null);
export const ThemeContext = createContext(null);

// --- Theme Provider ---
export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(localStorage.getItem(STORAGE_KEYS.THEME) === 'dark');
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) { 
      root.classList.add('dark'); 
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark'); 
    } else { 
      root.classList.remove('dark'); 
      localStorage.setItem(STORAGE_KEYS.THEME, 'light'); 
    }
  }, [isDark]);
  return <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(!isDark) }}>{children}</ThemeContext.Provider>;
};

// --- Notification Provider ---
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(t => t.id !== id)), 3000);
  };
  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map(t => (
          <div key={t.id} className={`notification notification-${t.type}`}>
            {t.type === 'success' ? <CheckCircle size={18} /> : (t.type === 'error' ? <XCircle size={18} /> : <AlertCircle size={18} />)}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// --- Auth Provider ---
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useContext(NotificationContext);

  useEffect(() => {
    initializeDB();
    const storedUser = api.getSession();
    if (storedUser) setUser(storedUser);
    setLoading(false);
  }, []);

  const login = async (email, password, recaptchaToken) => {
    try {
      const userData = await api.login(email, password, recaptchaToken);
      setUser(userData);
      addNotification(`Welcome back, ${userData.name}!`);
      return true;
    } catch (error) {
      addNotification(error.message, 'error');
      return false;
    }
  };

  const register = async (name, email, password, role) => {
    try {
      await api.register(name, email, password, role);
      addNotification('Registration successful! Please login.');
      return true;
    } catch (error) {
      addNotification(error.message, 'error');
      return false;
    }
  };

  const updateProfile = async (data) => {
    try {
      const updatedUser = await api.updateProfile(user.id, data);
      setUser(updatedUser);
      addNotification('Profile updated!');
    } catch(e) { addNotification(e.message, 'error'); }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    addNotification('Logged out successfully');
  };

  return <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>{!loading && children}</AuthContext.Provider>;
};