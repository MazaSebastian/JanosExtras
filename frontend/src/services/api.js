import axios from 'axios';

// En producción, usar rutas relativas (API routes de Next.js)
// En desarrollo, usar la URL del backend separado si existe
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Salones API
export const salonesAPI = {
  getAll: () => api.get('/salones'),
  getById: (id) => api.get(`/salones/${id}`),
  create: (data) => api.post('/salones', data),
};

// Eventos API
export const eventosAPI = {
  create: (data) => api.post('/eventos', data),
  getBySalonAndMonth: (salonId, year, month) =>
    api.get(`/eventos/salon/${salonId}`, { params: { year, month } }),
  getMyEventsByMonth: (year, month) =>
    api.get('/eventos/mis-eventos', { params: { year, month } }),
  getMonthlySummary: (year, month) =>
    api.get('/eventos/resumen-mensual', { params: { year, month } }),
  delete: (id) => api.delete(`/eventos/${id}`),
};

// Admin API
export const adminAPI = {
  getDashboard: (year, month) =>
    api.get('/admin/dashboard', { params: { year, month } }),
};

export default api;

