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

# Dexa WFH Attendance

Aplikasi **Absensi WFH & Monitoring Karyawan** — Dexa Group Fullstack Web Technical Test.

Dua aplikasi web dalam satu frontend (routing by role) di atas backend
**microservices**:

| Aplikasi | User | Fungsi |
|---|---|---|
| **Absensi WFH** | Karyawan | Login, absen (timestamp & tanggal dari server), upload foto bukti WFH, lihat riwayat sendiri |
| **Monitoring Karyawan** | Admin HRD | CRUD master karyawan, monitoring absensi (**view-only**) |

## 🔗 Demo Live

- **URL:** https://austinsusanto-dexa-wfh-attendance.hf.space (Hugging Face Spaces)
- **API docs (Swagger):** `…/api/docs`

| Role | Email | Password |
|---|---|---|
| HRD Admin | `admin@dexa.com` | `Admin123` |
| Karyawan | `budi@dexa.com` | `Employee123` |

> Storage demo bersifat ephemeral — data di-reset ke seed setiap container restart.

## Arsitektur

Sistem dipecah menjadi **service-service independen** (database-per-service,
tanpa FK lintas-service) yang berkomunikasi via **NestJS TCP microservice**.
**Gateway adalah satu-satunya HTTP boundary** (`/api/v1`) — memverifikasi JWT,
menegakkan role, lalu meneruskan ke service via `ClientProxy.send({ cmd }, ...)`.

```
                 ┌─────────────┐
  Browser ─HTTP─▶│   Gateway   │  /api/v1  (JWT verify, RolesGuard, CORS, envelope, Swagger)
   (React SPA)   │  :3000 HTTP │  /uploads/* (stream foto dari MinIO)
                 └──────┬──────┘
                        │ TCP (cmd + payload)
        ┌───────────────┼───────────────────┐
        ▼               ▼                     ▼
  ┌──────────┐    ┌───────────┐        ┌──────────────┐
  │ identity │    │ employees │        │ attendances  │
  │  :4001   │    │   :4002   │        │    :4003     │
  │ auth+JWT │    │  CRUD     │        │ absensi+foto │
  │ users    │    │ karyawan  │        │ monitoring   │
  └────┬─────┘    └─────┬─────┘        └──────┬───────┘
       │ identity_db    │ employees_db        │ attendances_db   ── MySQL 8 (multi-schema)
       └────────────────┴─────────────────────┘
                                               └── MinIO (S3) bucket attendance-photos
```

**Alur lintas-service:**
- **Buat karyawan + akun login** = saga di Employees (`create` → minta Identity buat
  user; gagal → hard-delete employee sebagai kompensasi).
- **Blokir karyawan nonaktif** = query-on-validate: gateway guard → Identity
  `validateToken` → Identity tanya status ke Employees (`getActiveStatus`). Login
  ditolak `403`; sesi berjalan diputus `401` (auto-logout di FE).
- **Monitoring** = enrichment di Attendances via `employees.findByIds` (Attendances
  hanya simpan `employeeId`).

## Tech Stack

- **Backend:** NestJS + TypeScript, TypeORM, MySQL 8, `@nestjs/microservices` (TCP),
  JWT (role-based), MinIO (S3-compatible), class-validator, Swagger, bcrypt.
- **Frontend:** React + TypeScript (Vite), React Router, Axios (interceptor JWT +
  auto-logout 401), Tailwind CSS.
- **Infra:** Docker Compose (MySQL multi-schema + MinIO). Deploy: image all-in-one
  (Hugging Face Spaces) atau multi-container + Caddy (VM).

## Struktur

```
dexa-wfh-attendance/
├── docker-compose.yml        # dev: MySQL 8 (multi-schema) + MinIO
├── docker-compose.prod.yml   # prod: seluruh stack + Caddy (lihat DEPLOYMENT.md)
├── Dockerfile                # image all-in-one (Hugging Face Spaces)
├── infra/mysql-init/         # init 3 schema + grant
├── backend/                  # npm workspace
│   ├── common/               # @dexa/common — enum, tipe, util, messaging, http (shared)
│   ├── gateway/              # @dexa/gateway — HTTP /api/v1 (:3000)
│   ├── identity/             # @dexa/identity — auth+users (TCP :4001, identity_db)
│   ├── employees/            # @dexa/employees — CRUD karyawan (TCP :4002, employees_db)
│   └── attendances/          # @dexa/attendances — absensi+foto (TCP :4003, attendances_db, MinIO)
├── frontend/                 # React (Vite) SPA
├── DEPLOYMENT.md             # runbook deploy (HF Spaces & VM)
└── PLAN.md                   # rencana kerja + handoff lengkap
```

## Menjalankan secara Lokal (dev)

**Prasyarat:** Node 20+, Docker.

### 1. Infra (MySQL multi-schema + MinIO)

```bash
docker compose up -d        # MySQL :3306 (3 schema) + MinIO :9000/:9001
docker compose ps           # tunggu status "healthy"
```

### 2. Install dependency (SEKALI di root workspace)

```bash
cd backend
npm install                 # hoist & dedupe — JANGAN install per-paket
npm run build:common        # @dexa/common di-compile ke common/dist
```

> `.env` tiap service sudah disediakan sebagai `.env.example` — copy bila perlu
> (`cp <svc>/.env.example <svc>/.env`). `JWT_SECRET` harus **identik** di
> `identity/.env` & `gateway/.env`.

### 3. Migration + Seed (urutan WAJIB: employees → identity → attendances)

```bash
# employees DULU (id 1..4 dirujuk identity & attendances)
npm run migration:run -w @dexa/employees   && npm run seed -w @dexa/employees
npm run migration:run -w @dexa/identity    && npm run seed -w @dexa/identity
npm run migration:run -w @dexa/attendances && npm run seed -w @dexa/attendances
```

### 4. Jalankan service (4 terminal, dari `backend/`)

```bash
npm run start:dev -w @dexa/identity      # TCP :4001
npm run start:dev -w @dexa/employees     # TCP :4002
npm run start:dev -w @dexa/attendances   # TCP :4003
npm run start:dev -w @dexa/gateway       # HTTP :3000  (satu-satunya HTTP)
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev                 # Vite :5173 → proxy ke gateway :3000
```

Buka http://localhost:5173 dan login dengan kredensial demo di atas.

## Test

Dari `backend/` (unit per service + e2e gateway):

```bash
npm test                    # identity + employees + attendances (unit) + gateway (e2e)
```

48 test: unit service (mock repo/ClientProxy/storage) + e2e gateway (supertest
mem-boot AppModule asli dengan 3 ClientProxy di-mock — menguji routing, validasi,
guard/RBAC, dan response envelope tanpa service live).

## Deployment

Lihat **[DEPLOYMENT.md](DEPLOYMENT.md)** untuk dua jalur:
- **Hugging Face Spaces** (live, gratis, tanpa kartu) — image all-in-one via root
  `Dockerfile`. Deploy = `git push` ke remote `space`.
- **VM + Docker Compose** (`docker-compose.prod.yml` + Caddy HTTPS) — multi-container
  penuh, hanya gateway & frontend yang publik.

## Catatan Teknis

- **Timestamp server:** `checked_in_at` & `attendance_date` selalu diisi backend
  (bukan dari client). "Hari ini" dihitung di **business timezone WIB
  (`Asia/Jakarta`)** secara eksplisit di FE & BE → tanggal absensi konsisten
  tanpa bergantung timezone container/browser.
- **View-only HRD:** ditegakkan di routing/guard — HRD tidak punya endpoint mutasi
  absensi.
- **Soft delete karyawan:** `is_active=false` menjaga histori absensi **dan**
  memblokir akses (tak bisa login / submit; sesi berjalan diputus).
- **Keamanan:** password bcrypt, JWT expiry, validasi semua input, CORS dibatasi ke
  origin frontend di gateway.
