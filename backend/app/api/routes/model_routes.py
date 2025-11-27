"""
API routes for model management.
"""
import os
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse
import pandas as pd
import io

from sqlalchemy.orm import Session

from app.api.models import ModelMeta, ModelTrainResponse, ModelUpdateRequest, DashboardSummary, REQUIRED_COLUMNS
from app.services.db_service import (
    get_db, create_model, get_model, get_all_models, update_model, delete_model,
    get_latest_model, get_all_datasets, get_prediction_stats, get_status_distribution
)
from app.services.ml_service import ml_service


router = APIRouter()


@router.post("/models/train", response_model=ModelTrainResponse)
async def train_model(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    target_column: str = Form("status"),
    db: Session = Depends(get_db)
):
    """
    Train a new CART model from CSV dataset.
    
    - Upload CSV file with required columns
    - Optionally provide model name
    - Returns trained model metadata with accuracy metrics
    """
    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File harus berformat CSV")
    
    # Read CSV
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file CSV: {str(e)}")
    
    # Validate columns
    is_valid, error_msg = ml_service.validate_csv_columns(df, require_status=True)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Generate model name if not provided
    if not name:
        name = f"model-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Train model
    try:
        result = ml_service.train_model(df, name, target_column)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal melatih model: {str(e)}")
    
    # Save to database
    model_record = create_model(
        db=db,
        name=name,
        file_path=result["file_path"],
        accuracy=result["accuracy"],
        metrics=result["metrics"],
        dataset_path=file.filename
    )
    
    return ModelTrainResponse(
        id=model_record.id,
        name=model_record.name,
        accuracy=result["accuracy"],
        metrics=result["metrics"],
        created_at=model_record.created_at.strftime("%Y-%m-%d %H:%M:%S")
    )


@router.get("/models", response_model=List[ModelMeta])
async def list_models(db: Session = Depends(get_db)):
    """Get all trained models."""
    models = get_all_models(db)
    result = []
    for model in models:
        metrics = json.loads(model.metrics) if model.metrics else None
        result.append(ModelMeta(
            id=model.id,
            name=model.name,
            accuracy=model.accuracy,
            metrics=metrics,
            dataset_path=model.dataset_path,
            created_at=model.created_at
        ))
    return result


@router.get("/models/{model_id}", response_model=ModelMeta)
async def get_model_detail(model_id: int, db: Session = Depends(get_db)):
    """Get model details by ID."""
    model = get_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model tidak ditemukan")
    
    metrics = json.loads(model.metrics) if model.metrics else None
    
    # Get feature importance
    try:
        feature_importance = ml_service.get_feature_importance(model_id, model.file_path)
        if metrics:
            metrics["feature_importance"] = feature_importance
    except:
        pass
    
    return ModelMeta(
        id=model.id,
        name=model.name,
        accuracy=model.accuracy,
        metrics=metrics,
        dataset_path=model.dataset_path,
        created_at=model.created_at
    )


@router.put("/models/{model_id}", response_model=ModelMeta)
async def update_model_endpoint(
    model_id: int,
    request: ModelUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update a model's name."""
    model = get_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model tidak ditemukan")
    
    updated_model = update_model(db, model_id, request.name)
    if not updated_model:
        raise HTTPException(status_code=500, detail="Gagal memperbarui model")
    
    metrics = json.loads(updated_model.metrics) if updated_model.metrics else None
    
    return ModelMeta(
        id=updated_model.id,
        name=updated_model.name,
        accuracy=updated_model.accuracy,
        metrics=metrics,
        dataset_path=updated_model.dataset_path,
        created_at=updated_model.created_at
    )


@router.delete("/models/{model_id}")
async def delete_model_endpoint(model_id: int, db: Session = Depends(get_db)):
    """Delete a model by ID."""
    model = get_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model tidak ditemukan")
    
    success = delete_model(db, model_id)
    if success:
        return {"message": "Model berhasil dihapus", "id": model_id}
    raise HTTPException(status_code=500, detail="Gagal menghapus model")


@router.get("/template/csv")
async def download_csv_template():
    """Download CSV template with required columns."""
    # Create template with header and example row
    template_content = ",".join(REQUIRED_COLUMNS) + "\n"
    template_content += "80,85,90,75,78,82,88,70,80,76,84,90,2,0,berprestasi\n"
    
    return StreamingResponse(
        io.BytesIO(template_content.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=template_siswa.csv"}
    )


@router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """Get dashboard summary statistics."""
    # Get counts
    models = get_all_models(db)
    datasets = get_all_datasets(db)
    latest_model = get_latest_model(db)
    
    # Get prediction stats
    prediction_stats = get_prediction_stats(db)
    status_distribution = get_status_distribution(db)
    
    return DashboardSummary(
        total_models=len(models),
        total_datasets=len(datasets),
        latest_model_accuracy=latest_model.accuracy if latest_model else None,
        status_distribution=status_distribution,
        prediction_stats=prediction_stats
    )

