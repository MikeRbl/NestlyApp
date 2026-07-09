import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined') {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Error al procesar usuario de AsyncStorage:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, token) => {
    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  const isLoggedIn = () => {
    return !!user;
  };

  const getUserRole = () => {
    return user ? user.role : null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isLoggedIn, getUserRole, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
