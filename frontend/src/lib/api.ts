import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/v1/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data?.data || res.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/v1/auth/login', data),
  register: (data: unknown) => api.post('/v1/auth/register', data),
  logout: () => api.post('/v1/auth/logout'),
  me: () => api.get('/v1/auth/me'),
};

// Dashboard
export const dashboardApi = {
  getMetrics: () => api.get('/v1/dashboard'),
  getRevenueChart: (months = 6) => api.get(`/v1/dashboard/revenue-chart?months=${months}`),
};

// Products
export const productsApi = {
  list: (params?: Record<string, unknown>) => api.get('/v1/products', { params }),
  get: (id: string) => api.get(`/v1/products/${id}`),
  create: (data: unknown) => api.post('/v1/products', data),
  update: (id: string, data: unknown) => api.patch(`/v1/products/${id}`, data),
  delete: (id: string) => api.delete(`/v1/products/${id}`),
};

// Customers
export const customersApi = {
  list: (params?: Record<string, unknown>) => api.get('/v1/customers', { params }),
  get: (id: string) => api.get(`/v1/customers/${id}`),
  create: (data: unknown) => api.post('/v1/customers', data),
  update: (id: string, data: unknown) => api.patch(`/v1/customers/${id}`, data),
  delete: (id: string) => api.delete(`/v1/customers/${id}`),
};

// Orders
export const ordersApi = {
  list: (params?: Record<string, unknown>) => api.get('/v1/orders', { params }),
  get: (id: string) => api.get(`/v1/orders/${id}`),
  create: (data: unknown) => api.post('/v1/orders', data),
  updateStatus: (id: string, status: string) => api.patch(`/v1/orders/${id}/status`, { status }),
};

// Financial
export const financialApi = {
  list: (params?: Record<string, unknown>) => api.get('/v1/financial', { params }),
  summary: (params?: Record<string, unknown>) => api.get('/v1/financial/summary', { params }),
  create: (data: unknown) => api.post('/v1/financial', data),
  update: (id: string, data: unknown) => api.patch(`/v1/financial/${id}`, data),
  delete: (id: string) => api.delete(`/v1/financial/${id}`),
};

// AI
export const aiApi = {
  chat: (data: { message: string; conversationId?: string }) => api.post('/v1/ai/chat', data),
  getConversations: () => api.get('/v1/ai/conversations'),
  getConversation: (id: string) => api.get(`/v1/ai/conversations/${id}`),
  deleteConversation: (id: string) => api.delete(`/v1/ai/conversations/${id}`),
};
