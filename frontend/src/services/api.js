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

// Interceptor para agregar token a las peticiones y manejar FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Si los datos son FormData, remover Content-Type para que axios lo establezca automáticamente
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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
  updateCoordinates: (id, data) => api.patch(`/salones/${id}`, data),
};

const requestMyEvents = (params) =>
  api.get('/eventos/mis-eventos', { params });
const requestSummary = (params) =>
  api.get('/eventos/resumen-mensual', { params });

// Eventos API
export const eventosAPI = {
  create: (data) => api.post('/eventos', data),
  getBySalon: (salonId, year, month) =>
    api.get(`/eventos/salon/${salonId}`, {
      params: { year, ...(month ? { month } : {}) },
    }),
  getMyEvents: (params = {}) => requestMyEvents(params),
  getMyEventsByMonth: (year, month) => requestMyEvents({ year, month }),
  getMyEventsByRange: (startDate, endDate) =>
    requestMyEvents({ startDate, endDate }),
  getMonthlySummary: (year, month) => requestSummary({ year, month }),
  getSummaryByRange: (startDate, endDate) =>
    requestSummary({ startDate, endDate }),
  delete: (id) => api.delete(`/eventos/${id}`),
};

// Admin API
export const adminAPI = {
  getDashboard: (year, month) =>
    api.get('/admin/dashboard', { params: { year, month } }),
  updateDj: (djId, data) =>
    api.patch(`/admin/djs/${djId}`, data),
  getDjEvents: (djId) =>
    api.get(`/admin/djs/${djId}/eventos`),
  getFichadas: (params = {}) =>
    api.get('/admin/fichadas', { params }),
};

export const fichadasAPI = {
  list: (params = {}) => api.get('/fichadas', { params }),
  create: (data) => api.post('/fichadas', data),
};

// Software API
export const softwareAPI = {
  getAll: (params = {}) => api.get('/software', { params }),
  getById: (id) => api.get(`/software/${id}`),
  create: (data) => api.post('/software', data),
  update: (id, data) => api.patch(`/software/${id}`, data),
  delete: (id) => api.delete(`/software/${id}`),
};

// Shows API
export const showsAPI = {
  getAll: (params = {}) => api.get('/shows', { params }),
  getById: (id) => api.get(`/shows/${id}`),
  create: (data) => api.post('/shows', data),
  update: (id, data) => api.patch(`/shows/${id}`, data),
  delete: (id) => api.delete(`/shows/${id}`),
};

// Contenido API
export const contenidoAPI = {
  getAll: (params = {}) => api.get('/contenido', { params }),
  getById: (id) => api.get(`/contenido/${id}`),
  create: (data) => api.post('/contenido', data),
  update: (id, data) => api.patch(`/contenido/${id}`, data),
  delete: (id) => api.delete(`/contenido/${id}`),
};

// Coordinaciones API
export const coordinacionesAPI = {
  getAll: (params = {}) => api.get('/coordinaciones', { params }),
  getById: (id) => api.get(`/coordinaciones/${id}`),
  getFlujo: (id) => api.get(`/coordinaciones/${id}/flujo`),
  create: (data) => api.post('/coordinaciones', data),
  update: (id, data) => api.patch(`/coordinaciones/${id}`, data),
  delete: (id) => api.delete(`/coordinaciones/${id}`),
  // Flujo API
  saveFlujo: (id, data) => api.post(`/coordinaciones/${id}/flujo`, data),
  completeFlujo: (id, data) => api.post(`/coordinaciones/${id}/flujo/complete`, data),
};


export default api;

