/**
 * Type definitions for the CART Student Achievement Prediction App
 */

export type StudentFeatures = {
  pai: number;
  pendidikan_pancasila: number;
  bahasa_indonesia: number;
  matematika: number;
  ipa: number;
  ips: number;
  bahasa_inggris: number;
  penjas: number;
  tik: number;
  sbk: number;
  prakarya: number;
  bahasa_sunda: number;
  btq: number;
  absen: number;
};

export type PredictionRequest = StudentFeatures & {
  model_id: number;
};

export type PredictionResponse = {
  prediction: string;
  probability: Record<string, number>;
};

export type ModelMeta = {
  id: number;
  name: string;
  accuracy?: number;
  metrics?: {
    precision?: number;
    recall?: number;
    f1_score?: number;
    feature_importance?: Record<string, number>;
    test_size?: number;
    training_samples?: number;
    test_samples?: number;
  };
  dataset_path?: string;
  created_at: string;
};

export type DatasetMeta = {
  id: number;
  name?: string;
  file_path?: string;
  row_count?: number;
  uploaded_at: string;
};

export type DashboardSummary = {
  total_models: number;
  total_datasets: number;
  latest_model_accuracy?: number;
  status_distribution?: Record<string, number>;
  prediction_stats?: {
    total_predictions: number;
    berprestasi_count: number;
    tidak_berprestasi_count: number;
  };
};

export type BatchPredictResult = {
  row_index: number;
  input_data: Record<string, number>;
  prediction: string;
  probability: Record<string, number>;
};

export type BatchPredictResponse = {
  results: BatchPredictResult[];
  total_count: number;
  berprestasi_count: number;
  tidak_berprestasi_count: number;
};

// Feature labels in Indonesian
export const FEATURE_LABELS: Record<keyof StudentFeatures, string> = {
  pai: "PAI",
  pendidikan_pancasila: "Pendidikan Pancasila",
  bahasa_indonesia: "Bahasa Indonesia",
  matematika: "Matematika",
  ipa: "IPA",
  ips: "IPS",
  bahasa_inggris: "Bahasa Inggris",
  penjas: "Penjas",
  tik: "TIK",
  sbk: "SBK",
  prakarya: "Prakarya",
  bahasa_sunda: "Bahasa Sunda",
  btq: "BTQ",
  absen: "Absen",
};

// Feature order for forms
export const FEATURE_ORDER: (keyof StudentFeatures)[] = [
  "pai",
  "pendidikan_pancasila",
  "bahasa_indonesia",
  "matematika",
  "ipa",
  "ips",
  "bahasa_inggris",
  "penjas",
  "tik",
  "sbk",
  "prakarya",
  "bahasa_sunda",
  "btq",
  "absen",
];

