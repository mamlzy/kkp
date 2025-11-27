"""
Database service for MySQL operations.
"""
import os
import json
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ModelDB(Base):
    """SQLAlchemy model for models table."""
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    accuracy = Column(Float)
    metrics = Column(Text)  # JSON stored as text
    dataset_path = Column(String(512))
    created_at = Column(DateTime, default=datetime.utcnow)


class DatasetDB(Base):
    """SQLAlchemy model for datasets table."""
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255))
    file_path = Column(String(512))
    row_count = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)


class PredictionDB(Base):
    """SQLAlchemy model for predictions table."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("models.id", ondelete="SET NULL"))
    input_data = Column(Text)  # JSON stored as text
    prediction = Column(String(64))
    probability = Column(Text)  # JSON stored as text
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Model operations
def create_model(
    db: Session,
    name: str,
    file_path: str,
    accuracy: float,
    metrics: Dict[str, Any],
    dataset_path: Optional[str] = None
) -> ModelDB:
    """Create a new model record."""
    model = ModelDB(
        name=name,
        file_path=file_path,
        accuracy=accuracy,
        metrics=json.dumps(metrics),
        dataset_path=dataset_path
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def get_model(db: Session, model_id: int) -> Optional[ModelDB]:
    """Get a model by ID."""
    return db.query(ModelDB).filter(ModelDB.id == model_id).first()


def get_all_models(db: Session) -> List[ModelDB]:
    """Get all models."""
    return db.query(ModelDB).order_by(ModelDB.created_at.desc()).all()


def delete_model(db: Session, model_id: int) -> bool:
    """Delete a model by ID."""
    model = db.query(ModelDB).filter(ModelDB.id == model_id).first()
    if model:
        # Delete the model file if exists
        if model.file_path and os.path.exists(model.file_path):
            os.remove(model.file_path)
        db.delete(model)
        db.commit()
        return True
    return False


def get_latest_model(db: Session) -> Optional[ModelDB]:
    """Get the latest model."""
    return db.query(ModelDB).order_by(ModelDB.created_at.desc()).first()


# Dataset operations
def create_dataset(
    db: Session,
    name: str,
    file_path: str,
    row_count: int
) -> DatasetDB:
    """Create a new dataset record."""
    dataset = DatasetDB(
        name=name,
        file_path=file_path,
        row_count=row_count
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


def get_dataset(db: Session, dataset_id: int) -> Optional[DatasetDB]:
    """Get a dataset by ID."""
    return db.query(DatasetDB).filter(DatasetDB.id == dataset_id).first()


def get_all_datasets(db: Session) -> List[DatasetDB]:
    """Get all datasets."""
    return db.query(DatasetDB).order_by(DatasetDB.uploaded_at.desc()).all()


def delete_dataset(db: Session, dataset_id: int) -> bool:
    """Delete a dataset by ID."""
    dataset = db.query(DatasetDB).filter(DatasetDB.id == dataset_id).first()
    if dataset:
        if dataset.file_path and os.path.exists(dataset.file_path):
            os.remove(dataset.file_path)
        db.delete(dataset)
        db.commit()
        return True
    return False


# Prediction operations
def create_prediction(
    db: Session,
    model_id: int,
    input_data: Dict[str, Any],
    prediction: str,
    probability: Dict[str, float]
) -> PredictionDB:
    """Create a new prediction record."""
    pred = PredictionDB(
        model_id=model_id,
        input_data=json.dumps(input_data),
        prediction=prediction,
        probability=json.dumps(probability)
    )
    db.add(pred)
    db.commit()
    db.refresh(pred)
    return pred


def get_all_predictions(db: Session) -> List[PredictionDB]:
    """Get all predictions."""
    return db.query(PredictionDB).order_by(PredictionDB.created_at.desc()).all()


def get_prediction_stats(db: Session) -> Dict[str, Any]:
    """Get prediction statistics."""
    total = db.query(PredictionDB).count()
    berprestasi = db.query(PredictionDB).filter(PredictionDB.prediction == "berprestasi").count()
    tidak_berprestasi = db.query(PredictionDB).filter(PredictionDB.prediction == "tidak_berprestasi").count()
    
    return {
        "total_predictions": total,
        "berprestasi_count": berprestasi,
        "tidak_berprestasi_count": tidak_berprestasi
    }


def get_status_distribution(db: Session) -> Dict[str, int]:
    """Get status distribution from predictions."""
    predictions = db.query(PredictionDB).all()
    distribution = {"berprestasi": 0, "tidak_berprestasi": 0}
    
    for pred in predictions:
        if pred.prediction in distribution:
            distribution[pred.prediction] += 1
    
    return distribution

