"""
Pydantic models for API request/response validation.
"""
from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field
from datetime import datetime


# Feature columns for student data
FEATURE_COLUMNS = [
    "pai", "pendidikan_pancasila", "bahasa_indonesia", "matematika",
    "ipa", "ips", "bahasa_inggris", "penjas", "tik",
    "sbk", "prakarya", "bahasa_sunda", "btq", "absen"
]

REQUIRED_COLUMNS = FEATURE_COLUMNS + ["status"]


class StudentFeatures(BaseModel):
    """Student feature data for prediction."""
    pai: float = Field(..., ge=0, le=100, description="Nilai PAI")
    pendidikan_pancasila: float = Field(..., ge=0, le=100, description="Nilai Pendidikan Pancasila")
    bahasa_indonesia: float = Field(..., ge=0, le=100, description="Nilai Bahasa Indonesia")
    matematika: float = Field(..., ge=0, le=100, description="Nilai Matematika")
    ipa: float = Field(..., ge=0, le=100, description="Nilai IPA")
    ips: float = Field(..., ge=0, le=100, description="Nilai IPS")
    bahasa_inggris: float = Field(..., ge=0, le=100, description="Nilai Bahasa Inggris")
    penjas: float = Field(..., ge=0, le=100, description="Nilai Penjas")
    tik: float = Field(..., ge=0, le=100, description="Nilai TIK")
    sbk: float = Field(..., ge=0, le=100, description="Nilai SBK")
    prakarya: float = Field(..., ge=0, le=100, description="Nilai Prakarya")
    bahasa_sunda: float = Field(..., ge=0, le=100, description="Nilai Bahasa Sunda")
    btq: float = Field(..., ge=0, description="Nilai BTQ")
    absen: float = Field(..., ge=0, description="Jumlah Absen")


class PredictRequest(BaseModel):
    """Request body for single prediction."""
    model_id: int = Field(..., description="ID model yang digunakan")
    nama: Optional[str] = Field(None, description="Nama siswa (opsional)")
    pai: float = Field(..., ge=0, le=100)
    pendidikan_pancasila: float = Field(..., ge=0, le=100)
    bahasa_indonesia: float = Field(..., ge=0, le=100)
    matematika: float = Field(..., ge=0, le=100)
    ipa: float = Field(..., ge=0, le=100)
    ips: float = Field(..., ge=0, le=100)
    bahasa_inggris: float = Field(..., ge=0, le=100)
    penjas: float = Field(..., ge=0, le=100)
    tik: float = Field(..., ge=0, le=100)
    sbk: float = Field(..., ge=0, le=100)
    prakarya: float = Field(..., ge=0, le=100)
    bahasa_sunda: float = Field(..., ge=0, le=100)
    btq: float = Field(..., ge=0)
    absen: float = Field(..., ge=0)


class PredictResponse(BaseModel):
    """Response body for prediction."""
    prediction: str
    probability: Dict[str, float]
    nama: Optional[str] = None


class ModelMeta(BaseModel):
    """Model metadata."""
    id: int
    name: str
    accuracy: Optional[float] = None
    metrics: Optional[Dict[str, Any]] = None
    dataset_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ModelTrainResponse(BaseModel):
    """Response after training a model."""
    id: int
    name: str
    accuracy: float
    metrics: Dict[str, Any]
    created_at: str


class ModelUpdateRequest(BaseModel):
    """Request body for updating model."""
    name: str = Field(..., min_length=1, max_length=255, description="Nama model baru")


class DatasetMeta(BaseModel):
    """Dataset metadata."""
    id: int
    name: Optional[str] = None
    file_path: Optional[str] = None
    row_count: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    """Dashboard summary response."""
    total_models: int
    total_datasets: int
    latest_model_accuracy: Optional[float] = None
    status_distribution: Optional[Dict[str, int]] = None
    prediction_stats: Optional[Dict[str, Any]] = None


class BatchPredictResult(BaseModel):
    """Single result in batch prediction."""
    row_index: int
    nama: str
    kode_unik: Optional[str] = None  # Opsional - bisa berupa NIS atau kode unik lainnya
    input_data: Dict[str, Any]
    prediction: str
    probability: Dict[str, float]


class BatchPredictResponse(BaseModel):
    """Response for batch prediction."""
    results: List[BatchPredictResult]
    total_count: int
    berprestasi_count: int
    tidak_berprestasi_count: int

