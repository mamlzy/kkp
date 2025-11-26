"""
API routes for predictions.
"""
import io
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
import pandas as pd

from sqlalchemy.orm import Session

from app.api.models import (
    PredictRequest, PredictResponse, BatchPredictResponse,
    BatchPredictResult, FEATURE_COLUMNS
)
from app.services.db_service import get_db, get_model, create_prediction
from app.services.ml_service import ml_service


router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
async def predict_single(
    request: PredictRequest,
    db: Session = Depends(get_db)
):
    """
    Make a single prediction for one student.
    
    Requires all feature values and model_id.
    Returns prediction label and probabilities.
    """
    # Get model
    model = get_model(db, request.model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model tidak ditemukan")
    
    # Prepare features
    features = {
        "pai": request.pai,
        "pendidikan_pancasila": request.pendidikan_pancasila,
        "bahasa_indonesia": request.bahasa_indonesia,
        "matematika": request.matematika,
        "ipa": request.ipa,
        "ips": request.ips,
        "bahasa_inggris": request.bahasa_inggris,
        "penjas": request.penjas,
        "tik": request.tik,
        "sbk": request.sbk,
        "prakarya": request.prakarya,
        "bahasa_sunda": request.bahasa_sunda,
        "btq": request.btq,
        "absen": request.absen
    }
    
    # Make prediction
    try:
        result = ml_service.predict(request.model_id, model.file_path, features)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File model tidak ditemukan")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal melakukan prediksi: {str(e)}")
    
    # Save prediction to database
    create_prediction(
        db=db,
        model_id=request.model_id,
        input_data=features,
        prediction=result["prediction"],
        probability=result["probability"]
    )
    
    return PredictResponse(
        prediction=result["prediction"],
        probability=result["probability"],
        nama=request.nama
    )


@router.post("/predict/batch", response_model=BatchPredictResponse)
async def predict_batch(
    file: UploadFile = File(...),
    model_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """
    Make batch predictions from CSV file.
    
    - Upload CSV with feature columns (status column optional)
    - Requires 'nama' and 'kode_unik' columns for student identification
    - Returns list of predictions for each row
    """
    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File harus berformat CSV")
    
    # Get model
    model = get_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model tidak ditemukan")
    
    # Read CSV
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file CSV: {str(e)}")
    
    # Validate required identity columns (nama wajib, kode_unik opsional)
    if "nama" not in df.columns:
        raise HTTPException(
            status_code=400, 
            detail="Kolom 'nama' tidak ditemukan. Pastikan file CSV memiliki kolom 'nama' untuk identifikasi siswa"
        )
    
    # Validate feature columns (status not required for prediction)
    is_valid, error_msg = ml_service.validate_csv_columns(df, require_status=False)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Extract nama and kode_unik (opsional) before prediction
    nama_list = df["nama"].fillna("").astype(str).tolist()
    kode_unik_list = df["kode_unik"].fillna("").astype(str).tolist() if "kode_unik" in df.columns else [""] * len(df)
    
    # Make predictions
    try:
        results = ml_service.predict_batch(model_id, model.file_path, df)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File model tidak ditemukan")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal melakukan prediksi batch: {str(e)}")
    
    # Add nama and kode_unik to results
    for i, result in enumerate(results):
        result["nama"] = nama_list[i]
        result["kode_unik"] = kode_unik_list[i]
    
    # Save predictions to database
    for result in results:
        create_prediction(
            db=db,
            model_id=model_id,
            input_data=result["input_data"],
            prediction=result["prediction"],
            probability=result["probability"]
        )
    
    # Calculate statistics
    berprestasi_count = sum(1 for r in results if r["prediction"] == "berprestasi")
    tidak_berprestasi_count = len(results) - berprestasi_count
    
    return BatchPredictResponse(
        results=[BatchPredictResult(**r) for r in results],
        total_count=len(results),
        berprestasi_count=berprestasi_count,
        tidak_berprestasi_count=tidak_berprestasi_count
    )


@router.post("/predict/batch/download")
async def predict_batch_download(
    file: UploadFile = File(...),
    model_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """
    Make batch predictions and return results as CSV download.
    Requires 'nama' column, 'kode_unik' is optional.
    """
    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File harus berformat CSV")
    
    # Get model
    model = get_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model tidak ditemukan")
    
    # Read CSV
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file CSV: {str(e)}")
    
    # Validate required identity columns (nama wajib)
    if "nama" not in df.columns:
        raise HTTPException(
            status_code=400, 
            detail="Kolom 'nama' tidak ditemukan. Pastikan file CSV memiliki kolom 'nama' untuk identifikasi siswa"
        )
    
    # Validate columns
    is_valid, error_msg = ml_service.validate_csv_columns(df, require_status=False)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Make predictions
    try:
        results = ml_service.predict_batch(model_id, model.file_path, df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal melakukan prediksi: {str(e)}")
    
    # Reorder columns: nama, kode_unik (if exists), then other columns
    cols_order = ["nama"]
    if "kode_unik" in df.columns:
        cols_order.append("kode_unik")
    
    # Add predictions to dataframe
    df["prediksi"] = [r["prediction"] for r in results]
    df["probabilitas_berprestasi"] = [r["probability"].get("berprestasi", 0) for r in results]
    df["probabilitas_tidak_berprestasi"] = [r["probability"].get("tidak_berprestasi", 0) for r in results]
    
    # Reorder columns for better readability
    other_cols = [c for c in df.columns if c not in cols_order]
    df = df[cols_order + other_cols]
    
    # Convert to CSV
    output = io.BytesIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hasil_prediksi.csv"}
    )

