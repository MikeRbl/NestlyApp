import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { MOCK_AUTH, MOCK_USER, MOCK_TOKEN } from '../config/mock';
import { getIdsFavoritos, agregarFavorito, quitarFavorito } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favoritosIds, setFavoritosIds] = useState([]);
  const [loadingFavoritos, setLoadingFavoritos] = useState(false);

  const loadFavoritos = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFavoritos(true);
    try {
      const response = await getIdsFavoritos();
      const ids = response.data || [];
      setFavoritosIds(ids);
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
      setFavoritosIds([]);
    } finally {
      setLoadingFavoritos(false);
    }
  }, [user?.id]);

  const toggleFavorito = async (propiedadId) => {
    const isCurrentlyFav = favoritosIds.includes(propiedadId);
    const newFavoritos = isCurrentlyFav
      ? favoritosIds.filter((id) => id !== propiedadId)
      : [...favoritosIds, propiedadId];

    setFavoritosIds(newFavoritos);

    try {
      if (isCurrentlyFav) {
        await quitarFavorito(propiedadId);
      } else {
        await agregarFavorito(propiedadId);
      }
    } catch (err) {
      setFavoritosIds(favoritosIds);
      console.error('Error al actualizar favorito:', err);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      if (MOCK_AUTH) {
        setUser(MOCK_USER);
        setIsLoading(false);
        return;
      }
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadFavoritos();
    }
  }, [user?.id]);

  const loadUser = async () => {
    if (MOCK_AUTH) {
      setUser(MOCK_USER);
      return;
    }
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined') {
        setUser(JSON.parse(storedUser));
      }
    } catch {
    }
  };

  const continueAsGuest = async () => {
    await AsyncStorage.multiRemove(['token', 'accessToken', 'user']);
    setUser({ role: 'guest' });
  };

  const login = async (userDataOrEmail, tokenOrPassword) => {
    if (MOCK_AUTH) {
      setUser(MOCK_USER);
      return { access_token: MOCK_TOKEN, user: MOCK_USER };
    }
    if (typeof userDataOrEmail === 'object' && userDataOrEmail !== null) {
      await AsyncStorage.setItem('token', tokenOrPassword);
      await AsyncStorage.setItem('user', JSON.stringify(userDataOrEmail));
      setUser(userDataOrEmail);
      return { access_token: tokenOrPassword, user: userDataOrEmail };
    }
    const response = await api.post('/login', { email: userDataOrEmail, password: tokenOrPassword });
    const { access_token, user: userData } = response.data;
    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return response.data;
  };

  const register = async (formData) => {
    if (MOCK_AUTH) {
      return { user: MOCK_USER };
    }
    const response = await api.post('/register', formData);
    return response.data;
  };

  const logout = async () => {
    if (MOCK_AUTH) {
      setUser(null);
      return;
    }
    try {
      await api.post('/logout');
    } catch {
    }
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loadUser,
        login,
        register,
        logout,
        continueAsGuest,
        favoritosIds,
        loadingFavoritos,
        toggleFavorito,
        loadFavoritos,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
}
