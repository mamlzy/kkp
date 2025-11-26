import axios from "axios";
import type {
  ModelMeta,
  DashboardSummary,
  PredictionRequest,
  PredictionResponse,
  BatchPredictResponse,
} from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Dashboard
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>("/dashboard/summary");
  return response.data;
}

// Models
export async function getModels(): Promise<ModelMeta[]> {
  const response = await api.get<ModelMeta[]>("/models");
  return response.data;
}

export async function getModel(id: number): Promise<ModelMeta> {
  const response = await api.get<ModelMeta>(`/models/${id}`);
  return response.data;
}

export async function deleteModel(id: number): Promise<void> {
  await api.delete(`/models/${id}`);
}

export async function trainModel(file: File, name?: string): Promise<ModelMeta> {
  const formData = new FormData();
  formData.append("file", file);
  if (name) {
    formData.append("name", name);
  }
  formData.append("target_column", "status");

  const response = await api.post<ModelMeta>("/models/train", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

// Predictions
export async function predictSingle(data: PredictionRequest): Promise<PredictionResponse> {
  const response = await api.post<PredictionResponse>("/predict", data);
  return response.data;
}

export async function predictBatch(file: File, modelId: number): Promise<BatchPredictResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model_id", modelId.toString());

  const response = await api.post<BatchPredictResponse>("/predict/batch", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function downloadBatchResults(file: File, modelId: number): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model_id", modelId.toString());

  const response = await api.post("/predict/batch/download", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
  return response.data;
}

// Template
export function getTemplateUrl(): string {
  return `${API_BASE_URL}/template/csv`;
}

export default api;

