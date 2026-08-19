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

// Helper genérico para contornar a tipagem padrão do Axios com Interceptors
const request = {
  get: <T>(url: string, config?: object) => api.get<never, T>(url, config),
  post: <T>(url: string, data?: unknown, config?: object) => api.post<never, T>(url, data, config),
  patch: <T>(url: string, data?: unknown, config?: object) => api.patch<never, T>(url, data, config),
  delete: <T>(url: string, config?: object) => api.delete<never, T>(url, config),
};

// Auth
export const authApi = {
  login: <T = any>(data: { email?: string; password?: string }) => request.post<T>('/v1/auth/login', data),
  register: <T = any>(data: unknown) => request.post<T>('/v1/auth/register', data),
  logout: <T = any>() => request.post<T>('/v1/auth/logout'),
  me: <T = any>() => request.get<T>('/v1/auth/me'),
};

// Dashboard
export const dashboardApi = {
  getMetrics: <T = any>() => request.get<T>('/v1/dashboard'),
  getRevenueChart: <T = any>(months = 6) => request.get<T>(`/v1/dashboard/revenue-chart?months=${months}`),
};

// Products
export const productsApi = {
  list: <T = any>(params?: Record<string, unknown>) => request.get<T>('/v1/products', { params }),
  get: <T = any>(id: string) => request.get<T>(`/v1/products/${id}`),
  create: <T = any>(data: unknown) => request.post<T>('/v1/products', data),
  update: <T = any>(id: string, data: unknown) => request.patch<T>(`/v1/products/${id}`, data),
  delete: <T = any>(id: string) => request.delete<T>(`/v1/products/${id}`),
};

// Customers
export const customersApi = {
  list: <T = any>(params?: Record<string, unknown>) => request.get<T>('/v1/customers', { params }),
  get: <T = any>(id: string) => request.get<T>(`/v1/customers/${id}`),
  create: <T = any>(data: unknown) => request.post<T>('/v1/customers', data),
  update: <T = any>(id: string, data: unknown) => request.patch<T>(`/v1/customers/${id}`, data),
  delete: <T = any>(id: string) => request.delete<T>(`/v1/customers/${id}`),
};

// Orders
export const ordersApi = {
  list: <T = any>(params?: Record<string, unknown>) => request.get<T>('/v1/orders', { params }),
  get: <T = any>(id: string) => request.get<T>(`/v1/orders/${id}`),
  create: <T = any>(data: unknown) => request.post<T>('/v1/orders', data),
  updateStatus: <T = any>(id: string, status: string) => request.patch<T>(`/v1/orders/${id}/status`, { status }),
};

// Financial
export const financialApi = {
  list: <T = any>(params?: Record<string, unknown>) => request.get<T>('/v1/financial', { params }),
  summary: <T = any>(params?: Record<string, unknown>) => request.get<T>('/v1/financial/summary', { params }),
  create: <T = any>(data: unknown) => request.post<T>('/v1/financial', data),
  update: <T = any>(id: string, data: unknown) => request.patch<T>(`/v1/financial/${id}`, data),
  delete: <T = any>(id: string) => request.delete<T>(`/v1/financial/${id}`),
};

// AI
export const aiApi = {
  chat: <T = any>(data: { message: string; conversationId?: string }) => request.post<T>('/v1/ai/chat', data),
  getConversations: <T = any>() => request.get<T>('/v1/ai/conversations'),
  getConversation: <T = any>(id: string) => request.get<T>(`/v1/ai/conversations/${id}`),
  deleteConversation: <T = any>(id: string) => request.delete<T>(`/v1/ai/conversations/${id}`),
};