"""
Machine Learning service for CART model training and prediction.
"""
import os
import json
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
import pandas as pd
import numpy as np
import joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

from app.api.models import FEATURE_COLUMNS, REQUIRED_COLUMNS


class MLService:
    """Service for machine learning operations."""

    def __init__(self, models_dir: str = "app/models"):
        """Initialize ML service."""
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)
        self._loaded_models: Dict[int, Any] = {}

    def validate_csv_columns(self, df: pd.DataFrame, require_status: bool = True) -> Tuple[bool, str]:
        """
        Validate that CSV has required columns.
        
        Args:
            df: DataFrame to validate
            require_status: Whether status column is required
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        required = REQUIRED_COLUMNS if require_status else FEATURE_COLUMNS
        missing_cols = [col for col in required if col not in df.columns]
        
        if missing_cols:
            return False, f"Kolom tidak ditemukan: {', '.join(missing_cols)}"
        
        return True, ""

    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess the data."""
        # Convert status to numeric if string
        if "status" in df.columns:
            status_mapping = {"berprestasi": 1, "tidak_berprestasi": 0}
            if df["status"].dtype == object:
                df["status"] = df["status"].map(lambda x: status_mapping.get(x, x))
        
        # Fill missing values with median for numeric columns
        for col in FEATURE_COLUMNS:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
                df[col] = df[col].fillna(df[col].median())
        
        return df

    def train_model(
        self,
        df: pd.DataFrame,
        model_name: str,
        target_column: str = "status",
        test_size: float = 0.2,
        random_state: int = 42
    ) -> Dict[str, Any]:
        """
        Train a CART (Decision Tree) model.
        
        Args:
            df: Training data
            model_name: Name for the model
            target_column: Target column name
            test_size: Test split ratio
            random_state: Random seed
            
        Returns:
            Dictionary with model info and metrics
        """
        # Preprocess data
        df = self.preprocess_data(df)
        
        # Prepare features and target
        X = df[FEATURE_COLUMNS].values
        y = df[target_column].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        # Train CART model (DecisionTreeClassifier)
        model = DecisionTreeClassifier(
            criterion="gini",
            random_state=random_state,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2
        )
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Calculate metrics
        precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        
        metrics = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "test_size": test_size,
            "training_samples": len(X_train),
            "test_samples": len(X_test)
        }
        
        # Save model
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{model_name}_{timestamp}.joblib"
        file_path = os.path.join(self.models_dir, filename)
        
        # Save model with metadata
        model_data = {
            "model": model,
            "feature_columns": FEATURE_COLUMNS,
            "classes": model.classes_.tolist() if hasattr(model, "classes_") else [0, 1]
        }
        joblib.dump(model_data, file_path)
        
        return {
            "file_path": file_path,
            "accuracy": round(accuracy, 4),
            "metrics": metrics
        }

    def load_model(self, model_id: int, file_path: str) -> Any:
        """
        Load a model from file.
        
        Args:
            model_id: Model ID for caching
            file_path: Path to model file
            
        Returns:
            Loaded model data
        """
        if model_id not in self._loaded_models:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Model file not found: {file_path}")
            self._loaded_models[model_id] = joblib.load(file_path)
        return self._loaded_models[model_id]

    def predict(
        self,
        model_id: int,
        file_path: str,
        features: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Make a single prediction.
        
        Args:
            model_id: Model ID
            file_path: Path to model file
            features: Feature dictionary
            
        Returns:
            Prediction result with probabilities
        """
        model_data = self.load_model(model_id, file_path)
        model = model_data["model"]
        
        # Prepare features in correct order
        feature_values = [features[col] for col in FEATURE_COLUMNS]
        X = np.array([feature_values])
        
        # Predict
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]
        
        # Map prediction to label
        classes = model_data.get("classes", [0, 1])
        label_map = {0: "tidak_berprestasi", 1: "berprestasi"}
        
        if isinstance(prediction, (int, np.integer)):
            prediction_label = label_map.get(prediction, str(prediction))
        else:
            prediction_label = str(prediction)
        
        # Build probability dict
        prob_dict = {}
        for i, cls in enumerate(classes):
            cls_label = label_map.get(cls, str(cls)) if isinstance(cls, (int, np.integer)) else str(cls)
            prob_dict[cls_label] = round(float(probabilities[i]), 4)
        
        return {
            "prediction": prediction_label,
            "probability": prob_dict
        }

    def predict_batch(
        self,
        model_id: int,
        file_path: str,
        df: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """
        Make batch predictions from DataFrame.
        
        Args:
            model_id: Model ID
            file_path: Path to model file
            df: DataFrame with features
            
        Returns:
            List of prediction results
        """
        model_data = self.load_model(model_id, file_path)
        model = model_data["model"]
        
        # Preprocess (without requiring status)
        for col in FEATURE_COLUMNS:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
                df[col] = df[col].fillna(df[col].median())
        
        # Prepare features
        X = df[FEATURE_COLUMNS].values
        
        # Predict
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)
        
        # Map results
        classes = model_data.get("classes", [0, 1])
        label_map = {0: "tidak_berprestasi", 1: "berprestasi"}
        
        results = []
        for i, (pred, probs) in enumerate(zip(predictions, probabilities)):
            if isinstance(pred, (int, np.integer)):
                pred_label = label_map.get(pred, str(pred))
            else:
                pred_label = str(pred)
            
            prob_dict = {}
            for j, cls in enumerate(classes):
                cls_label = label_map.get(cls, str(cls)) if isinstance(cls, (int, np.integer)) else str(cls)
                prob_dict[cls_label] = round(float(probs[j]), 4)
            
            results.append({
                "row_index": i,
                "input_data": df.iloc[i][FEATURE_COLUMNS].to_dict(),
                "prediction": pred_label,
                "probability": prob_dict
            })
        
        return results

    def get_feature_importance(self, model_id: int, file_path: str) -> Dict[str, float]:
        """Get feature importance from model."""
        model_data = self.load_model(model_id, file_path)
        model = model_data["model"]
        
        importances = model.feature_importances_
        feature_importance = {}
        
        for i, col in enumerate(FEATURE_COLUMNS):
            feature_importance[col] = round(float(importances[i]), 4)
        
        return dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))


# Global ML service instance
ml_service = MLService()

