# Sistem Absensi

Sistem Absensi berbasis **Laravel** (backend) + **Vite/React** (frontend).

## 📁 Struktur Proyek

```
Sistem-Absensi/
├── backend/        # Laravel API (PHP)
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── resources/
│   └── ...
├── frontend/       # React App (Vite)
│   ├── src/
│   ├── public/
│   └── ...
├── .gitignore
└── README.md
```

## 🚀 Cara Menjalankan

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

> Backend berjalan di: `http://localhost:8000`

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

> Frontend berjalan di: `http://localhost:5173`

## 🛠️ Tech Stack

| Layer    | Teknologi           |
|----------|---------------------|
| Backend  | Laravel 13, PHP 8.3 |
| Frontend | React, Vite         |
| Database | SQLite (default)    |
