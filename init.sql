-- Initialize database tables for KKP project
-- Database: kkp

USE kkp;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Models table
CREATE TABLE IF NOT EXISTS models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    accuracy FLOAT,
    metrics JSON,
    dataset_path VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datasets table
CREATE TABLE IF NOT EXISTS datasets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    file_path VARCHAR(512),
    row_count INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_id INT,
    input_data JSON,
    prediction VARCHAR(64),
    probability JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_models_created_at ON models(created_at);
CREATE INDEX idx_predictions_model_id ON predictions(model_id);
CREATE INDEX idx_predictions_created_at ON predictions(created_at);
CREATE INDEX idx_users_username ON users(username);

-- Seed initial SUPER_ADMIN user
-- Password: rahasia (hashed with bcrypt)
INSERT IGNORE INTO users (id, username, name, password, role) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'superadmin',
    'Super Admin',
    '$2b$12$42LOkp/mHbDVANvxbLMF4eiaIeEhC2007ut9tuVvEEmfsi4diyNo2',
    'SUPER_ADMIN'
);

