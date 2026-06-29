# Deployment Runbook — Dexa WFH Attendance (Tahap 11)

Two supported paths to a clickable, public demo:

- **Option A — Hugging Face Spaces** (no credit card, free): a single all-in-one
  container. Easiest to get live. **See [Hugging Face Spaces](#option-b--hugging-face-spaces-free-no-card) below.**
- **Option B — VM + Docker Compose** (Oracle Cloud Always Free / any VPS): the
  real multi-container microservices deployment behind Caddy. Best fidelity; needs
  a card for the cloud account. That's the rest of this document.

> Both reuse the same source; the all-in-one image is built by the root
> `Dockerfile`, the multi-container stack by `docker-compose.prod.yml`.

---

This guide deploys the whole microservices system behind a single HTTPS URL on a
**free, always-on VM** so a reviewer can just click a link in the browser — no
Docker or tooling on their side.

**Target stack (free + durable):**

- **Oracle Cloud Always Free** ARM VM (never expires, enough RAM for the whole stack)
- **DuckDNS** free subdomain → the VM's public IP
- **Caddy** reverse proxy with automatic Let's Encrypt HTTPS
- One command: `docker compose -f docker-compose.prod.yml up -d --build`

```
Internet ──HTTPS──> Caddy ──/api,/uploads──> gateway ──TCP──> identity / employees / attendances
                      └──────everything else──> frontend (nginx SPA)
                                         backing: MySQL (3 schemas) + MinIO
```

Everything is internal except Caddy (ports 80/443). The one-shot `migrate`
container runs migrations + seeders (order: employees → identity → attendances)
before the services start.

---

## What's already prepared in this repo

| File | Purpose |
|---|---|
| `backend/Dockerfile` | Multi-stage, multi-target build for all 4 services (+ builder used by `migrate`) |
| `frontend/Dockerfile` + `frontend/nginx.conf` | Build Vite SPA → serve via nginx |
| `docker-compose.prod.yml` | Full production stack (project name `dexa-wfh-prod`) |
| `Caddyfile` | Single public entry: HTTPS + routing |
| `.env.prod.example` | Template for secrets + domain (copy → `.env.prod`) |
| `infra/mysql-init/01-create-databases.sql` | Creates the 3 schemas on first boot |

> The local prod stack has already been **smoke-tested end-to-end** (auth, RBAC,
> multipart clock-in, double clock-in 409, photo serving, monitoring enrichment,
> frontend SPA). The same images are what runs on the VM.

---

## Step 1 — Create a DuckDNS subdomain (free, ~2 min)

1. Go to <https://www.duckdns.org> and sign in (GitHub/Google).
2. Pick a subdomain, e.g. `dexa-wfh` → you get `dexa-wfh.duckdns.org`.
3. Leave the IP blank for now; you'll set it after the VM exists (Step 2.5).

## Step 2 — Provision the Oracle Cloud Always Free VM (~15 min)

1. Create a free account at <https://www.oracle.com/cloud/free/> (needs a card for
   identity check; Always Free resources are **not** charged).
2. **Create a Compute instance:**
   - Shape: **Ampere A1 (ARM)** — e.g. 2 OCPU / 12 GB (within Always Free). If ARM
     shows "out of capacity", retry later/another AD, or use an AMD `VM.Standard.E2.1.Micro`
     (1 GB RAM is tight — prefer ARM).
   - Image: **Canonical Ubuntu 22.04**.
   - Add your SSH public key.
3. **Open the firewall** (two layers):
   - **VCN Security List / NSG:** add Ingress rules allowing TCP **80** and **443**
     from `0.0.0.0/0` (SSH 22 is open by default).
   - **OS firewall** (Ubuntu uses iptables on Oracle images):
     ```bash
     sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
     sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
     sudo netfilter-persistent save
     ```
2.5. **Point DuckDNS at the VM:** copy the instance's **public IPv4**, go back to
   DuckDNS, paste it into your domain's IP field, click **update**.

## Step 3 — Install Docker on the VM (~5 min)

SSH in (`ssh ubuntu@<public-ip>`), then:

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker   # run docker without sudo
```

## Step 4 — Get the code + configure secrets

```bash
git clone <your-repo-url> dexa-wfh-attendance
cd dexa-wfh-attendance
cp .env.prod.example .env.prod
nano .env.prod
```

In `.env.prod` set at minimum:

- `DOMAIN=dexa-wfh.duckdns.org` (your subdomain — **must** resolve to the VM for
  HTTPS to be issued)
- `JWT_SECRET=` a long random string — generate with `openssl rand -hex 32`
- `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `MINIO_ROOT_PASSWORD` — strong values

Leave `VITE_API_BASE_URL=/api/v1` and `VITE_API_ORIGIN=` empty (single-origin).

## Step 5 — Deploy 🚀

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

First run builds the images (a few minutes on ARM) and starts everything. Watch it:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f caddy   # cert issuance
```

When Caddy logs `certificate obtained successfully`, open:

- **App:** `https://dexa-wfh.duckdns.org`
- **API docs:** `https://dexa-wfh.duckdns.org/api/docs`

## Step 6 — Verify (smoke test on the VM)

```bash
D=https://dexa-wfh.duckdns.org
curl -s -X POST $D/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@dexa.com","password":"Admin123"}'
```

Then log in via the browser with the demo credentials below and submit an attendance.

---

## Demo credentials (seeded)

| Role | Email | Password |
|---|---|---|
| HRD Admin | `admin@dexa.com` | `Admin123` |
| Employee | `budi@dexa.com` | `Employee123` |

(Other employees: `siti@`, `andi@`, `dewi@` — all `Employee123`.)

---

## Operations cheat-sheet

```bash
C="docker compose -f docker-compose.prod.yml --env-file .env.prod"

$C ps                       # status
$C logs -f gateway          # tail a service
$C up -d --build            # redeploy after a git pull (migrations re-run idempotently)
$C restart gateway          # restart one service
$C down                     # stop (keeps data volumes)
$C down -v                  # stop AND wipe DB + photos (fresh seed next up)
```

- **Migrations** run automatically on every `up` via the `migrate` job and are
  idempotent. **Seeders** are best-effort and self-skip if data already exists, so
  re-deploys won't duplicate or fail.
- **To re-seed from scratch:** `$C down -v` then `$C up -d` (wipes all data).
- **Persistent data** lives in named volumes (`dexa-wfh-prod_dexa_mysql_data`,
  `…_dexa_minio_data`, `…_dexa_caddy_data` for the TLS certs).

## Troubleshooting

| Symptom | Fix |
|---|---|
| HTTPS not issued | Confirm `DOMAIN` resolves to the VM (`dig +short dexa-wfh.duckdns.org`) and ports 80/443 are open in **both** the VCN security list and OS iptables. |
| 502 from Caddy | Gateway not ready yet — `$C logs gateway`. It retries TCP to the services; give it ~30s after boot. |
| Photos 404 | Check MinIO is healthy and `MINIO_*` creds match between `attendances`, `gateway`, and `migrate`. |
| ARM "out of capacity" | Retry the create in another Availability Domain or later; capacity frees up. |

## Optional next steps (not required for the demo)

- Own domain instead of DuckDNS (nicer for a portfolio) — point an A record at the VM and set `DOMAIN`.
- CI/CD (GitHub Actions) to build/push images and `docker compose up -d` on push.
- A small swap file if you used the 1 GB AMD micro shape: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`.

---

# Option B — Hugging Face Spaces (free, no card)

The fastest way to a public, clickable demo with **no credit card and no identity
verification**. HF gives a free container (2 vCPU / 16 GB RAM) and an HTTPS URL
like `https://<user>-dexa-wfh.hf.space`.

**How it works:** HF Spaces run ONE container on ONE port (7860). The root
`Dockerfile` builds an **all-in-one image** that boots the entire stack inside a
single container (MySQL + MinIO + the 3 TCP services + gateway + nginx), wired up
by `huggingface/start.sh`. nginx serves the SPA and proxies `/api` + `/uploads`
to the gateway.

**Trade-offs (fine for a demo):**
- Storage is **ephemeral** — data resets to the seed on each restart (always a
  clean demo).
- The Space **sleeps after ~48 h idle** and wakes in ~30 s on the next visit.
- It is one container, so it doesn't show per-service scaling — but it still runs
  the services as separate processes over TCP. (For the true multi-container
  deployment, use Option A.)

## Steps

1. **Create an account** at <https://huggingface.co/join> (email or GitHub — no card).
2. **Create a Space:** <https://huggingface.co/new-space>
   - Owner: you · Space name: e.g. `dexa-wfh`
   - **SDK: Docker** → **Blank** template
   - Hardware: **CPU basic (free)** · Visibility: **Public**
3. **Push this repo to the Space.** The Space is its own git repo; add it as a
   remote and push (the root `Dockerfile` + `README.md` front matter drive the build):
   ```bash
   # Use a HF access token (Settings → Access Tokens, role "write") as the password.
   git remote add space https://huggingface.co/spaces/<user>/dexa-wfh
   git push space main
   ```
   > If your default branch isn't `main`, push it as main: `git push space HEAD:main`.
4. **(Recommended) Set secrets** in the Space → **Settings → Variables and secrets**:
   - `JWT_SECRET` = a long random string (`openssl rand -hex 32`)
   - optionally `MINIO_ROOT_PASSWORD`, `DB_PASSWORD`
   These override the defaults in `start.sh`.
5. **Wait for the build** (Space "Building" → "Running"; first build ~5–8 min,
   watch the **Logs** tab). When it's up, open the Space URL — the app loads and
   you can log in with the demo credentials above.

## Updating the demo

```bash
git push space main      # any push rebuilds the Space
```
Or click **Factory rebuild** in the Space settings to rebuild from scratch.

## Troubleshooting (HF)

| Symptom | Fix |
|---|---|
| Build fails on `mysql-server-core-8.0` | Package name differs on the base image — check the build log; it's installed in the runtime stage of the root `Dockerfile`. |
| App 502 / blank right after "Running" | The stack is still booting (MySQL init + migrations + seed). Give it ~30–60 s, then refresh. |
| `push` rejected | Authenticate with a HF **write** token as the password, and ensure you're pushing to the `main` branch of the Space repo. |
| Photos 404 | MinIO is in-container and ephemeral; after a restart the seed photo is re-uploaded automatically — refresh once boot completes. |

## Local verification (before pushing)

```bash
docker build -t dexa-hf-allinone .
docker run --rm -p 7860:7860 dexa-hf-allinone
# then open http://localhost:7860 and log in
```
