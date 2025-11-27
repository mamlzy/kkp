# CART Student Achievement Prediction System

Sistem prediksi siswa berprestasi menggunakan metode **Classification and Regression Tree (CART)** untuk SMP PGRI Tambun Selatan.

## 📋 Deskripsi

Proyek ini merupakan implementasi full-stack untuk skripsi berjudul:

> **"PENERAPAN METODE CLASSIFICATION AND REGRESSION TREE (CART) UNTUK MENENTUKAN SISWA BERPRESTASI DI SMP PGRI TAMBUN SELATAN"**

Sistem ini menggunakan algoritma CART (Decision Tree) dari scikit-learn untuk memprediksi status prestasi siswa berdasarkan nilai mata pelajaran dan kehadiran.

## 🛠️ Tech Stack

### Backend

- **Python 3.14+**
- **FastAPI** - Web framework
- **scikit-learn** - Machine Learning (DecisionTreeClassifier)
- **SQLAlchemy** - ORM
- **MySQL** - Database
- **Joblib** - Model serialization
- **Pandas & NumPy** - Data processing

### Frontend

- **Vite** - Build tool
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Query** - Data fetching
- **Recharts** - Charts

## 📁 Struktur Proyek

```
project-root/
├─ backend/
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ api/
│  │  │  ├─ models.py
│  │  │  ├─ routes/
│  │  │  │  ├─ model_routes.py
│  │  │  │  ├─ predict_routes.py
│  │  │  │  ├─ dataset_routes.py
│  │  ├─ services/
│  │  │  ├─ ml_service.py
│  │  │  ├─ db_service.py
│  │  ├─ models/   # tempat file .joblib
│  ├─ requirements.txt
│  └─ Dockerfile
├─ frontend/
│  ├─ src/
│  │  ├─ pages/
│  │  ├─ components/
│  │  ├─ types/
│  │  ├─ lib/
│  ├─ vite.config.ts
│  ├─ tailwind.config.js
├─ docker-compose.yml
└─ README.md
```

## 🚀 Cara Menjalankan

### Prasyarat

- Docker & Docker Compose
- Node.js 20+ (untuk development)
- Python 3.14+ (untuk development)
- MySQL 8.0+

### Menggunakan Docker (Rekomendasi)

```bash
# Clone repository
git clone <repository-url>
cd kkp-experiment

# Jalankan dengan Docker Compose
docker-compose up -d

# Akses aplikasi
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/docs
```

### Development Mode

#### Backend

```bash
cd backend

# Buat virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# atau
.\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Konfigurasi database
# Buat file .env dengan konfigurasi berikut:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_db_password
# DB_NAME=kkp
# SUPER_ADMIN_PASSWORD=your_superadmin_password
# JWT_SECRET_KEY=you_jwrt_secret

# Jalankan server
uvicorn app.main:app --reload --port 5000
```

#### Frontend

```bash
cd frontend

# Install dependencies
pnpm install
# atau
npm install

# Jalankan development server
pnpm dev
# atau
npm run dev
```

## 📊 Fitur Sistem

### 1. Dashboard

- Ringkasan total model dan dataset
- Akurasi model terbaru
- Grafik distribusi status prediksi
- Grafik perbandingan akurasi model

### 2. Manajemen Model

- Upload dataset CSV untuk training
- Lihat daftar model terlatih
- Detail metrik model (akurasi, precision, recall)
- Hapus model

### 3. Prediksi

- **Prediksi Satu Siswa**: Input nilai manual
- **Prediksi Batch**: Upload CSV untuk prediksi massal
- Download hasil prediksi dalam format CSV
- Download template CSV

## 📝 Format Data CSV

### Kolom yang Dibutuhkan

```csv
pai,pendidikan_pancasila,bahasa_indonesia,matematika,ipa,ips,bahasa_inggris,penjas,tik,sbk,prakarya,bahasa_sunda,btq,absen,status
```

### Contoh Data

```csv
pai,pendidikan_pancasila,bahasa_indonesia,matematika,ipa,ips,bahasa_inggris,penjas,tik,sbk,prakarya,bahasa_sunda,btq,absen,status
80,85,90,75,78,82,88,70,80,76,84,90,2,0,berprestasi
70,72,68,65,70,75,60,80,70,72,65,70,3,5,tidak_berprestasi
```

### Keterangan Kolom

| Kolom                | Deskripsi                  | Range                           |
| -------------------- | -------------------------- | ------------------------------- |
| pai                  | Nilai PAI                  | 0-100                           |
| pendidikan_pancasila | Nilai Pendidikan Pancasila | 0-100                           |
| bahasa_indonesia     | Nilai Bahasa Indonesia     | 0-100                           |
| matematika           | Nilai Matematika           | 0-100                           |
| ipa                  | Nilai IPA                  | 0-100                           |
| ips                  | Nilai IPS                  | 0-100                           |
| bahasa_inggris       | Nilai Bahasa Inggris       | 0-100                           |
| penjas               | Nilai Penjas               | 0-100                           |
| tik                  | Nilai TIK                  | 0-100                           |
| sbk                  | Nilai SBK                  | 0-100                           |
| prakarya             | Nilai Prakarya             | 0-100                           |
| bahasa_sunda         | Nilai Bahasa Sunda         | 0-100                           |
| btq                  | Nilai BTQ                  | ≥0                              |
| absen                | Jumlah Absen               | ≥0                              |
| status               | Label target               | berprestasi / tidak_berprestasi |

## 🔌 API Endpoints

Base URL: `/api/v1`

| Method | Endpoint             | Deskripsi             |
| ------ | -------------------- | --------------------- |
| POST   | `/models/train`      | Train model baru      |
| GET    | `/models`            | List semua model      |
| GET    | `/models/{id}`       | Detail model          |
| DELETE | `/models/{id}`       | Hapus model           |
| POST   | `/predict`           | Prediksi single       |
| POST   | `/predict/batch`     | Prediksi batch        |
| GET    | `/template/csv`      | Download template CSV |
| GET    | `/dashboard/summary` | Ringkasan dashboard   |

## 🗄️ Database Schema

### Tabel `models`

```sql
CREATE TABLE models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  accuracy FLOAT,
  metrics JSON,
  dataset_path VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabel `datasets`

```sql
CREATE TABLE datasets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  file_path VARCHAR(512),
  row_count INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabel `predictions`

```sql
CREATE TABLE predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_id INT,
  input_data JSON,
  prediction VARCHAR(64),
  probability JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL
);
```

## 📜 Lisensi

Proyek ini dibuat untuk keperluan akademis (skripsi).

## 👨‍💻 Kontributor

- Mahasiswa - SMP PGRI Tambun Selatan
