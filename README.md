# Local Cloud Control Plane

A learning-focused platform that mimics cloud database provisioning (think AWS RDS) running
entirely on local hardware. Provision and manage database instances through a web UI — no manual
Docker commands required.

## What it does

- Provision database containers (PostgreSQL, MySQL, MongoDB, Redis, MariaDB) through a UI
- Choose engine version at provision time
- Manage the full lifecycle: create → stop → start → update → destroy
- View live container logs and inspect output in a built-in console
- Connection strings generated automatically and displayed in the UI

## Stack

| Layer | Technology                  |
|---|-----------------------------|
| Frontend | React, Vite, Tailwind CSS   |
| Backend | Java 21, Spring Boot, Maven |
| Orchestration | Terraform (Docker provider) |
| Runtime | Docker Engine               |
| Platform DB | PostgreSQL 15               |

## Quick start

```bash
cd local-cloud
docker compose up -d
```

**Prerequisites:** Docker Desktop running, Terraform installed and on PATH, Java 21+, Node 18+.

```bash
git clone <repository-url>
cd local-cloud
```

Start the platform database (required by the backend):
```bash
docker run -d \
  --name control-plane-db \
  -e POSTGRES_DB=control_plane \
  -e POSTGRES_USER=control_plane \
  -e POSTGRES_PASSWORD=control_plane \
  -p 5432:5432 \
  postgres:15-alpine
```

Run the backend:
```bash
cd backend
./mvnw spring-boot:run
```

Run the frontend (in a separate terminal):
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Access points

| Service | URL |
|---|---|
| Frontend UI | http://localhost:5173 |
| Backend API | http://localhost:8080/api/v1 |
| Health check | http://localhost:8080/api/v1/actuator/health |
| Platform DB | localhost:5432 |

## API

Base URL: `http://localhost:8080/api/v1`

```
POST   /databases              Provision a new database instance
GET    /databases              List all instances
DELETE /databases/{id}         Destroy an instance
POST   /databases/{id}/stop    Stop a running container
POST   /databases/{id}/start   Start a stopped container
PUT    /databases/{name}       Update name or port
GET    /databases/{id}/logs    Fetch container logs
GET    /databases/{id}/inspect Inspect container metadata
```

**Create example:**
```json
POST /databases
{
  "name": "my-db",
  "type": "POSTGRESQL",
  "version": "16",
  "port": 5433
}
```

## Database status values

| Status | Meaning |
|---|---|
| PROVISIONING | Terraform apply running |
| RUNNING | Container up and healthy |
| STOPPING | Docker stop in progress |
| STOPPED | Container stopped, data intact |
| STARTING | Docker start in progress |
| UPDATING | Terraform recreating container |
| FAILED | Last operation failed |
| DESTROYING | Terraform destroy running |
| DESTROYED | Container removed |

## Supported engines and versions

| Engine | Available versions | Default |
|---|---|---|
| PostgreSQL | 13, 14, 15, 16, 17 | 15 |
| MySQL | 5.7, 8.0, 8.4 | 8.0 |
| MariaDB | 10.6, 10.11, 11.1, 11.4 | 11.1 |
| MongoDB | 5.0, 6.0, 7.0 | 7.0 |
| Redis | 6.2, 7.0, 7.2 | 7.2 |

## Architecture

```
Browser → React UI → Spring Boot API → Terraform → Docker Engine
                           ↓
                     PostgreSQL (platform metadata)
```

The backend never talks to Docker directly. It generates a `main.tf` file per database, runs
`terraform apply`, and reads the outputs (connection string, container ID). Terraform owns the
Docker lifecycle. The platform PostgreSQL only stores metadata — names, statuses, ports,
connection strings, encrypted passwords.

## Port allocation

- `5432` — platform PostgreSQL (reserved)
- `5433+` — user-provisioned PostgreSQL instances (auto-assigned)
- `3306+` — MySQL / MariaDB (auto-assigned)
- `27017+` — MongoDB (auto-assigned)
- `6379+` — Redis (auto-assigned)

## Troubleshooting

**Backend won't start** — check the platform PostgreSQL container is running on port 5432.

**Terraform not found** — ensure `terraform` is on your system PATH and `terraform -version` works.

**Docker not found** — ensure Docker Desktop is running before starting the backend.

**Provisioning stuck at PROVISIONING** — check backend logs for Terraform output. The init step
downloads the Docker provider (~40 MB) on first run, which can take a minute.

**Port conflict** — use auto-assign or pick a port that isn't already bound on your machine.
