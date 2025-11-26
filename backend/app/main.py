"""
Main FastAPI application for CART-based student achievement prediction.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.routes import model_routes, predict_routes, dataset_routes, auth_routes
from app.services.db_service import init_db
from app.services.auth_service import seed_super_admin, UserDB

load_dotenv()

app = FastAPI(
    title="CART Student Achievement Prediction API",
    description="API untuk menentukan siswa berprestasi menggunakan metode CART",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(model_routes.router, prefix="/api/v1", tags=["Models"])
app.include_router(predict_routes.router, prefix="/api/v1", tags=["Predictions"])
app.include_router(dataset_routes.router, prefix="/api/v1", tags=["Datasets"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    # Create models directory if not exists
    os.makedirs("app/models", exist_ok=True)
    os.makedirs("app/uploads", exist_ok=True)
    # Seed super admin user
    seed_super_admin()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "CART Student Achievement Prediction API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

