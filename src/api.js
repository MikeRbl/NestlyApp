import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://127.0.0.1:8000/api';

async function getAuthHeaders(isFormData = false) {
  const stored = await AsyncStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;
  const token = user?.accessToken || user?.token || user?.access_token || '';

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function getTiposDePropiedad() {
  const res = await fetch(`${API_URL}/tipos-propiedad`);
  if (!res.ok) {
    throw new Error('Error al cargar los tipos de propiedad');
  }
  return res.json();
}

export async function getPropiedad(id) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/propiedades/${id}`, { headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, message: error.message || 'Error al obtener la propiedad' };
  }
  return res.json();
}

export async function actualizarPropiedad(id, formData) {
  formData.append('_method', 'PUT');
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_URL}/propiedades/${id}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, errors: error.errors, message: error.message };
  }
  return res.json();
}

export async function crearPropiedad(formData) {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_URL}/propiedades`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, errors: error.errors, message: error.message };
  }
  return res.json();
}

export async function eliminarPropiedad(id) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/propiedades/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, message: error.message || 'Error al eliminar la propiedad' };
  }
  return res.json();
}

export async function getTodasPropiedades() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/propiedades`, { headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, message: error.message || 'Error al obtener propiedades' };
  }
  return res.json();
}

export async function getFavoritos() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/favoritos`, { headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, message: error.message || 'Error al obtener favoritos' };
  }
  return res.json();
}

export async function getIdsFavoritos() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/favoritos/ids`, { headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, message: error.message || 'Error al obtener IDs de favoritos' };
  }
  return res.json();
}

export async function agregarFavorito(propiedadId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/favoritos/agregar/${propiedadId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, message: error.message || 'Error al agregar favorito' };
  }
  return res.json();
}

export async function quitarFavorito(propiedadId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/favoritos/quitar/${propiedadId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, message: error.message || 'Error al quitar favorito' };
  }
  return res.json();
}
