# Dexa Group — Fullstack Web Technical Test
## Plan Pengerjaan: Aplikasi Absensi WFH & Monitoring Karyawan

> Dokumen ini adalah **rencana kerja lengkap** untuk dikerjakan secara bertahap.
> Belum ada kode/project yang dibuat — semua scaffolding dilakukan saat eksekusi
> menggunakan generator resmi (NestJS CLI untuk backend, Vite untuk frontend).

---

## 1. Ringkasan Soal

Membangun **2 aplikasi web** yang berbagi 1 backend + 1 database:

| Aplikasi | User | Fungsi |
|---|---|---|
| **Absensi WFH** | Karyawan | Login, absen (capture tanggal & waktu otomatis dari server), upload foto bukti WFH, lihat riwayat absensi sendiri |
| **Monitoring Karyawan** | Admin HRD | CRUD master data karyawan, kontrol **view-only** atas absensi yang disubmit karyawan |

Karena keduanya berbagi data, dibuat **1 backend dengan role-based access** (`EMPLOYEE` & `HRD_ADMIN`) dan **1 frontend** dengan routing berdasarkan role.

---

## 2. Keputusan Arsitektur (FINAL)

- **Pola:** Monolith Modular NestJS (Opsi A) — dipecah menjadi modul independen (`auth`, `users`, `employees`, `attendances`) yang bersih & siap dipisah menjadi microservice bila perlu. Ini memenuhi "microservices concept" secara modular tanpa kompleksitas message broker.
- **Alasan:** Sesuai timeline 3–5 hari, mengurangi risiko, tetap rapi & profesional.

---

## 3. Tech Stack

### Backend
- **NestJS** + **TypeScript** (di-generate via `@nestjs/cli`)
- **MySQL 8** (kategori "prefer") dijalankan via **Docker Compose**
- **TypeORM** sebagai ORM + migrations
- **JWT** auth (`@nestjs/jwt`, `passport-jwt`) + role-based guard
- **Multer** untuk upload foto absensi
- **class-validator** + **class-transformer** untuk validasi DTO
- **Swagger** (`@nestjs/swagger`) untuk dokumentasi API
- **bcrypt** untuk hashing password

### Frontend
- **React.js** + **TypeScript** (di-generate via **Vite**)
- **React Router** untuk routing & protected routes
- **Axios** untuk HTTP client (dengan interceptor JWT)
- **TanStack Query** (opsional) atau hooks custom untuk data fetching
- **Tailwind CSS** atau **MUI** untuk styling
- **react-webcam** atau Web `getUserMedia` API untuk capture foto kamera

---

## 4. Struktur Project (Target)

```
dexa-wfh-attendance/
├── docker-compose.yml          # MySQL 8
├── README.md                   # cara setup & menjalankan
├── PLAN.md                     # dokumen ini
├── backend/                    # di-generate: nest new backend
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── config/             # env config, typeorm datasource
│       ├── common/             # interceptor (response wrapper), filters, decorators
│       ├── database/           # migrations + seeders
│       ├── auth/               # login, JWT strategy, guards, @Roles
│       ├── users/              # entity users (akun login)
│       ├── employees/          # CRUD master karyawan (HRD only)
│       └── attendances/        # absen karyawan + monitoring HRD
└── frontend/                   # di-generate: npm create vite@latest frontend
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/                # axios instance + service per domain
        ├── context/            # AuthContext (token, user, role)
        ├── components/         # custom components reusable
        ├── pages/
        │   ├── auth/           # Login
        │   ├── employee/       # Dashboard absen, riwayat
        │   └── hrd/            # CRUD karyawan, monitoring absensi
        └── routes/             # ProtectedRoute + role-based routing
```

---

## 5. Desain Database (MySQL)

### Tabel `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | |
| email | VARCHAR(150) UNIQUE | dipakai login |
| password | VARCHAR(255) | bcrypt hash |
| role | ENUM('EMPLOYEE','HRD_ADMIN') | role-based access |
| employee_id | BIGINT FK → employees.id NULL | admin bisa tanpa employee |
| created_at / updated_at | TIMESTAMP | |

### Tabel `employees`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | |
| employee_number | VARCHAR(30) UNIQUE | NIK / NIP |
| full_name | VARCHAR(150) | |
| position | VARCHAR(100) | jabatan |
| department | VARCHAR(100) | departemen |
| email | VARCHAR(150) UNIQUE | |
| phone | VARCHAR(20) | |
| is_active | BOOLEAN DEFAULT true | soft-disable |
| created_at / updated_at | TIMESTAMP | |

### Tabel `attendances`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | |
| employee_id | BIGINT FK → employees.id | |
| attendance_date | DATE | untuk query/filter & unique check |
| checked_in_at | TIMESTAMP | **diisi server**, bukan dari client |
| photo_path | VARCHAR(255) | path foto bukti WFH |
| type | ENUM('CLOCK_IN','CLOCK_OUT') DEFAULT 'CLOCK_IN' | |
| latitude / longitude | DECIMAL(10,7) NULL | opsional bukti lokasi |
| notes | VARCHAR(255) NULL | opsional |
| created_at | TIMESTAMP | |

**Relasi & aturan:**
- `users (1) ── (1) employees`
- `employees (1) ── (N) attendances`
- Unique index `(employee_id, attendance_date, type)` → cegah double clock-in di hari yang sama.
- `checked_in_at` **selalu di-generate server** (`new Date()`) — tidak dipercaya dari client (sesuai soal "capture tanggal & waktu").

---

## 6. Kontrak API

Konvensi:
- Base URL: `/api/v1`
- Response envelope: `{ "success": boolean, "message": string, "data": ... }`
- Auth header: `Authorization: Bearer <token>`
- Error: `{ "success": false, "message": "...", "errors": [...] }`

### 6.1 Auth
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| POST | `/api/v1/auth/login` | publik | body `{ email, password }` → `{ accessToken, user }` |
| GET | `/api/v1/auth/me` | login | profil user dari token |

### 6.2 Employees (role: `HRD_ADMIN`)
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/employees?search=&page=&limit=` | list + pagination + search |
| GET | `/api/v1/employees/:id` | detail |
| POST | `/api/v1/employees` | create employee + akun user EMPLOYEE sekaligus (`initialPassword`) |
| PUT | `/api/v1/employees/:id` | update data |
| DELETE | `/api/v1/employees/:id` | soft delete (`is_active=false`) agar histori absensi aman |

### 6.3 Attendances
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| POST | `/api/v1/attendances` | EMPLOYEE | `multipart/form-data`: `photo` (wajib), `type?`, `latitude?`, `longitude?`, `notes?`. Server isi `checked_in_at` & `attendance_date`. Tolak double clock-in (`409`) |
| GET | `/api/v1/attendances/me?from=&to=&page=&limit=` | EMPLOYEE | riwayat absensi sendiri |
| GET | `/api/v1/attendances?employeeId=&date=&from=&to=&type=&page=&limit=` | HRD_ADMIN | monitoring semua absensi (**view only**) |
| GET | `/api/v1/attendances/:id` | HRD / pemilik | detail termasuk foto |

> HRD **tidak punya** endpoint create/update/delete absensi → menegakkan "view only".

### 6.4 Matriks Hak Akses
| Endpoint | EMPLOYEE | HRD_ADMIN |
|---|---|---|
| auth/login, auth/me | ✅ | ✅ |
| employees (CRUD) | ❌ | ✅ |
| POST attendances | ✅ | ❌ |
| GET attendances/me | ✅ | ❌ |
| GET attendances (semua) | ❌ | ✅ (view only) |

---

## 7. Rencana Frontend (React)

### Halaman Karyawan (`EMPLOYEE`)
- **Login** — form email/password.
- **Dashboard Absen** — tampilkan tanggal & jam realtime, komponen kamera untuk capture foto, tombol "Absen Sekarang". Status apakah sudah absen hari ini.
- **Riwayat Absensi** — tabel/list absensi sendiri + filter tanggal.

### Halaman Admin HRD (`HRD_ADMIN`)
- **Login** — sama, redirect berdasarkan role.
- **Master Karyawan** — tabel + search + pagination; form Create/Update; aksi Delete (soft).
- **Monitoring Absensi** — tabel view-only semua absensi + filter (karyawan, tanggal); preview foto bukti.

### Custom Components (memenuhi objektif "create custom component")
- `<ProtectedRoute roles={[...]}/>` — guard berbasis role.
- `<PhotoCapture/>` — akses kamera (`getUserMedia`) + preview + retake.
- `<DataTable/>` — tabel reusable dengan kolom konfigurabel + pagination.
- `<FormInput/>` / `<FormField/>` — input dengan label & error.
- `<Modal/>` — dialog form karyawan.
- `<Badge/>` — status (Active/Inactive, Clock-in/out).

### State Management
- `AuthContext` menyimpan `token` + `user` (persist di `localStorage`).
- Axios interceptor menyisipkan `Authorization` header & handle `401` (auto-logout).

---

## 8. Urutan Pengerjaan Bertahap (Checklist)

### Tahap 0 — Inisialisasi
- [ ] Buat `docker-compose.yml` (MySQL 8) dan jalankan `docker compose up -d`.
- [ ] Generate backend: `npx @nestjs/cli new backend`.
- [ ] Generate frontend: `npm create vite@latest frontend -- --template react-ts`.

### Tahap 1 — Backend Fondasi
- [ ] Install deps: typeorm, mysql2, @nestjs/config, @nestjs/jwt, passport, passport-jwt, bcrypt, class-validator, class-transformer, @nestjs/swagger, multer types.
- [ ] Setup `ConfigModule` + `.env` (DB, JWT_SECRET, UPLOAD_DIR).
- [ ] Setup TypeORM datasource + koneksi.
- [ ] Common: response interceptor (envelope), exception filter, `@Roles` decorator, `RolesGuard`, `JwtAuthGuard`.

### Tahap 2 — Entity & Database
- [ ] Buat entity `User`, `Employee`, `Attendance` + relasi.
- [ ] Generate & jalankan migration.
- [ ] Seeder: 1 akun HRD admin + beberapa karyawan + sample absensi.

### Tahap 3 — Modul Auth
- [ ] `AuthService.login` (validasi user, bcrypt compare, sign JWT).
- [ ] `JwtStrategy` + `JwtAuthGuard`.
- [ ] Endpoint `login` & `me`.

### Tahap 4 — Modul Employees (HRD only)
- [ ] DTO `CreateEmployeeDto`, `UpdateEmployeeDto` + validasi.
- [ ] Service CRUD (+ buat user EMPLOYEE saat create).
- [ ] Controller dengan `@Roles('HRD_ADMIN')`.
- [ ] Pagination + search.

### Tahap 5 — Modul Attendances
- [ ] Konfigurasi Multer (storage, filename, filter jpg/png, limit 5MB).
- [ ] `POST /attendances` (EMPLOYEE) — set timestamp server, cek double clock-in.
- [ ] `GET /attendances/me` (EMPLOYEE).
- [ ] `GET /attendances` + `GET /attendances/:id` (HRD view-only).
- [ ] Static serve folder `/uploads`.

### Tahap 6 — Dokumentasi Backend
- [ ] Setup Swagger di `/api/docs`.
- [ ] Anotasi DTO & endpoint.

### Tahap 7 — Frontend Fondasi
- [ ] Setup Tailwind/MUI, React Router, Axios instance + interceptor.
- [ ] `AuthContext` + `ProtectedRoute` (role-based).
- [ ] Service API per domain (auth, employees, attendances).

### Tahap 8 — Halaman Karyawan
- [ ] Login (redirect by role).
- [ ] Dashboard absen + `<PhotoCapture/>` + submit multipart.
- [ ] Riwayat absensi sendiri.

### Tahap 9 — Halaman HRD
- [ ] Master karyawan (tabel + modal form CRUD).
- [ ] Monitoring absensi view-only + filter + preview foto.

### Tahap 10 — Finalisasi
- [ ] README lengkap (setup, kredensial demo, cara run, screenshot opsional).
- [ ] `.env.example` backend & frontend.
- [ ] Uji end-to-end semua alur.
- [ ] (Opsional) Dockerfile backend+frontend untuk run sekali jalan.

---

## 9. Deliverable Akhir
- README jelas: cara setup BE+FE + kredensial demo.
- Swagger/OpenAPI di `/api/docs`.
- `.env.example` & script seed data demo.
- Source code rapi, modular, ber-validasi, role-based.
- (Opsional) Docker Compose full-stack agar reviewer mudah menjalankan.

---

## 10. Kredensial Demo (rencana seeder)
| Role | Email | Password |
|---|---|---|
| HRD Admin | `admin@dexa.com` | `Admin123` |
| Karyawan | `budi@dexa.com` | `Employee123` |

---

## 11. Catatan Teknis Penting
- **Timestamp server**: `checked_in_at` & `attendance_date` selalu diisi backend, tidak dari client → integritas data absensi.
- **Foto bukti WFH**: disimpan di `backend/uploads/attendances/`, path direferensikan di DB, di-serve statis.
- **View-only HRD**: ditegakkan di level routing/guard — HRD tidak punya endpoint mutasi absensi.
- **Soft delete karyawan**: jaga histori absensi tetap valid.
- **Keamanan**: password di-hash bcrypt, JWT expiry, validasi semua input, CORS dibatasi ke origin frontend.
