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

---

## ⭐ HANDOFF — Status saat ini (untuk sesi/dev berikutnya)

> **Update sesi Tahap 10 (microservices):** monolith sudah DIPECAH menjadi
> microservices (gateway + 3 service TCP + shared lib) dalam npm workspace
> `backend/`. Semua paket meng-compile, infra (MySQL multi-schema + MinIO) jalan,
> migrations + seeders sudah dieksekusi. Monolith lama (`backend/src`, dll.)
> SUDAH DIHAPUS (ada di git history).
>
> **Update sesi berikutnya (smoke test LULUS ✅):** fix compile `request.user`
> (3 file: `common` current-user.decorator + roles.guard, gateway jwt-auth.guard
> → ketik request sebagai `Request & { user?: AuthenticatedUser }`) sudah
> diterapkan; `npm run build` di `backend/` **0 error**. 4 service di-boot
> (identity 4001, employees 4002, attendances 4003, gateway 3000) dan **smoke
> test end-to-end via gateway LULUS SEMUA**:
> - auth: login admin/karyawan 200, `/auth/me` 200, password salah 401.
> - attendances: clock-in 201 + foto ke MinIO & ter-serve di `GET /uploads/*`
>   (200 image/jpeg); double clock-in 409; `GET /attendances/me` 200; monitoring
>   admin 200 **dengan enrichment nama karyawan** (`employees.findByIds`).
> - RBAC: karyawan→GET /attendances 403; admin→POST /attendances 403.
> - employees: list 200; **saga create** (employee + akun identity → user baru
>   bisa login 200); duplikat 409; soft delete 200.
> - nonaktif (9b lintas-service): login nonaktif 403; **mid-session 401** saat
>   karyawan dinonaktifkan selama sesi aktif (query-on-validate).
>
> Data uji yang tertinggal: EMP998/EMP999 (nonaktif) + 1 attendance baru (Budi
> hari ini, id 7) — bersihkan/seed-ulang saat finalisasi (Tahap 12).

### Keputusan arsitektur Tahap 10 (dikonfirmasi user)
- **Struktur:** multi-repo per service, semua di dalam `backend/` sebagai **npm
  workspace** (tiap service paket independen, deps di-hoist & dedupe di
  `backend/node_modules`). Workspace dipilih untuk **dedupe `@nestjs/*`** (lihat
  gotcha di bawah). `backend/package.json` = root workspace (scripts `build`,
  `format`, `test`).
- **Transport:** **NestJS TCP microservice** (`@nestjs/microservices`). Gateway =
  satu-satunya HTTP boundary (`/api/v1`), memanggil service via
  `ClientProxy.send({ cmd }, payload)`. Pola message + kontrak ada di
  `common/src/messaging/`.
- **Database:** 1 MySQL, **multi-schema**: `identity_db`, `employees_db`,
  `attendances_db`. Tanpa FK lintas-service (referensi by id). Tiap service punya
  migration + seeder sendiri.
- **File storage:** **MinIO** (S3-compatible). Attendances service upload foto ke
  bucket `attendance-photos` (key `attendances/<file>`); gateway meng-stream foto
  di `GET /uploads/*` (di luar prefix `/api/v1`) agar URL foto frontend tetap.
- **Cross-service flows:** (1) buat karyawan+user = **saga di Employees service**
  (`EmployeesService.create` → `identity.createUser`; gagal → hard-delete employee
  kompensasi). (2) blokir nonaktif = **query-on-validate**: gateway guard →
  `identity.validateToken` → identity → `employees.getActiveStatus` (login 403,
  mid-session 401 untuk auto-logout). (3) monitoring = **enrichment di Attendances
  service** via `employees.findByIds`.

### Struktur backend baru (`backend/`)
```
backend/
  package.json            # npm workspace root (build/format/test scripts)
  .prettierrc             # useTabs, tabWidth 4 (shared)
  common/                 # @dexa/common — shared lib (BUILT ke common/dist)
    src/{enums,types,utils,transformers,dto,messaging,http}/
      messaging/          # patterns.ts (cmd consts + CLIENT_TOKEN), contracts.ts
                          #   (payload/result DTO antar-service), rpc.ts (RpcError
                          #   + throwRpc/rpc* helpers + sendRpc gateway helper)
      http/               # interceptor, filter, decorators, RolesGuard,
                          #   configure-app, swagger (dipakai gateway)
    package.json          # exports subpaths: @dexa/common/{enums,types,utils,
                          #   transformers,dto,messaging,http}; nest libs = peerDeps
  gateway/                # @dexa/gateway — HTTP /api/v1 (port 3000)
    src/{config,clients,security,auth,employees,attendances,uploads}/
  identity/               # @dexa/identity — TCP 4001 (auth+users, identity_db)
  employees/              # @dexa/employees — TCP 4002 (employees_db)
  attendances/            # @dexa/attendances — TCP 4003 (attendances_db, MinIO)
```
Tiap service: `src/{config,clients,...}`, `main.ts` (createMicroservice TCP,
`import 'dotenv/config'` di baris atas agar `.env` ter-load sebelum baca
`process.env.TCP_PORT`), `database/{data-source.ts,migrations,seeds}`,
`.env.example` + `.env` (gitignored, sudah dibuat = copy dari example).

### Infra & data (SUDAH dijalankan sesi ini)
- `docker-compose.yml` di-update: MySQL 8 (init script `infra/mysql-init/01-create-databases.sql`
  bikin 3 schema + grant user `dexa`) + **MinIO** (`:9000` API, `:9001` console,
  `minioadmin`/`minioadmin`, bucket dibuat otomatis on-demand). Volume:
  `dexa_mysql_data`, `dexa_minio_data`.
- Sudah `docker compose down -v && up -d` (volume lama di-wipe atas izin user).
  Kedua container **healthy**. MySQL di host **:3306**.
- **Migrations + seeders SUDAH dijalankan** (urutan WAJIB: employees → identity →
  attendances, karena identity/attendances mereferensikan employee id 1..4):
  - employees: 4 karyawan (EMP001 Budi … EMP004 Dewi), id 1..4.
  - identity: admin@dexa.com/Admin123 (HRD) + 4 akun karyawan (Employee123),
    employeeId 1..4.
  - attendances: upload `seed-sample.jpg` ke MinIO + 6 absensi (employee 1 & 2).

### Status build/test
- `npm run build` di `backend/` (workspace) meng-compile **common + 4 service** —
  semua OK SEBELUM fix kecil di bawah; setelah hapus monolith & pindah ke workspace,
  `common` gagal di 2 baris `request.user` (fix di bawah). **Belum ada test baru**
  yang diport (Tahap 10.7 / handoff todo).

### ▶ RESUME DI SINI (langkah berikutnya, urut)
1. **FIX compile common** (`npm run build` gagal di sini): Express `Request` tak
   punya `.user` (dulu di-augment oleh tipe passport; guard gateway sekarang custom
   tanpa passport). Edit 2 file → ketik request sebagai `Request & { user?:
   AuthenticatedUser }`:
   - `backend/common/src/http/current-user.decorator.ts` →
     `.getRequest<Request & { user?: AuthenticatedUser }>()`
   - `backend/common/src/http/roles.guard.ts` → sama pada `getRequest<...>()`.
   Lalu `cd backend && npm run build` sampai 0 error, dan
   `node_modules/.bin/prettier --write "common/src/**/*.ts"` (tab).
2. **Start 4 service** (background, dari `backend/`): tiap service
   `cd <svc> && node dist/main` — identity(4001), employees(4002),
   attendances(4003), gateway(3000). (Service sudah bisa boot; gateway sempat error
   `RolesGuard`/Reflector → SUDAH diperbaiki dengan dedupe workspace + SecurityModule
   hanya export `JwtModule`, guard di-resolve on-demand.)
3. **Smoke test end-to-end** via gateway `http://localhost:3000/api/v1`:
   - `POST /auth/login` admin → token; `GET /auth/me`.
   - login budi@dexa.com/Employee123 → `POST /attendances` (multipart `photo`) →
     cek 201 + foto bisa diakses di `GET /uploads/attendances/<file>`.
   - `GET /attendances` (admin) → cek enrichment nama karyawan muncul.
   - `GET /employees`, `POST /employees` (cek saga buat user di identity), dll.
   - cek double clock-in 409, role 403, nonaktif → login 403 / sesi 401.
4. **Port tests** per service (lihat Tahap 10.7) — unit service + e2e gateway.
   Test lama monolith sudah terhapus; perlu ditulis ulang per service (jest config
   sudah ada di tiap `package.json` + `moduleNameMapper` ke `common/dist`).
5. Lanjut **Tahap 11 (deployment)** & **Tahap 12 (finalisasi)**.

### ⚠️ Gotchas penting (jangan terjebak ulang)
- **Dedupe `@nestjs`**: WAJIB satu instance `@nestjs/*` untuk seluruh workspace,
  kalau tidak `instanceof HttpException` (di `sendRpc`/filter) & injeksi `Reflector`
  gagal lintas paket. Karena itu: install `npm install` SEKALI di `backend/` (root
  workspace), JANGAN `npm install` per-paket (bikin `node_modules` nested →
  duplikat). `common` set nest libs sebagai **peerDependencies**.
- **Type-only import**: param ber-`@Payload()`/`@Body()` yang tipenya interface
  HARUS `import type { ... }` (isolatedModules + emitDecoratorMetadata), lihat
  controller2 yang sudah ada.
- **Error lintas TCP**: service lempar `rpc*()` (RpcException pembawa statusCode);
  gateway pakai `sendRpc()` yang menerjemahkan balik ke `HttpException` → envelope
  & status benar. Jangan lempar HttpException langsung di service.
- **Kontrak frontend tetap**: FE pakai `apiOrigin` (`http://localhost:3000`) +
  `photoPath` (`uploads/attendances/<file>`) → gateway HARUS serve `/uploads/*`
  di luar prefix (`app.use('/uploads', ...)` di `gateway/src/main.ts`). FE tidak
  diubah.
- **JWT_SECRET** harus identik di `identity/.env` & `gateway/.env`
  (default contoh: `super_secret_change_me`).
- **Urutan seed**: employees DULU (id 1..4), baru identity & attendances.
- **Port 3306 sempat di-hold proxy docker zombie** — sudah dibersihkan; kalau
  muncul lagi: cari `docker-proxy`/`mysqld` orphan dan kill (butuh root).

**Belum dikerjakan:** fix+smoke test (langkah di atas), tests baru (Tahap 10.7),
deployment (Tahap 11), finalisasi (Tahap 12).

---

### Tahap 10 — Pecah menjadi Microservices 🎯

> **Tujuan:** mengekstrak monolith modular menjadi service-service independen yang
> dapat dideploy & diskalakan terpisah (END GOAL, lihat §2). Dikerjakan di sesi baru.

**10.1 Target arsitektur (usulan — konfirmasi dulu di awal sesi):**
- **Identity Service** (gabungan `auth` + `users`) — login, terbitkan JWT, akun user,
  role. Memiliki tabel `users`.
- **Employees Service** — CRUD karyawan. Memiliki tabel `employees`.
- **Attendances Service** — submit absensi, riwayat, monitoring, upload foto.
  Memiliki tabel `attendances`.
- **API Gateway** — entry tunggal `/api/v1`, routing ke service, verifikasi JWT,
  CORS, teruskan konteks user. (Alternatif gateway: nginx/Traefik atau NestJS gateway.)

  Catatan: `auth` & `users` digabung jadi Identity karena coupling-nya erat; bisa
  dipecah lagi nanti. Tiap modul memang sudah dirancang sebagai calon service (§2).

**10.2 Strategi database (per-service):**
- **Database-per-service**: `identity_db` (users), `employees_db` (employees),
  `attendances_db` (attendances). **Hapus FK lintas-service** — relasi
  `users.employee_id` & `attendances.employee_id` menjadi **referensi by ID saja**
  (tanpa FK DB). Tiap service punya migrations + seeder sendiri.
- (Opsi staging lebih ringan: satu MySQL banyak schema dulu, pisah penuh menyusul.)

**10.3 Komunikasi antar-service (keputusan kunci):**
- **Sync**: REST/HTTP antar-service, atau transport NestJS microservice (TCP/gRPC).
- **Async/event** (disarankan untuk decoupling): message broker (RabbitMQ / NATS /
  Redis). Event penting: `employee.created`, `employee.updated`, `employee.deactivated`.
- **Alur lintas-service yang harus ditangani ulang** (saat ini in-process):
  1. **Buat karyawan + akun login** — Employees buat employee lalu minta Identity
     buat user (`createEmployeeUser`). Perlu **saga/kompensasi** (jika buat user gagal
     → batalkan/hapus employee). Lihat `EmployeesService.create` (sekarang sinkron).
  2. **Blokir akses karyawan nonaktif** (9b) — saat ini Identity (auth) join relasi
     `employee.isActive`. Setelah dipecah: Employees publish `employee.deactivated` →
     Identity simpan status & tolak login/putus sesi; ATAU Identity tanya status ke
     Employees saat login. **Pilih salah satu.**
  3. **Monitoring (absensi + info karyawan)** — Attendances simpan `employeeId` saja.
     Untuk tampilkan nama/NIK: agregasi di Gateway (panggil Employees), ATAU
     Attendances simpan snapshot/cache data karyawan, ATAU denormalisasi. **Pilih.**
- **JWT lintas-service**: secret/kunci sama; Gateway verifikasi lalu teruskan klaim
  (header), atau tiap service punya `JwtAuthGuard` sendiri dengan secret sama.

**10.4 Penyimpanan file (foto absensi):**
- Pindah dari disk lokal (`backend/uploads/`) ke **object storage S3-compatible
  (MinIO untuk self-host / AWS S3)** agar Attendances stateless & scalable. Update
  konfigurasi upload (Multer S3) + URL serve foto. (Alternatif sementara: shared volume.)

**10.5 Struktur kode & shared lib:**
- Disarankan **NestJS monorepo** (`apps/`: gateway, identity, employees, attendances;
  `libs/`: common — envelope interceptor, filter, enum, tipe, guard). Reuse kode yang ada.
- Pindahkan `src/common/*` ke `libs/common`. Tiap app punya `main.ts`, config, migrations.
- (Alternatif: multi-repo per service — lebih berat untuk sesi singkat.)

**10.6 Langkah inkremental yang disarankan:**
1. Konversi `backend/` ke mode **monorepo NestJS** (`nest g app ...`, `libs/common`).
2. Ekstrak modul paling independen lebih dulu (mis. **Attendances**) → app sendiri.
3. Lanjut **Employees**, lalu **Identity** (auth+users).
4. Tambahkan **API Gateway** (routing + auth) di depan.
5. Pisahkan **database per service**; ganti pemanggilan in-process → REST/broker.
6. Pindahkan foto ke **object storage**.
7. Sesuaikan **frontend**: `VITE_API_BASE_URL` tetap menunjuk ke Gateway (kontrak API
   `/api/v1` tidak berubah dari sisi FE bila Gateway menjaga path & envelope).

**10.7 Checklist:** (status sesi ini — lihat HANDOFF & "▶ RESUME DI SINI")
- [x] Konfirmasi batas service + strategi DB + transport + storage. (multi-repo di
      workspace, TCP, multi-schema, MinIO — lihat keputusan di HANDOFF)
- [x] Konversi ke **npm workspace** + `@dexa/common` (BUKAN nest monorepo; pilihan
      user). Monolith lama dihapus.
- [x] Ekstrak Attendances + Employees + Identity menjadi service TCP terpisah.
- [x] API Gateway (routing `/api/v1`, verifikasi JWT, RolesGuard, CORS, envelope,
      Swagger, multipart proxy, serve `/uploads/*` dari MinIO).
- [x] Database per service (multi-schema) + migrations + seeder per service
      (sudah dijalankan).
- [x] Alur lintas-service: saga buat karyawan+user, blokir nonaktif (query-on-validate),
      monitoring enrichment via `employees.findByIds`.
- [x] Foto absensi → MinIO (upload di Attendances, serve di gateway).
- [x] **Smoke test end-to-end LULUS** — fix compile `request.user` (3 file)
      diterapkan; 4 service boot; semua alur (auth, attendances+foto MinIO, RBAC,
      saga employees, nonaktif login 403 / mid-session 401) terverifikasi via
      gateway. Lihat detail di HANDOFF.
- [ ] Tulis ulang test per service (unit service + e2e gateway); pastikan kontrak
      `/api/v1` utuh. (test monolith lama sudah terhapus)

---

### Tahap 11 — Deployment 🚀

> **Tujuan:** menjalankan seluruh sistem microservices (+ frontend) di lingkungan
> yang dapat diakses. Dikerjakan di sesi baru, setelah/seiring Tahap 10.

**11.1 Kontainerisasi:**
- **Dockerfile per service** (multi-stage: build → runtime ramping) untuk Gateway,
  Identity, Employees, Attendances.
- **Dockerfile frontend** (build Vite → serve statis via **nginx**).
- `.dockerignore` (node_modules, dist, .env, uploads).

**11.2 Orkestrasi (pilih sesuai target):**
- **Opsi A — Docker Compose (`docker-compose.prod.yml`)**: gateway, identity,
  employees, attendances, DB masing-masing (atau 1 MySQL multi-schema), **MinIO**,
  **message broker** (bila dipakai), frontend (nginx). Paling cepat untuk staging/VPS.
- **Opsi B — Kubernetes**: Deployment + Service + Ingress + ConfigMap + Secret per
  service; cocok untuk produksi/skalabilitas. (Bisa menyusul setelah Compose jalan.)

**11.3 Konfigurasi & secret:**
- `.env` per service (DB URL, `JWT_SECRET` sama di semua service, `CORS_ORIGIN`,
  kredensial object storage, URL broker, URL antar-service).
- Jangan commit secret asli; sediakan `.env.example` per service.

**11.4 Database & data:**
- MySQL per service (kontainer atau managed). **Jalankan migrations saat deploy**
  (init job/entrypoint) + seeder data demo.

**11.5 Jaringan & keamanan:**
- Hanya **Gateway** & **frontend** yang publik; service lain internal.
- CORS dibatasi di Gateway; HTTPS (reverse proxy/Ingress + TLS).

**11.6 Frontend:**
- Build dengan `VITE_API_BASE_URL` = URL publik Gateway (`…/api/v1`) dan
  `VITE_API_ORIGIN` = origin untuk foto (Gateway/CDN/object storage).
- Serve via nginx (Dockerfile) atau host statis (Vercel/Netlify).

**11.7 Target hosting (usulan, pilih satu):**
- VPS tunggal + Docker Compose (paling sederhana & murah), atau
- PaaS (Railway / Render / Fly.io) per service + DB managed, atau
- Kubernetes (GKE/EKS/DO) untuk produksi penuh.

**11.8 (Opsional) CI/CD:**
- GitHub Actions: lint+test → build image → push registry → deploy.

**11.9 Checklist:**
- [ ] Dockerfile tiap service + frontend (+ `.dockerignore`).
- [ ] `docker-compose.prod.yml` (atau manifest K8s) untuk seluruh stack.
- [ ] `.env.example` per service; secret di-manage aman.
- [ ] Migrations + seeder jalan otomatis saat deploy.
- [ ] Object storage (MinIO/S3) ter-provision + bucket foto.
- [ ] Gateway publik + HTTPS + CORS; service lain internal.
- [ ] Frontend ter-deploy menunjuk ke Gateway.
- [ ] Smoke test end-to-end di lingkungan ter-deploy.

---

### Tahap 12 — Finalisasi
- [ ] README lengkap (arsitektur microservices, diagram, setup lokal & deploy,
      kredensial demo, cara run tiap service, link demo).
- [ ] `.env.example` tiap service & frontend.
- [ ] Bersihkan data uji / seed ulang agar demo bersih (lihat catatan handoff).
- [ ] Uji end-to-end semua alur (lokal & ter-deploy).
- [ ] (Opsional) Diagram arsitektur final + screenshot.

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
