import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { MOCK_AUTH, MOCK_USER, MOCK_TOKEN } from '../config/mock';
import { getIdsFavoritos, agregarFavorito, quitarFavorito, serviceGet } from '../services/api';

export const AuthContext = createContext(null);

const GUEST_USER = { id: null, role: 'guest', isGuest: true };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authIntent, setAuthIntent] = useState('login');
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
    if (user?.isGuest) {
      Alert.alert(
        'Inicia sesión',
        'Inicia sesión para guardar propiedades en tus favoritos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => exitGuestMode('login') },
        ]
      );
      return;
    }

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
        } else {
          const storedGuest = await AsyncStorage.getItem('guest');
          if (storedGuest === 'true') {
            setUser({ ...GUEST_USER });
          }
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

  const updateUser = async (partial) => {
    if (!user || user.isGuest) return;
    const next = { ...user, ...partial };
    setUser(next);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(next));
    } catch {
    }
  };

  const refreshUser = async () => {
    if (!user || user.isGuest) return;
    try {
      const response = await serviceGet('user');
      if (response?.user) {
        await updateUser(response.user);
      }
    } catch (err) {
      console.error('Error al refrescar datos del usuario:', err);
    }
  };

  const continueAsGuest = async () => {
    await AsyncStorage.multiRemove(['token', 'accessToken', 'user']);
    await AsyncStorage.setItem('guest', 'true');
    setUser({ ...GUEST_USER });
  };

  const exitGuestMode = async (intent = 'login') => {
    setAuthIntent(intent);
    await AsyncStorage.removeItem('guest');
    setUser(null);
  };

  const login = async (userDataOrEmail, tokenOrPassword) => {
    if (MOCK_AUTH) {
      await AsyncStorage.removeItem('guest');
      setUser(MOCK_USER);
      return { access_token: MOCK_TOKEN, user: MOCK_USER };
    }
    if (typeof userDataOrEmail === 'object' && userDataOrEmail !== null) {
      await AsyncStorage.removeItem('guest');
      await AsyncStorage.setItem('token', tokenOrPassword);
      await AsyncStorage.setItem('user', JSON.stringify(userDataOrEmail));
      setUser(userDataOrEmail);
      return { access_token: tokenOrPassword, user: userDataOrEmail };
    }
    const response = await api.post('/login', { email: userDataOrEmail, password: tokenOrPassword });
    const { access_token, user: userData } = response.data;
    await AsyncStorage.multiRemove(['guest']);
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
    await AsyncStorage.multiRemove(['token', 'user', 'guest']);
    setFavoritosIds([]);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuest: !!user?.isGuest,
        authIntent,
        loadUser,
        updateUser,
        refreshUser,
        login,
        register,
        logout,
        continueAsGuest,
        exitGuestMode,
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
