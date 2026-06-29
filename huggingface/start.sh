#!/usr/bin/env bash
# =============================================================================
# All-in-one entrypoint for the Hugging Face Spaces demo (single container).
#
# Boots the whole microservices stack inside ONE container, in order:
#   1. MySQL 8 (fresh datadir each start -> ephemeral, resets to seed)
#   2. Create the 3 schemas + the `dexa` app user
#   3. MinIO (object storage for photos) + bucket
#   4. Migrations + seeders (employees -> identity -> attendances)
#   5. The 3 TCP services + the HTTP gateway
#   6. nginx on :7860 (serves the SPA, proxies /api + /uploads to the gateway)
#
# Paths are kept under writable locations so it works whether HF runs us as root
# or as uid 1000.
# =============================================================================
set -euo pipefail

# --- Config (overridable via Space "Variables and secrets") ------------------
export JWT_SECRET="${JWT_SECRET:-hf_demo_secret_change_me}"
export JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-1d}"
DB_USER="dexa"
DB_PASS="${DB_PASSWORD:-dexa_password}"
MINIO_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-minioadmin}"
MINIO_BUCKET="${MINIO_BUCKET:-attendance-photos}"

DATADIR=/tmp/mysql-data
SOCK=/tmp/mysqld.sock
MINIO_DATA=/tmp/minio-data

# mysqld refuses to run as root unless told to; harmless flag when non-root.
USERFLAG=""
if [ "$(id -u)" = "0" ]; then USERFLAG="--user=root"; fi

log() { echo ">>> $*"; }

# --- 1. MySQL ----------------------------------------------------------------
log "Initialising MySQL data directory..."
mkdir -p "$DATADIR" /tmp/mysql-files
mysqld --initialize-insecure --datadir="$DATADIR" $USERFLAG --secure-file-priv=/tmp/mysql-files

log "Starting MySQL..."
mysqld --datadir="$DATADIR" --socket="$SOCK" --port=3306 --bind-address=127.0.0.1 \
	--pid-file=/tmp/mysqld.pid --secure-file-priv=/tmp/mysql-files --mysqlx=0 $USERFLAG &

log "Waiting for MySQL to accept connections..."
for i in $(seq 1 60); do
	if mysql --socket="$SOCK" -uroot -e "SELECT 1" >/dev/null 2>&1; then break; fi
	sleep 1
done
mysql --socket="$SOCK" -uroot -e "SELECT 1" >/dev/null 2>&1 || { echo "MySQL failed to start"; exit 1; }

# --- 2. Schemas + app user ---------------------------------------------------
log "Creating schemas + app user..."
mysql --socket="$SOCK" -uroot <<SQL
CREATE DATABASE IF NOT EXISTS identity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS employees_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS attendances_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED WITH mysql_native_password BY '${DB_PASS}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON *.* TO '${DB_USER}'@'%';
GRANT ALL PRIVILEGES ON *.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

# --- 3. MinIO ----------------------------------------------------------------
log "Starting MinIO..."
mkdir -p "$MINIO_DATA"
MINIO_ROOT_USER="$MINIO_USER" MINIO_ROOT_PASSWORD="$MINIO_PASS" \
	minio server "$MINIO_DATA" --address ":9000" --console-address ":9001" \
	>/tmp/minio.log 2>&1 &

log "Waiting for MinIO..."
for i in $(seq 1 60); do
	if curl -sf http://127.0.0.1:9000/minio/health/ready >/dev/null 2>&1; then break; fi
	sleep 1
done

# --- 4. Migrations + seeders (order matters) ---------------------------------
cd /app/backend
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USERNAME="$DB_USER"
export DB_PASSWORD="$DB_PASS"
export MINIO_ENDPOINT=127.0.0.1
export MINIO_PORT=9000
export MINIO_USE_SSL=false
export MINIO_ACCESS_KEY="$MINIO_USER"
export MINIO_SECRET_KEY="$MINIO_PASS"
export MINIO_BUCKET="$MINIO_BUCKET"

log "Running migrations..."
npm run migration:run -w @dexa/employees
npm run migration:run -w @dexa/identity
npm run migration:run -w @dexa/attendances

log "Seeding (best-effort)..."
( npm run seed -w @dexa/employees \
	&& npm run seed -w @dexa/identity \
	&& npm run seed -w @dexa/attendances ) \
	|| log "Seeding skipped/failed (continuing)."

# --- 5. Application services -------------------------------------------------
log "Starting microservices..."
DB_DATABASE=identity_db TCP_HOST=0.0.0.0 TCP_PORT=4001 \
	EMPLOYEES_TCP_HOST=127.0.0.1 EMPLOYEES_TCP_PORT=4002 \
	node /app/backend/identity/dist/main &

DB_DATABASE=employees_db TCP_HOST=0.0.0.0 TCP_PORT=4002 \
	IDENTITY_TCP_HOST=127.0.0.1 IDENTITY_TCP_PORT=4001 \
	node /app/backend/employees/dist/main &

DB_DATABASE=attendances_db TCP_HOST=0.0.0.0 TCP_PORT=4003 \
	EMPLOYEES_TCP_HOST=127.0.0.1 EMPLOYEES_TCP_PORT=4002 \
	node /app/backend/attendances/dist/main &

log "Waiting for TCP services to listen..."
sleep 6

log "Starting gateway..."
PORT=3000 CORS_ORIGIN="*" \
	IDENTITY_TCP_HOST=127.0.0.1 IDENTITY_TCP_PORT=4001 \
	EMPLOYEES_TCP_HOST=127.0.0.1 EMPLOYEES_TCP_PORT=4002 \
	ATTENDANCES_TCP_HOST=127.0.0.1 ATTENDANCES_TCP_PORT=4003 \
	node /app/backend/gateway/dist/main &

log "Waiting for gateway..."
for i in $(seq 1 60); do
	if curl -sf http://127.0.0.1:3000/api/docs >/dev/null 2>&1; then break; fi
	sleep 1
done

# --- 6. nginx (foreground -> keeps the container alive) ----------------------
log "Starting nginx on :7860..."
exec nginx -c /app/huggingface/nginx.conf -g 'daemon off;'
