# Claude.md - Project Context for AI Assistance

> This file provides context about the Local Infrastructure Control Plane project for AI assistants like Claude.

---

## Project Overview

**Name:** Local Infrastructure Control Plane (Mini Local Cloud)

**Purpose:** A learning-focused platform that mimics cloud infrastructure services (like AWS EC2/RDS) running entirely on local hardware.

**Type:** Educational systems programming project demonstrating platform engineering principles

**Status:** Phase 1 - Planning & Architecture

---

## What This Project Is

A local-first infrastructure control plane that allows users to:
- Provision infrastructure resources (databases, services) through a web UI
- Manage resource lifecycle (create, view, destroy)
- Access infrastructure running on local Docker without manual container management

**This is NOT:**
- A production-ready system
- A cloud provider replacement
- A Kubernetes alternative
- A commercial product

**This IS:**
- A learning platform for cloud primitives
- A demonstration of control plane architecture
- A practical systems programming exercise
- A portfolio project showcasing architectural thinking

---

## Technology Stack

### Phase 1 (MVP)

**Backend (Control Plane):**
- Java 17+ with Spring Boot
- Maven for build management
- PostgreSQL for platform metadata storage

**Frontend (UI):**
- React
- Axios for HTTP client
- Tailwind CSS for styling

**Infrastructure Layer:**
- Docker Engine (runtime)
- Docker Compose (platform bootstrapping)
- Terraform (orchestration)
- Terraform Docker Provider

**Observability:**
- Structured logging (Logback)
- Terraform execution logs
- Basic health endpoints

### Future Phases
- Phase 2+: Additional resource types (Redis, RabbitMQ, etc.)
- Phase 5: Go rewrite of backend for better performance

---

## Architecture Principles

### Core Concepts

**Separation of Concerns:**
- **Control Plane** (Backend) = Knows *what* users want
- **Orchestrator** (Terraform) = Knows *how* to create it
- **Runtime** (Docker) = Actually *runs* the infrastructure

**Declarative Infrastructure:**
- Resources defined as desired state
- Terraform enforces reality
- Backend never directly provisions Docker containers

**State Management:**
- **Terraform State** = Infrastructure reality (what Docker resources exist)
- **Platform State** = Business logic (what users created, status, metadata)

### Data Flow
```
User → React UI → Spring Boot API → Terraform → Docker Engine
                         ↓
                   PostgreSQL
                 (Platform Metadata)
```

---

## Directory Structure

```
local-infra-control-plane/          # Monorepo root
│
├── README.md                        # Main project documentation
├── docker-compose.yml               # Platform bootstrapping
├── .gitignore
├── .env.example
│
├── docs/                            # Documentation
│   ├── ARCHITECTURE.md              # System design & concepts
│   ├── API.md                       # REST API specifications
│   ├── DEVELOPMENT.md               # Local development guide
│   └── TROUBLESHOOTING.md           # Common issues
│
├── backend/                         # Java Spring Boot control plane
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/localinfra/controlplane/
│   │   │   │       ├── controller/  # REST endpoints
│   │   │   │       ├── service/     # Business logic & Terraform execution
│   │   │   │       ├── model/       # Domain entities (Database, Status, etc.)
│   │   │   │       ├── repository/  # JPA repositories
│   │   │   │       └── config/      # Spring configuration
│   │   │   └── resources/
│   │   │       └── application.yml  # Spring Boot config
│   │   └── test/
│   ├── pom.xml                      # Maven dependencies
│   ├── Dockerfile
│   └── .dockerignore
│
├── frontend/                        # React UI
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── services/                # API client (Axios)
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
│
├── terraform/                       # Terraform module library
│   └── modules/
│       ├── postgres/                # PostgreSQL module (Phase 1)
│       │   ├── main.tf              # Resource definitions
│       │   ├── variables.tf         # Input parameters
│       │   └── outputs.tf           # Output values
│       └── [future modules]/        # Redis, RabbitMQ, etc.
│
└── scripts/                         # Development utilities
    ├── setup.sh
    ├── cleanup.sh
    └── dev-reset.sh
```

---

## Phase 1 Scope (MVP)

### What's Included
- ✅ Single resource type: PostgreSQL database
- ✅ Three operations: Create, List, Destroy
- ✅ Basic React UI with status visibility
- ✅ Terraform state management
- ✅ Connection string outputs
- ✅ Error handling and logging

### What's Excluded (Future Phases)
- ❌ Multiple resource types
- ❌ Authentication/authorization
- ❌ Resource quotas/limits
- ❌ Advanced networking
- ❌ Backup/restore
- ❌ Monitoring dashboards

### Success Criteria
Phase 1 is complete when:
1. User runs `docker compose up`
2. User accesses UI at `http://localhost:3000`
3. User creates PostgreSQL database via UI
4. Database appears as "Provisioning" then "Running"
5. Connection string is displayed
6. Docker container is actually running (`docker ps`)
7. User can connect to database with connection string
8. User deletes database via UI
9. Container is removed from Docker

---

## Key Component Responsibilities

### Backend (Spring Boot)
**Role:** Control plane orchestrator

**Responsibilities:**
- Expose REST API endpoints
- Validate user requests
- Store resource metadata in PostgreSQL
- Generate Terraform configuration files at runtime
- Execute Terraform commands via shell
- Capture Terraform outputs (connection strings, etc.)
- Update database with resource status
- Handle errors and provide feedback

**Does NOT:**
- Directly create Docker containers
- Manage Terraform state (Terraform does this)
- Store infrastructure state (only metadata)

### Terraform
**Role:** Infrastructure orchestrator

**Responsibilities:**
- Read declarative `.tf` configuration files
- Talk to Docker API via Docker Provider
- Create/destroy containers, volumes, networks
- Track infrastructure state in `.tfstate` files
- Provide outputs (connection strings, ports)
- Handle idempotency

**Does NOT:**
- Have a UI or know about users
- Store business logic
- Track platform metadata

### Docker Engine
**Role:** Infrastructure runtime

**Responsibilities:**
- Run containers (PostgreSQL, Redis, etc.)
- Manage networking between containers
- Handle storage volumes
- Provide isolation

**Does NOT:**
- Know about the control plane
- Track what resources belong to which users
- Manage lifecycle (just runs what it's told)

### Platform PostgreSQL
**Role:** Metadata storage

**Stores:**
- Resource records (ID, name, status)
- Terraform state file paths
- Connection strings
- Timestamps
- User-facing information

**Does NOT:**
- Store Terraform state (files do that)
- Store actual user data
- Manage Docker resources

---

## How It Works: Complete Flow

### Creating a Database

1. **User clicks "Create Database"** in React UI
2. **Frontend sends POST** to `/api/databases` with name
3. **Backend validates** request and finds available port
4. **Backend creates metadata record** with status "PROVISIONING"
5. **Backend generates Terraform files** in temp directory
6. **Backend executes** `terraform apply` as shell command
7. **Terraform talks to Docker API** to create container
8. **Terraform writes state file** and outputs connection string
9. **Backend captures outputs** from Terraform stdout
10. **Backend updates metadata** with connection string, status "RUNNING"
11. **Frontend polls** `/api/databases` and shows updated status
12. **User sees** database as "Running" with connection details

### Destroying a Database

1. **User clicks "Delete"** on database
2. **Frontend sends DELETE** to `/api/databases/{id}`
3. **Backend updates status** to "DESTROYING"
4. **Backend executes** `terraform destroy` in resource directory
5. **Terraform removes Docker container** via API
6. **Backend updates metadata** to status "DESTROYED"
7. **Frontend removes** database from UI

---

## State Management Strategy

### Two Sources of Truth

**Terraform State Files:**
- Location: `/tmp/terraform/{resource-id}/terraform.tfstate`
- Contains: Actual Docker resource IDs, configurations
- Managed by: Terraform (never manually edited)
- Purpose: Track infrastructure reality

**Platform Database (PostgreSQL):**
- Location: Platform's PostgreSQL instance
- Contains: Resource metadata, status, connection info
- Managed by: Backend API
- Purpose: Track business logic and user-facing data

### Why Both?

Different purposes:
- Terraform state = "What containers exist in Docker?"
- Platform state = "What did users create and what's the status?"

### Reconciliation

On backend startup:
1. Scan Terraform state directories
2. Match state files to database records
3. Flag orphaned resources
4. Expose `/api/reconcile` for manual sync

---

## Development Workflow

### Starting the Platform
```bash
git clone <repo-url>
cd local-infra-control-plane
docker compose up
```

Platform runs at:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Platform DB: `localhost:5432`

### Local Development (Hot Reload)

**Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

**Platform Database:**
```bash
docker run -d \
  -e POSTGRES_DB=control_plane \
  -e POSTGRES_USER=control_plane \
  -e POSTGRES_PASSWORD=control_plane \
  -p 5432:5432 \
  postgres:15-alpine
```

---

## API Endpoints (Phase 1)

```
POST   /api/databases          Create new database
  Request:  { "name": "my-db" }
  Response: { "id": "...", "status": "PROVISIONING", ... }

GET    /api/databases          List all databases
  Response: [{ "id": "...", "name": "...", "status": "...", ... }]

GET    /api/databases/{id}     Get database details
  Response: { "id": "...", "connectionString": "...", ... }

DELETE /api/databases/{id}     Destroy database
  Response: { "status": "DESTROYING" }

GET    /api/health             Health check
  Response: { "status": "UP" }
```

---

## Database Schema (Phase 1)

```sql
CREATE TABLE databases (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,  -- PROVISIONING, RUNNING, FAILED, DESTROYING, DESTROYED
    terraform_state_path TEXT,
    connection_string TEXT,
    port INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

---

## Terraform Module Structure (Phase 1)

**Location:** `terraform/modules/postgres/`

**Files:**
- `main.tf` - Docker container resource definition
- `variables.tf` - Input parameters (name, port, password)
- `outputs.tf` - Connection string output

**Key point:** These are templates. Backend generates actual working directories at runtime that reference these modules.

---

## Error Handling Patterns

### Terraform Execution Failures
- Capture stderr output
- Update status to "FAILED"
- Store error message in database
- Keep Terraform directory for debugging
- Allow retry or cleanup

### Port Conflicts
- Backend scans existing databases for ports
- Assigns unique port before provisioning
- Validates port availability

### Manual Container Deletion
- Terraform detects missing resources on destroy
- Backend marks as DESTROYED
- Reconciliation endpoint fixes state

---

## Logging Strategy

### What Gets Logged
- All Terraform executions (command, duration, exit code)
- All API requests (endpoint, status, response time)
- Database lifecycle events (state transitions)
- Errors with full stack traces

### What Doesn't Get Logged
- Passwords or credentials
- Full Terraform state contents
- Connection strings (except in designated outputs)

### Log Format
Structured JSON logs via Logback:
```json
{
  "timestamp": "2025-02-08T10:30:00Z",
  "level": "INFO",
  "component": "TerraformExecutor",
  "operation": "apply",
  "database_id": "550e8400-...",
  "duration_ms": 3421,
  "status": "success"
}
```

---

## Common Patterns & Conventions

### Naming Conventions
- Database resources: `{user-provided-name}`
- Docker containers: Same as database name
- Terraform directories: `/tmp/terraform/{database-id}/`
- State files: `terraform.tfstate` in resource directory

### Status Values
- `PROVISIONING` - Terraform apply in progress
- `RUNNING` - Container running successfully
- `FAILED` - Terraform failed during provision
- `DESTROYING` - Terraform destroy in progress
- `DESTROYED` - Resource cleaned up

### Port Allocation
- Start at 5433 for PostgreSQL (5432 used by platform DB)
- Increment for each new database
- Scan existing databases to find next available

---

## Testing Strategy

### Unit Tests
- Service layer logic (TerraformExecutor, DatabaseService)
- Input validation
- State transitions

### Integration Tests
- Full API endpoint tests with TestContainers
- Terraform execution in isolated environment
- Database interactions

### Manual Validation
1. Create database via UI
2. Verify with `docker ps`
3. Connect with `psql <connection-string>`
4. Check logs for errors
5. Destroy and verify cleanup

---

## Known Limitations & Trade-offs

### Phase 1 Limitations
- Single resource type only
- No authentication
- No resource limits
- Basic error handling
- Port conflicts possible if backend crashes
- No backup/restore

### Intentional Trade-offs
- Java instead of Go (faster development, familiar)
- Shell execution of Terraform (simpler than Go SDK)
- File-based state (simpler than remote backends)
- Polling for status (simpler than WebSockets)

---

## Future Enhancement Ideas

### Phase 2: More Resources
- Redis, RabbitMQ, MongoDB
- Resource tagging
- Automatic port management

### Phase 3: Platform Maturity
- Authentication via API keys
- Resource quotas per user
- Audit logging
- Prometheus metrics

### Phase 4: Advanced Features
- Backup/restore functionality
- Container logs via UI
- Resource snapshots
- Network isolation

### Phase 5: Go Rewrite
- Replace Java backend with Go
- Better concurrency
- Smaller footprint
- Native Terraform SDK integration

---

## Context for AI Assistants

### When Helping With This Project

**DO:**
- Focus on Phase 1 scope unless explicitly asked about future phases
- Explain architectural decisions and trade-offs
- Provide conceptual understanding before code
- Consider the learning goals of the project
- Keep solutions simple and clear
- Reference this document for context

**DON'T:**
- Over-engineer solutions
- Add features beyond current phase scope
- Assume production-grade requirements
- Introduce complex patterns unnecessarily
- Skip explaining the "why" behind suggestions

### Developer's Background
- Professional Java/Spring Boot developer
- Experience with fintech systems, microservices, AWS
- Strong understanding of full-stack development
- Self-teaching mindset with focus on deep understanding
- Working on this to learn platform engineering and systems programming

### Project Goals (Learning Outcomes)
1. Understand how cloud platforms work internally
2. Learn control plane architecture patterns
3. Practice infrastructure orchestration
4. Gain hands-on experience with Terraform
5. Build portfolio piece demonstrating systems thinking

---

## Quick Reference

### Starting Development
```bash
docker compose up              # Start platform
docker compose down            # Stop platform
docker compose logs backend    # View backend logs
docker ps                      # See running containers
```

### Useful Commands
```bash
# Check database
docker exec -it <postgres-container> psql -U control_plane

# View Terraform state
cat /tmp/terraform/<db-id>/terraform.tfstate

# Clean up everything
docker compose down -v
docker system prune -a
```

### Port Reference
- `3000` - React UI
- `8080` - Spring Boot API
- `5432` - Platform PostgreSQL
- `5433+` - User-created PostgreSQL databases

---

## Document Version

**Version:** 1.0  
**Last Updated:** 2025-02-08  
**Phase:** Planning & Architecture  
**Status:** Pre-implementation

---

## Related Documentation

- `docs/ARCHITECTURE.md` - Detailed architectural concepts
- `docs/API.md` - REST API specifications (to be created)
- `docs/DEVELOPMENT.md` - Development setup guide (to be created)
- `README.md` - Project overview and quick start

---

*This document should be updated as the project evolves. Keep it current to help future Claude conversations stay contextually aware.*