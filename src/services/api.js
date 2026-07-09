import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { MOCK_AUTH, MOCK_USER, MOCK_TOKEN } from '../config/mock';


export const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000'
  : 'http://127.0.0.1:8000';


export const MEDIA_URL = BASE_URL;


const API_URL = `${BASE_URL}/api`;


// ===============================
// HEADERS
// ===============================

const getToken = async () => {
  return await AsyncStorage.getItem('token');
};


const getHeaders = async (isFormData = false) => {
  const token = await getToken();

  const headers = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};


// ===============================
// AXIOS (si algún componente lo usa)
// ===============================

import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
});


api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


api.interceptors.response.use(
  response => response,
  async error => {

    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove([
        'token',
        'user'
      ]);
    }

    return Promise.reject(error);
  }
);


export default api;


// ===============================
// MOCK
// ===============================

function mockMatch(endpoint) {

  if (!MOCK_AUTH) return null;


  if (endpoint === 'login') {
    return {
      user: MOCK_USER,
      access_token: MOCK_TOKEN
    };
  }


  if (endpoint === 'register') {
    return {
      user: MOCK_USER
    };
  }


  if (endpoint === 'user') {
    return {
      user: MOCK_USER
    };
  }


  if (
    endpoint.startsWith('users/') &&
    endpoint.includes('/propiedades')
  ) {
    return {
      data: []
    };
  }


  if (endpoint === 'user/avatar') {
    return {
      avatar_url: null
    };
  }


  if (endpoint === 'role-requests') {
    return {
      message: 'Solicitud enviada'
    };
  }


  return null;
}



// ===============================
// REQUESTS GENERALES
// ===============================


export const publicPost = async (endpoint, data) => {

  const mock = mockMatch(endpoint);

  if (mock) return mock;


  const response = await fetch(
    `${API_URL}/${endpoint}`,
    {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        Accept:'application/json'
      },
      body:JSON.stringify(data)
    }
  );


  const json = await response.json();


  if(!response.ok){

    const error = new Error(
      json.message || 'Error en la solicitud'
    );

    error.status = response.status;
    error.error = json;

    throw error;
  }


  return json;
};



export const serviceGet = async(endpoint)=>{

  const mock = mockMatch(endpoint);

  if(mock) return mock;


  const headers = await getHeaders();


  const response = await fetch(
    `${API_URL}/${endpoint}`,
    {
      method:'GET',
      headers
    }
  );


  const json = await response.json();


  if(!response.ok){

    const error = new Error(
      json.message || 'Error en la solicitud'
    );

    error.status=response.status;
    error.error=json;

    throw error;
  }


  return json;
};





export const servicePost = async(endpoint,data)=>{


  const mock = mockMatch(endpoint);

  if(mock) return mock;


  const isFormData = data instanceof FormData;


  const headers = await getHeaders(isFormData);



  const response = await fetch(
    `${API_URL}/${endpoint}`,
    {
      method:'POST',
      headers,
      body:isFormData
        ? data
        : JSON.stringify(data)
    }
  );


  const json = await response.json();


  if(!response.ok){

    const error = new Error(
      json.message || 'Error en la solicitud'
    );

    error.status=response.status;
    error.error=json;

    throw error;
  }


  return json;
};





export const servicePut = async(endpoint,data)=>{


  const headers = await getHeaders();


  const response = await fetch(
    `${API_URL}/${endpoint}`,
    {
      method:'PUT',
      headers,
      body:JSON.stringify(data)
    }
  );


  const json = await response.json();


  if(!response.ok){

    const error = new Error(
      json.message || 'Error en la solicitud'
    );

    error.status=response.status;
    error.error=json;

    throw error;
  }


  return json;

};





export const serviceDelete = async(endpoint,id)=>{


  const headers = await getHeaders();


  const url = id
    ? `${API_URL}/${endpoint}/${id}`
    : `${API_URL}/${endpoint}`;


  const response = await fetch(
    url,
    {
      method:'DELETE',
      headers
    }
  );


  const json = await response.json();


  if(!response.ok){

    const error = new Error(
      json.message || 'Error en la solicitud'
    );

    error.status=response.status;
    error.error=json;

    throw error;
  }


  return json;
};




// ===============================
// PROPIEDADES
// ===============================


export async function getTiposDePropiedad(){

  const response = await fetch(
    `${API_URL}/tipos-propiedad`
  );


  if(!response.ok){
    throw new Error(
      'Error al cargar tipos de propiedad'
    );
  }


  return response.json();
}




export async function getPropiedad(id){

  const headers = await getHeaders();


  const response = await fetch(
    `${API_URL}/propiedades/${id}`,
    {
      headers
    }
  );


  const json = await response.json();


  if(!response.ok){
    throw {
      status:response.status,
      message:json.message
    };
  }


  return json;
}




export async function crearPropiedad(formData){


  const headers = await getHeaders(true);


  const response = await fetch(
    `${API_URL}/propiedades`,
    {
      method:'POST',
      headers,
      body:formData
    }
  );


  const json = await response.json();


  if(!response.ok){

    throw {
      status:response.status,
      errors:json.errors,
      message:json.message
    };

  }


  return json;
}





export async function actualizarPropiedad(id,formData){


  formData.append('_method','PUT');


  const headers = await getHeaders(true);



  const response = await fetch(
    `${API_URL}/propiedades/${id}`,
    {
      method:'POST',
      headers,
      body:formData
    }
  );


  const json = await response.json();


  if(!response.ok){

    throw {
      status:response.status,
      errors:json.errors,
      message:json.message
    };

  }


  return json;
}





export async function eliminarPropiedad(id){

  return serviceDelete(
    'propiedades',
    id
  );

}





export async function getTodasPropiedades(){

  return serviceGet(
    'propiedades'
  );

}




// ===============================
// FAVORITOS
// ===============================


export async function getFavoritos(){

  return serviceGet(
    'favoritos'
  );

}



export async function getIdsFavoritos(){

  return serviceGet(
    'favoritos/ids'
  );

}



export async function agregarFavorito(id){


  return servicePost(
    `favoritos/agregar/${id}`,
    {}
  );

}




export async function quitarFavorito(id){

  return serviceDelete(
    `favoritos/quitar`,
    id
  );

}