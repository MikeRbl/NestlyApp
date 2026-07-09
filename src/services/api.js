import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://127.0.0.1:8000/api';

const getToken = async () => {
  return await AsyncStorage.getItem('accessToken');
};

const getHeaders = async (isFormData = false) => {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const publicPost = async (endpoint, data) => {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
