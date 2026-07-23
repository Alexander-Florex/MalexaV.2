import axios from 'axios';

// En desarrollo apunta al backend local. En producción, si no se define
// VITE_API_URL, usa el mismo origen (deploy unificado: frontend + backend
// en el mismo proceso Node), así no hace falta configurar CORS.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');

export const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('percha_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('percha_token');
      localStorage.removeItem('percha_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);