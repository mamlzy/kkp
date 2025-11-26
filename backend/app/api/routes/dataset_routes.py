"""
API routes for dataset management.
"""
import os
import io
from datetime import datetime
from typing import List
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
import pandas as pd

from sqlalchemy.orm import Session

from app.api.models import DatasetMeta
from app.services.db_service import (
    get_db, create_dataset, get_dataset, get_all_datasets, delete_dataset
)
from app.services.ml_service import ml_service


router = APIRouter()

UPLOADS_DIR = "app/uploads"


@router.post("/datasets/upload", response_model=DatasetMeta)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload a dataset file (CSV).
    
    - Validates CSV format and required columns
    - Saves file and metadata to database
    """
    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File harus berformat CSV")
    
    # Read and validate CSV
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file CSV: {str(e)}")
    
    # Validate columns
    is_valid, error_msg = ml_service.validate_csv_columns(df, require_status=True)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Generate filename and save
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"dataset_{timestamp}.csv"
    file_path = os.path.join(UPLOADS_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Save to database
    dataset_name = name or file.filename
    dataset = create_dataset(
        db=db,
        name=dataset_name,
        file_path=file_path,
        row_count=len(df)
    )
    
    return DatasetMeta(
        id=dataset.id,
        name=dataset.name,
        file_path=dataset.file_path,
        row_count=dataset.row_count,
        uploaded_at=dataset.uploaded_at
    )


@router.get("/datasets", response_model=List[DatasetMeta])
async def list_datasets(db: Session = Depends(get_db)):
    """Get all uploaded datasets."""
    datasets = get_all_datasets(db)
    return [
        DatasetMeta(
            id=d.id,
            name=d.name,
            file_path=d.file_path,
            row_count=d.row_count,
            uploaded_at=d.uploaded_at
        )
        for d in datasets
    ]


@router.get("/datasets/{dataset_id}", response_model=DatasetMeta)
async def get_dataset_detail(dataset_id: int, db: Session = Depends(get_db)):
    """Get dataset details by ID."""
    dataset = get_dataset(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
    
    return DatasetMeta(
        id=dataset.id,
        name=dataset.name,
        file_path=dataset.file_path,
        row_count=dataset.row_count,
        uploaded_at=dataset.uploaded_at
    )


@router.delete("/datasets/{dataset_id}")
async def delete_dataset_endpoint(dataset_id: int, db: Session = Depends(get_db)):
    """Delete a dataset by ID."""
    dataset = get_dataset(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
    
    success = delete_dataset(db, dataset_id)
    if success:
        return {"message": "Dataset berhasil dihapus", "id": dataset_id}
    raise HTTPException(status_code=500, detail="Gagal menghapus dataset")


@router.get("/datasets/{dataset_id}/preview")
async def preview_dataset(
    dataset_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Preview first N rows of a dataset."""
    dataset = get_dataset(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
    
    if not os.path.exists(dataset.file_path):
        raise HTTPException(status_code=404, detail="File dataset tidak ditemukan")
    
    try:
        df = pd.read_csv(dataset.file_path, nrows=limit)
        return {
            "columns": df.columns.tolist(),
            "rows": df.to_dict(orient="records"),
            "total_rows": dataset.row_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membaca dataset: {str(e)}")

