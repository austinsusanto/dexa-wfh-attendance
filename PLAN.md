# Dexa Group — Fullstack Web Technical Test
## Plan Pengerjaan: Aplikasi Absensi WFH & Monitoring Karyawan

> Dokumen ini adalah **rencana kerja lengkap** untuk dikerjakan secara bertahap.
> Belum ada kode/project yang dibuat — semua scaffolding dilakukan saat eksekusi
> menggunakan generator resmi (NestJS CLI untuk backend, Vite untuk frontend).

---

## 0. Konvensi Kode (WAJIB diikuti di semua kode)

Aturan ini **mengikat untuk seluruh kode** (backend & frontend) yang dibuat ke depan:

1. **Indentasi memakai TAB**, dengan lebar 1 tab = **4 spasi**.
   - Berlaku untuk semua file kode (`.ts`, `.tsx`, `.json`, dll).
   - **Pengecualian:** YAML (`.yml`/`.yaml`) tidak boleh memakai tab — gunakan 4 spasi.
   - Ditegakkan via `.editorconfig` (root) + Prettier (`useTabs: true`, `tabWidth: 4`).
2. **Setiap `interface`/`type` ditaruh di file khusus tipe**, terpisah dari logika.
   - Konvensi nama: `*.types.ts` (mis. `config.types.ts`, `auth.types.ts`).
   - File logika meng-`import` tipe dari file tipe tersebut, **tidak** mendeklarasikan
     `interface`/`type` inline di file implementasi.
   - Tujuan: tipe mudah ditemukan, di-reuse, dan dipisah dari implementasi.
3. **Penamaan file mengikuti idiom NestJS** (suffix sesuai peran):
   `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.guard.ts`, `*.filter.ts`,
   `*.interceptor.ts`, `*.decorator.ts`, `*.entity.ts`, `*.dto.ts`, `*.enum.ts`.
4. **Enum dikelompokkan per modul dalam satu file `*.enum.ts`** (bukan satu file per
   enum). Enum lintas-modul ditaruh di `src/common/enums/app.enum.ts`.

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

- **Tujuan akhir (END GOAL): deploy sebagai MICROSERVICES**, bukan monolith. Sistem
  akhirnya terdiri dari beberapa service independen yang dapat dideploy & diskalakan
  terpisah. Monolith modular hanyalah **tahap antara** menuju ke sana.
- **Strategi:** mulai sebagai **Monolith Modular NestJS** dengan modul yang benar-benar
  independen (`auth`, `users`, `employees`, `attendances`), lalu **diekstrak menjadi
  service terpisah**. Setiap modul dirancang sejak awal agar siap dipecah.
- **Prinsip agar siap diekstrak menjadi service:**
  - Batas modul tegas; tidak ada logika bisnis yang bocor lintas modul.
  - Komunikasi lintas modul lewat interface/service yang jelas (kelak jadi RPC/message
    broker), bukan akses langsung ke internal modul lain.
  - Relasi entity lintas modul (`User`↔`Employee`↔`Attendance` FK) diperlakukan sebagai
    **kemudahan fase monolith**; saat dipecah menjadi referensi antar-service via ID
    (tanpa FK DB lintas-service), tiap service punya DB/koneksi sendiri.
  - Konfigurasi DB & wiring dibuat per-modul agar mudah dipindah ke service masing-masing.
- **Alasan bertahap:** sesuai timeline 3–5 hari — mengurangi risiko, tetap rapi &
  profesional, sambil menjaga jalur ekstraksi ke microservices tetap terbuka.

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
| id | INT PK AUTO_INCREMENT | |
| email | VARCHAR(150) UNIQUE | dipakai login |
| password | VARCHAR(255) | bcrypt hash |
| role | ENUM('EMPLOYEE','HRD_ADMIN') | role-based access |
| employee_id | INT FK → employees.id NULL | admin bisa tanpa employee |
| created_at / updated_at | TIMESTAMP | |

### Tabel `employees`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
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
| id | INT PK AUTO_INCREMENT | |
| employee_id | INT FK → employees.id | |
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

### Tahap 0 — Inisialisasi ✅
- [x] Buat `docker-compose.yml` (MySQL 8) dan jalankan `docker compose up -d`. (healthy di `:3306`)
- [x] Generate backend: `npx @nestjs/cli new backend`.
- [x] Generate frontend: `npm create vite@latest frontend -- --template react-ts`.

### Tahap 1 — Backend Fondasi ✅
- [x] Install deps: typeorm, mysql2, @nestjs/config, @nestjs/jwt, passport, passport-jwt, bcrypt, class-validator, class-transformer, @nestjs/swagger, multer types. (+ dotenv)
- [x] Setup `ConfigModule` + `.env` (DB, JWT_SECRET, UPLOAD_DIR). (validasi env fail-fast di `configuration.ts`)
- [x] Setup TypeORM datasource + koneksi. (`typeorm.config.ts` runtime + `database/data-source.ts` untuk CLI migrasi)
- [x] Common: response interceptor (envelope), exception filter, `@Roles` decorator, `RolesGuard`, `JwtAuthGuard`. (+ `@ResponseMessage`, enum `UserRole`, tipe `ApiResponse`/`JwtPayload`)

### Tahap 2 — Entity & Database ✅
- [x] Buat entity `User`, `Employee`, `Attendance` + relasi. (PK `INT`; password `select:false`; unique index `(employee_id, attendance_date, type)`; transformer numerik untuk lat/long)
- [x] Generate & jalankan migration. (`InitSchema` — 3 tabel + FK; applied)
- [x] Seeder: 1 akun HRD admin + beberapa karyawan + sample absensi. (1 admin + 4 karyawan + 6 absensi; idempotent)

### Tahap 3 — Modul Auth ✅
- [x] `AuthService.login` (validasi user, bcrypt compare, sign JWT). (+ `UsersService` & `UsersModule`, pesan error seragam)
- [x] `JwtStrategy` + `JwtAuthGuard`. (strategy verifikasi token + cek user masih ada; `@CurrentUser()` decorator)
- [x] Endpoint `login` & `me`. (teruji: login valid/invalid, me dengan/tanpa token)
- [x] **Swagger di-pull-forward dari Tahap 6** untuk uji interaktif `/api/docs` (lihat Tahap 6).
- [x] Hapus boilerplate scaffold (`AppController`/`AppService` "Hello World").
- [x] Struktur test disiapkan: `configureApp` dipakai bersama `main.ts` & test;
      unit co-located (`src/auth/auth.service.spec.ts`), e2e per-domain
      (`test/auth/auth.e2e-spec.ts`) + helper `test/utils/create-test-app.ts`.
      Lulus: unit 3/3, e2e 5/5.

### Tahap 4 — Modul Employees (HRD only) ✅
- [x] DTO `CreateEmployeeDto`, `UpdateEmployeeDto` (+ `EmployeeQueryDto`) + validasi. (`UpdateEmployeeDto` via PartialType+OmitType; email & password immutable di update)
- [x] Service CRUD (+ buat user EMPLOYEE saat create via `UsersService`, cek duplikat → 409). (soft delete `is_active=false`)
- [x] Controller dengan `@Roles('HRD_ADMIN')` (+ `JwtAuthGuard`+`RolesGuard` di level class). (teruji: 401/403/404/409/400)
- [x] Pagination + search. (reusable `PaginationQueryDto`/`PaginatedResult`; search LIKE multi-kolom)
- [x] Tests: unit `employees.service.spec` + e2e `test/employees` (lulus unit 7/7, e2e 10/10).

### Tahap 5 — Modul Attendances ✅
- [x] Konfigurasi Multer (storage, filename, filter jpg/png, limit 5MB). (`attendance-upload.config.ts`; via `MulterModule.registerAsync`)
- [x] `POST /attendances` (EMPLOYEE) — set timestamp server, cek double clock-in. (`checked_in_at`/`attendance_date` dari server; 409 double + hapus file orphan)
- [x] `GET /attendances/me` (EMPLOYEE). (pagination + filter `from`/`to`)
- [x] `GET /attendances` + `GET /attendances/:id` (HRD view-only). (list HRD-only + filter; detail HRD atau pemilik, employee lain → 403)
- [x] Static serve folder `/uploads`. (`useStaticAssets`, di luar prefix `/api/v1`)
- [x] Tests: unit `attendances.service.spec` + e2e `test/attendances` (lulus unit 12/12, e2e 17/17).

### Tahap 6 — Dokumentasi Backend (sebagian — di-pull-forward ke Tahap 3)
- [x] Setup Swagger di `/api/docs`. (`swagger.config.ts`; bearer auth + persistAuthorization;
      server kosong karena prefix `/api/v1` sudah ikut di path operasi)
- [~] Anotasi DTO & endpoint. (auth selesai: `LoginDto`, `@ApiOperation`, `@ApiBearerAuth`;
      endpoint employees & attendances dianotasi saat modulnya dibuat di Tahap 4–5)

### Tahap 7 — Frontend Fondasi ✅
- [x] Setup Tailwind (v4) + token Dexa, React Router (v7), Axios instance + interceptor (JWT + auto-logout 401).
- [x] `AuthContext` (AuthProvider + `useAuth`) + `ProtectedRoute` (role-based) + redirect by role.
- [x] Service API per domain (auth, employees, attendances) + tipe domain + env config.
- [x] Skeleton routing + placeholder semua halaman (diisi per-halaman di Tahap 8–9). Build & dev server OK.

### Tahap 8 — Halaman Karyawan ✅
- [x] Login (redirect by role). (split-panel brand, akun demo quick-fill, show/hide password)
- [x] Dashboard absen + `<PhotoCapture/>` + submit multipart. (kamera `getUserMedia` + fallback unggah; live clock; aksi Clock In/Out otomatis dari status hari ini; lokasi best-effort otomatis; toast)
- [x] Riwayat absensi sendiri. (filter tanggal, tabel desktop + card mobile, pagination, modal foto)

### Tahap 9 — Halaman HRD ✅
- [x] Data Karyawan (tabel + modal form CRUD). (shell sidebar admin; search debounce; create/edit + email read-only saat edit; nonaktifkan via ConfirmDialog; teruji)
- [x] Monitoring absensi view-only + filter + preview foto. (filter karyawan/tanggal/tipe; tabel desktop + card mobile; link lokasi; pagination; riwayat karyawan nonaktif tetap tampil)

### Tahap 9b — Perbaikan: akses karyawan nonaktif (backend) ✅
- [x] Tolak login karyawan yang `is_active=false` (`AuthService.login` → 403 "Akun Anda telah dinonaktifkan. Hubungi HRD.").
- [x] `JwtStrategy.validate` cek `employee.isActive` → sesi aktif diputus saat dinonaktifkan (401 → auto-logout di FE).
- [x] Auth lookups join relasi `employee`; unit test (login aktif/nonaktif) + verifikasi live. Lulus unit 14/14, e2e 17/17.
- [x] (Catatan) ditemukan saat Tahap 9: soft delete sebelumnya hanya menyembunyikan karyawan, belum memblokir akses.

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
- **Soft delete karyawan**: jaga histori absensi tetap valid **dan** blokir akses
  karyawan nonaktif (tidak bisa login / submit absensi) — lihat Tahap 9b.
- **Keamanan**: password di-hash bcrypt, JWT expiry, validasi semua input, CORS dibatasi ke origin frontend.
