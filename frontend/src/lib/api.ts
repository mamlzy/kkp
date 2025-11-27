import axios, { AxiosError } from 'axios';
import type {
  ModelMeta,
  DashboardSummary,
  PredictionRequest,
  PredictionResponse,
  BatchPredictResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  UpdateProfileRequest,
  UpdateUserRequest,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle errors and extract backend error messages
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    // Handle 401 errors - clear token and redirect to login
    if (error.response?.status === 401) {
      clearStoredToken();
      // Don't redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Extract error message from backend response
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      'Terjadi kesalahan yang tidak diketahui';

    // Create a new error with the extracted message
    const customError = new Error(errorMessage);
    return Promise.reject(customError);
  },
);

// Dashboard
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/dashboard/summary');
  return response.data;
}

// Models
export async function getModels(): Promise<ModelMeta[]> {
  const response = await api.get<ModelMeta[]>('/models');
  return response.data;
}

export async function getModel(id: number): Promise<ModelMeta> {
  const response = await api.get<ModelMeta>(`/models/${id}`);
  return response.data;
}

export async function deleteModel(id: number): Promise<void> {
  await api.delete(`/models/${id}`);
}

export async function updateModel(
  id: number,
  data: { name: string },
): Promise<ModelMeta> {
  const response = await api.put<ModelMeta>(`/models/${id}`, data);
  return response.data;
}

export async function trainModel(
  file: File,
  name?: string,
): Promise<ModelMeta> {
  const formData = new FormData();
  formData.append('file', file);
  if (name) {
    formData.append('name', name);
  }
  formData.append('target_column', 'status');

  const response = await api.post<ModelMeta>('/models/train', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// Predictions
export async function predictSingle(
  data: PredictionRequest,
): Promise<PredictionResponse> {
  const response = await api.post<PredictionResponse>('/predict', data);
  return response.data;
}

export async function predictBatch(
  file: File,
  modelId: number,
): Promise<BatchPredictResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model_id', modelId.toString());

  const response = await api.post<BatchPredictResponse>(
    '/predict/batch',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
}

export async function downloadBatchResults(
  file: File,
  modelId: number,
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model_id', modelId.toString());

  const response = await api.post('/predict/batch/download', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
  });
  return response.data;
}

// Template
export function getTemplateUrl(): string {
  return `${API_BASE_URL}/template/csv`;
}

// Auth
export async function login(data: LoginRequest): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/auth/login', data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<User> {
  const response = await api.post<User>('/auth/register', data);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  return response.data;
}

export async function verifyToken(): Promise<User> {
  const response = await api.post<User>('/auth/verify');
  return response.data;
}

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/auth/users');
  return response.data;
}

export async function updateMyProfile(
  data: UpdateProfileRequest,
): Promise<User> {
  const response = await api.put<User>('/auth/me', data);
  return response.data;
}

export async function updateUser(
  userId: string,
  data: UpdateUserRequest,
): Promise<User> {
  const response = await api.put<User>(`/auth/users/${userId}`, data);
  return response.data;
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(
    `/auth/users/${userId}`,
  );
  return response.data;
}

export default api;
