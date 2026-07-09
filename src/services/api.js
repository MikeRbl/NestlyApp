import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { MOCK_AUTH, MOCK_USER, MOCK_TOKEN } from '../config/mock';

const API_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';

const api = axios.create({
  baseURL: `http://${API_HOST}:8000/api`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error);
  },
);

export default api;

const API_URL = `http://${API_HOST}:8000/api`;

const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

const getHeaders = async (isFormData = false) => {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json', // ✅ ADDED: Forces Laravel to return JSON errors
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

function mockMatch(endpoint) {
  // ... (keep your existing mockMatch function exactly as is)
  if (MOCK_AUTH) {
    if (endpoint === 'login') return { user: MOCK_USER, access_token: MOCK_TOKEN };
    if (endpoint === 'register') return { user: MOCK_USER };
    if (endpoint === 'user') return { user: MOCK_USER };
    if (endpoint.startsWith('users/') && endpoint.includes('/propiedades')) return { data: [] };
    if (endpoint === 'user/avatar') return { avatar_url: null };
    if (endpoint === 'role-requests') return { message: 'Solicitud enviada' };
  }
  return null;
}

export const publicPost = async (endpoint, data) => {
  const mock = mockMatch(endpoint);
  if (mock) return mock;
  
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json', // ✅ ADDED: Crucial for public routes like /register
    },
    body: JSON.stringify(data),
  });
  
  const json = await response.json();
  if (!response.ok) {
    const error = new Error(json.message || 'Error en la solicitud');
    error.status = response.status;
    error.error = json;
    throw error;
  }
  return json;
};

export const serviceGet = async (endpoint) => {
  const mock = mockMatch(endpoint);
  if (mock) return mock;
  const headers = await getHeaders();
  const response = await fetch(`${API_URL}/${endpoint}`, { method: 'GET', headers });
  const json = await response.json();
  if (!response.ok) {
    const error = new Error(json.message || 'Error en la solicitud');
    error.status = response.status;
    error.error = json;
    throw error;
  }
  return json;
};

export const servicePost = async (endpoint, data) => {
  const mock = mockMatch(endpoint);
  if (mock) return mock;
  const isFormData = data instanceof FormData;
  const headers = await getHeaders(isFormData);
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) {
    const error = new Error(json.message || 'Error en la solicitud');
    error.status = response.status;
    error.error = json;
    throw error;
  }
  return json;
};

export const servicePut = async (endpoint, data) => {
  const mock = mockMatch(endpoint);
  if (mock) return mock;
  const headers = await getHeaders();
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) {
    const error = new Error(json.message || 'Error en la solicitud');
    error.status = response.status;
    error.error = json;
    throw error;
  }
  return json;
};

export const serviceDelete = async (endpoint, id) => {
  if (MOCK_AUTH) return { message: 'Eliminado' };
  const headers = await getHeaders();
  const url = id ? `${API_URL}/${endpoint}/${id}` : `${API_URL}/${endpoint}`;
  const response = await fetch(url, { method: 'DELETE', headers });
  const json = await response.json();
  if (!response.ok) {
    const error = new Error(json.message || 'Error en la solicitud');
    error.status = response.status;
    error.error = json;
    throw error;
  }
  return json;
};