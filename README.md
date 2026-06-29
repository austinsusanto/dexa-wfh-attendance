---
title: Dexa WFH Attendance
emoji: 🏢
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
short_description: Absensi WFH & Monitoring Karyawan (NestJS + React)
---

<!--
The YAML block above is read by Hugging Face Spaces to configure the demo
deployment (Docker SDK, port 7860). It MUST be the very first thing in this file.
It is harmless on GitHub. See DEPLOYMENT.md ("Hugging Face Spaces") for details.
-->

# dexa-wfh-attendance

Aplikasi Absensi WFH & Monitoring Karyawan — Dexa Group Fullstack Web Technical Test.

Dua aplikasi web yang berbagi satu backend (NestJS) dan satu database (MySQL 8):

| Aplikasi | User | Fungsi |
|---|---|---|
| **Absensi WFH** | Karyawan | Login, absen (timestamp dari server), upload foto bukti WFH, lihat riwayat sendiri |
| **Monitoring Karyawan** | Admin HRD | CRUD master karyawan, monitoring absensi (view-only) |

## Tech Stack

- **Backend:** NestJS + TypeScript, TypeORM, MySQL 8, JWT auth (role-based)
- **Frontend:** React + TypeScript (Vite), React Router, Axios
- **Infra:** Docker Compose (MySQL 8)

## Struktur

```
dexa-wfh-attendance/
├── docker-compose.yml   # MySQL 8
├── backend/             # NestJS API
├── frontend/            # React (Vite) SPA
└── PLAN.md              # rencana kerja lengkap
```

## Setup

### 1. Database (MySQL 8 via Docker)

```bash
cp .env.example .env      # sesuaikan bila perlu
docker compose up -d      # jalankan MySQL
docker compose ps         # pastikan status "healthy"
```

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Lihat [PLAN.md](PLAN.md) untuk detail arsitektur, desain database, dan kontrak API.