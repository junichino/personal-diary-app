import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { PaginatedResponse, PaginationMeta } from '@/types';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/setup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface ApiPaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  timestamp: string;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return response.data.data;
}

export async function apiGetPaginated<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<PaginatedResponse<T>> {
  const response = await apiClient.get<ApiPaginatedResponse<T>>(url, config);
  return { data: response.data.data, meta: response.data.meta };
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  return response.data.data;
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
  return response.data.data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return response.data.data;
}

export { apiClient };
