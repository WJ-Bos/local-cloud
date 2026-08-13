# Go Backend Port — Implementation Plan

> Port the Spring Boot / Java 21 backend to Go. Full replacement of the `backend/`
> Maven module. The React frontend in `frontend/` is the contract and does not change.
>
> **Decisions locked in:**
> - **Schema:** GORM `AutoMigrate` (mirror Hibernate `ddl-auto: update`)
> - **Crypto:** AES-GCM, assume a **fresh database** (existing encrypted rows are discarded)
> - **End state:** Go fully replaces Java; delete the `backend/` module at the end
> - **API contract unchanged:** same paths, methods, status codes, JSON field names

---

## 1. Target stack

| Concern        | Java (current)                    | Go (target)                                            |
|----------------|-----------------------------------|--------------------------------------------------------|
| HTTP router    | Spring MVC                        | `github.com/go-chi/chi/v5`                             |
| ORM            | Spring Data JPA + Hibernate       | `gorm.io/gorm` + `gorm.io/driver/postgres`            |
| Validation     | Jakarta Bean Validation           | `github.com/go-playground/validator/v10` + custom     |
| Docker         | docker-java                       | `github.com/docker/docker/client` (official SDK)      |
| Terraform      | `ProcessBuilder`                  | `os/exec`                                              |
| HCL templating | `String.format` text blocks       | `text/template`                                        |
| Config         | `application.yml` + `@Value`      | `github.com/spf13/viper` (env + yaml)                 |
| Logging        | Lombok `@Slf4j`                   | `log/slog` (stdlib)                                    |
| Async          | `CompletableFuture.runAsync`      | goroutines                                             |
| JSON           | Jackson                           | `encoding/json` (stdlib)                               |
| Crypto         | `javax.crypto` AES/ECB            | `crypto/aes` + `crypto/cipher` (GCM)                   |

---

## 2. Proposed package layout

```
backend-go/
  go.mod
  cmd/server/main.go                 # wiring + bootstrap (replaces BackendApplication + DI)
  internal/
    config/config.go                 # Config struct, viper load (application.yml + APP_DOCKER_HOST etc.)
    domain/
      database.go                    # Database struct (GORM model)
      enums.go                       # DatabaseType, DatabaseStatus + metadata
      terraform_result.go            # TerraformResult struct
    dto/
      requests.go                    # Create/Update request structs + validate tags
      responses.go                   # DatabaseResponse, ConsoleLogsResponse
    repository/
      database_repo.go               # GORM queries (findByName, findMaxPort, isPortInUse, ...)
    infra/
      terraform.go                   # TerraformService
      config_provider.go             # DatabaseConfigProvider (HCL templates)
      docker.go                      # Docker SDK client wrapper
    security/
      crypto.go                      # AES-GCM encrypt/decrypt
    service/
      provision.go                   # DatabaseProvisionService
      update.go                      # DatabaseUpdateService
      destroy.go                     # DatabaseDestroyService
      control.go                     # DatabaseControlService (start/stop)
      details.go                     # DatabaseDetailsService (resync/list)
      console.go                     # DatabaseConsoleService (logs/inspect)
    validation/
      validation.go                  # RequestValidationService
    httpapi/
      router.go                      # chi router, CORS middleware, base path /api/v1
      database_handler.go            # provision/list/update/destroy/start/stop
      console_handler.go             # logs/inspect
      respond.go                     # JSON write + status-code helpers
  internal/.../*_test.go             # unit tests, esp. config_provider parity tests
```

Single binary. Manual constructor wiring in `main.go` replaces Spring DI.

---

## 3. File-by-file mapping

### 3.1 Domain

**`domain/enums.go`** — port `DatabaseType` and `DatabaseStatus`.

- `DatabaseStatus`: a string type with the 9 constants
  (`PROVISIONING, RUNNING, STOPPED, STARTING, STOPPING, UPDATING, FAILED, DESTROYING, DESTROYED`).
  Stored as the string name (matches `@Enumerated(EnumType.STRING)`).
- `DatabaseType`: string type with 5 constants. Carry the per-type metadata from the Java enum
  in a lookup table:

  ```go
  type typeMeta struct {
      DisplayName         string
      DefaultImage        string // postgres:15-alpine, mysql:8.0, mongo:7.0, redis:7.2-alpine, mariadb:11.1
      DefaultInternalPort int
      DefaultStartPort    int    // POSTGRESQL=5433, MYSQL/MARIADB=3306, MONGODB=27017, REDIS=6379
      DefaultVersion      string // 15, 8.0, 7.0, 7.2, 11.1
      DataDir             string // for future persistence feature (see V2.md)
  }
  ```
  This consolidates logic currently split across `DatabaseType` enum and
  `DatabaseConfigProvider.getDefaultStartPort` / `resolveVersion`.

**`domain/database.go`** — GORM model. Mirror `Database` entity columns exactly so AutoMigrate
produces the same table:

```go
type Database struct {
    ID                 uint            `gorm:"primaryKey"`
    Name               string          `gorm:"uniqueIndex;not null"`
    Type               DatabaseType    `gorm:"not null"`
    Status             DatabaseStatus  `gorm:"not null"`
    ContainerID        string          `gorm:"column:container_id"`
    TerraformStatePath string          `gorm:"column:terraform_state_path"`
    ConnectionString   string          `gorm:"column:connection_string"`
    EncryptedPassword  string          `gorm:"column:encrypted_password"`
    Version            string          `gorm:"column:version;size:20"`
    MemoryMb           *int            `gorm:"column:memory_mb"`   // nullable
    Port               *int            `gorm:"column:port"`        // nullable
    CreatedAt          time.Time       `gorm:"column:created_at"`
    UpdatedAt          time.Time       `gorm:"column:updated_at"`
}
func (Database) TableName() string { return "databases" }
```
Notes:
- `MemoryMb` and `Port` are pointers because the Java fields are nullable `Integer`.
- GORM auto-manages `CreatedAt`/`UpdatedAt` (matches `@CreationTimestamp`/`@UpdateTimestamp`).
- AutoMigrate replaces both Hibernate ddl-auto **and** the 3 SQL files in `db/migration/`.
  The `status` CHECK constraint (V1) and the `type` index (V2) can be added via GORM tags /
  a follow-up `Exec` if you want to preserve them; not strictly required for parity.

**`domain/terraform_result.go`** — plain struct: `Success bool`, `ConnectionString, ContainerID,
Password, ErrorMessage string`, `WorkingDirectory string` (use string path, not a Path type).

### 3.2 DTOs

**`dto/requests.go`**
- `CreateDatabaseRequest`: `Name, Type, Port, Version, MemoryMb`. Validation tags replicate the
  Jakarta annotations:
  - `Name`: required, regex `^[a-z0-9-]+$`
  - `Type`: required, one of the 5 enums
  - `Port`: optional, 1024–65535 (note: create allows ≥1024, but the validation service
    later enforces ≥5433 — preserve both layers)
  - `Version`: optional, regex `^[0-9][0-9a-zA-Z.-]*$`
  - `MemoryMb`: optional, 128–2048
- `UpdateDatabaseRequest`: `Name` (required, regex), `NewName` (optional, regex),
  `Port` (optional, **≥5433**), `MemoryMb` (optional, 128–2048).

`go-playground/validator` covers most; the cross-record checks (uniqueness, port-in-use,
state machine) stay in the validation service. Use pointers for optional numeric fields so
"absent" is distinguishable from "zero".

**`dto/responses.go`**
- `DatabaseResponse`: same JSON field names the frontend expects — `id, name, type, version,
  memoryMb, containerId, status, port, connectionString, password, terraformStatePath,
  createdAt, updatedAt`. Use `json:"..."` tags exactly (camelCase). `status` is a plain string.
- `ConsoleLogsResponse`: `{ "lines": [...], "total": n }`.

> ⚠️ **Contract check:** confirm the frontend's expected JSON keys against `frontend/` before
> finalizing tags. Java serializes enum `type` as its NAME (e.g. `"POSTGRESQL"`) — match that.
> `createdAt`/`updatedAt` are Java `LocalDateTime` (no zone). Marshal as ISO-8601 without zone,
> or verify the frontend tolerates RFC3339. **This is the most likely parity break — verify early.**

### 3.3 Repository — `repository/database_repo.go`

Port each Spring Data method to a GORM query:

| Java                         | Go (GORM)                                                                 |
|------------------------------|--------------------------------------------------------------------------|
| `findById`                   | `db.First(&d, id)`                                                        |
| `findByName`                 | `db.Where("name = ?", name).First(&d)`                                    |
| `existsByName`               | `db.Model(&Database{}).Where("name = ?", name).Count(...)`               |
| `findByPort`                 | `db.Where("port = ?", port).First(&d)`                                    |
| `findMaxPort`                | `SELECT COALESCE(MAX(port), 5432)` via `db.Raw(...).Scan(...)`           |
| `isPortInUse`                | `Where("port = ? AND status IN ?", port, activeStatuses).Count() > 0`     |
| `findAllActiveDatabase`      | `Where("status <> ?", DESTROYED).Order("created_at DESC").Find(...)`     |
| `save`                       | `db.Save(&d)`                                                             |

Return `(Database, error)` and translate `gorm.ErrRecordNotFound` to a domain "not found".

### 3.4 Infrastructure

**`infra/config_provider.go`** — port `DatabaseConfigProvider`. Convert the 5 `String.format`
text blocks into `text/template` templates (or keep `fmt.Sprintf` for a near-literal port).
Replicate exactly:
- `resolveVersion(type, version)` — fall back to per-type default when blank.
- `memoryLine(memoryMb)` — return `"  memory = <n>\n"` when `memoryMb != nil && > 0`, else `""`.
- `generateConnectionString` — the 5 URL formats (postgres/mysql/mongodb/redis/mariadb).
- `getDefaultStartPort` — fold into `enums.go` typeMeta.

> **Parity test target:** for each (type, version, memory) combination, the generated HCL string
> should be byte-identical to the Java output (modulo trailing whitespace). Write table tests here
> first — this module is pure and the cheapest place to guarantee correctness.

**`infra/terraform.go`** — port `TerraformService`:
- `ProvisionDatabase(name, type, port, version, memoryMb)`:
  1. `os.MkdirAll(/tmp/terraform/<name>)` — **note path:** `/tmp` is Linux-style. On the
     Windows dev host use `os.TempDir()` or make the base dir configurable (`app.terraform.base-dir`).
     ⚠️ The Java code hardcodes `/tmp/terraform`; decide the Go base dir explicitly.
  2. Generate password (see below), write `main.tf`.
  3. `runTerraform(dir, "init")`, then `apply -auto-approve`.
  4. `terraform output -json` → parse. **Replace the Java regex hack with real `encoding/json`**
     (`map[string]struct{ Value string }`), reading `connection_string` and `container_id`.
- `DestroyInstance(workingDir)` → `destroy -auto-approve`, then `os.RemoveAll(dir)`.
- `UpdateDatabase(...)` → destroy old dir, recreate new dir, init+apply (destroy+recreate semantics).
- `runTerraform`: `exec.Command("terraform", args...)`, set `cmd.Dir`, merge stdout+stderr,
  stream to `slog` at debug, return `err == nil && exitCode == 0`.
- Password generation: 24 chars from the alnum charset using `crypto/rand` (matches
  `SecureRandom`). Keep charset identical.

**`infra/docker.go`** — wraps the official Docker SDK (`client.NewClientWithOpts`), host from
config (`npipe:////./pipe/docker_engine` on Windows; `unix:///var/run/docker.sock` on Linux).
Methods:
- `Logs(ctx, containerID, tail) ([]string, error)` — `ContainerLogs` with `Tail`, `ShowStdout`,
  `ShowStderr`. **Demux note:** the Docker log stream is multiplexed with an 8-byte header per
  frame; use `stdcopy.StdCopy` to split, then split into lines. (docker-java's `Frame` handled
  this for you.)
- `Inspect(ctx, containerID) (string, error)` — `ContainerInspect`, marshal to pretty JSON.
- `Start(ctx, id)` / `Stop(ctx, id)` — `ContainerStart` / `ContainerStop`.
  > Simplification: Java's `DatabaseControlService` shells out to the `docker` CLI for start/stop,
  > but Console uses the SDK. **Unify on the SDK** for all four (logs/inspect/start/stop) in Go.

### 3.5 Security — `security/crypto.go`

New scheme (fresh DB, no back-compat needed):
- Key from config (`security.encryption.key`). For AES-256-GCM derive a 32-byte key
  (e.g. SHA-256 of the configured key, or require a 32-byte key directly).
- `Encrypt(plain) string`: random 12-byte nonce, `gcm.Seal`, return base64 of `nonce||ciphertext`.
- `Decrypt(b64) (string, error)`: reverse.
- Drop the ECB/padding logic entirely.

### 3.6 Services (the orchestration layer)

General pattern for each mutating service: validate/find → save transitional status → return
response → `go func(){ ... }()` that runs Terraform/Docker and writes the terminal status.
Reproduce the **exact status transitions**:

**`service/provision.go`** (`DatabaseProvisionService.provision`):
- Resolve port: use request port, else `findNextAvailablePort(type)` (default start port, or
  `maxPort+1`). Same logic as Java.
- Save `Database{status: PROVISIONING, terraformStatePath: <base>/<name>}`.
- Return `201 Created` with the response DTO immediately.
- Goroutine: `terraform.ProvisionDatabase(...)`; on success set `connectionString`,
  `containerId`, `status=RUNNING`, **encrypt** password, save; on failure `status=FAILED`.

**`service/update.go`** (`DatabaseUpdateService.update`):
- Must be `STOPPED` (else `400`). Compute new name/port/memory, detect no-op (return `200`
  unchanged). Set `UPDATING`, return `200` with current DTO.
- Goroutine: decrypt existing password → `terraform.UpdateDatabase(...)` (destroy+recreate) →
  on success update name/port/memory/connStr/containerId/path, `status=RUNNING`; else `FAILED`.

**`service/destroy.go`** (`DatabaseDestroyService.destroy`):
- Find by id (`404` if missing). Set `DESTROYING`, return `202 Accepted`.
- Goroutine: `terraform.DestroyInstance(path)` → success `DESTROYED`, failure `FAILED`.

**`service/control.go`** (`DatabaseControlService`):
- `Stop`: require `RUNNING` + non-empty containerId → `STOPPING` → `200` → goroutine docker stop
  → `STOPPED` (success) / revert `RUNNING` (failure).
- `Start`: require `STOPPED` + containerId → `STARTING` → `200` → goroutine docker start
  → `RUNNING` / revert `STOPPED`.

**`service/details.go`** (`DatabaseDetailsService.resync`): `findAllActiveDatabase` → list of DTOs,
`200`. (Note: Java's list mapper omits `password` — preserve that; only single-item responses
include the decrypted password.)

**`service/console.go`** (`DatabaseConsoleService`):
- `GetLogs(id, tail, filter)`: require `RUNNING` + containerId. If filter set, fetch
  `max(tail*10, 1000)` lines, apply `strings.Contains` filter, then take the last `tail`.
- `GetInspect(id)`: require `RUNNING`, return pretty JSON of container inspect.
- Map the `ResponseStatusException` cases to `404`/`400`/`500`.

### 3.7 Validation — `validation/validation.go`

Port `RequestValidationService`:
- `ValidateCreate`: name format; name not already taken (unless `DESTROYED`); port range
  (≥5433) + not in use.
- `ValidateUpdate`: name exists; must be `STOPPED`; if renaming, new name format + uniqueness;
  if port changing, range + not used by a *different* active db.
- `ValidateDelete` / `ValidateGet` as in Java (delete may be unused by handlers — check).
- Keep these as repository-backed checks separate from the struct-tag validation in DTOs.

### 3.8 HTTP layer

**`httpapi/router.go`**
- chi router mounted at base path `/api/v1` (matches `server.servlet.context-path`).
- CORS middleware from config (`github.com/go-chi/cors` or hand-rolled) replicating
  `CorsProperties`: allowed origins `localhost:5173`, `localhost:3000`; methods
  GET/POST/PUT/PATCH/DELETE/OPTIONS; headers Authorization/Content-Type/Accept/X-Requested-With;
  exposed X-Total-Count/X-Page-Number/X-Page-Size; credentials true; maxAge 3600.
- Health endpoint(s) to replace actuator `/actuator/health` (frontend may poll — verify).
- No auth (Java permits all requests).

**`httpapi/database_handler.go`** — the 9 routes, exact methods + status codes:

| Method | Path                         | Handler            | Success status |
|--------|------------------------------|--------------------|----------------|
| POST   | `/databases`                 | provision          | 201            |
| GET    | `/databases`                 | resync/list        | 200            |
| PUT    | `/databases/{name}`          | update             | 200            |
| DELETE | `/databases/{id}`            | destroy            | 202            |
| POST   | `/databases/{id}/stop`       | stop               | 200            |
| POST   | `/databases/{id}/start`      | start              | 200            |
| GET    | `/databases/{id}/logs`       | logs (tail,filter) | 200            |
| GET    | `/databases/{id}/inspect`    | inspect            | 200            |

- PUT: enforce path `{name}` == body `name` (Java returns `400` on mismatch).
- Bind JSON, run struct validation → `400`; run validation service → `400`; call service.

**`httpapi/respond.go`** — helpers to write JSON and map errors to status codes.

### 3.9 Bootstrap — `cmd/server/main.go`

Replaces `BackendApplication` + Spring DI: load config → open GORM (`postgres://control_plane:
control_plane@localhost:5432/control_plane`) → `AutoMigrate(&Database{})` → construct repo,
crypto, docker client, terraform service, config provider, services, validation, handlers →
start HTTP server on `:8080`.

### 3.10 Config — `internal/config/config.go`

Mirror `application.yml`: datasource URL/user/pass, `server.port` (8080) + context-path
(`/api/v1`), `app.docker.host`, CORS block, `security.encryption.key`, plus a new
`app.terraform.base-dir`. Support env overrides (`APP_DOCKER_HOST` already referenced).
Drop Hibernate/JPA-specific keys.

---

## 4. Behaviors that MUST be preserved (parity checklist)

- [ ] Async fire-and-forget: mutating endpoints return immediately, goroutine flips status.
- [ ] Exact status state machine (transitional → terminal, with revert-on-failure for start/stop).
- [ ] Port assignment algorithm (`findNextAvailablePort`) and the 5432-reserved rule.
- [ ] Update = destroy + recreate, password preserved (decrypt → re-provision).
- [ ] `terraform output -json` reads `connection_string` + `container_id`.
- [ ] HCL generation byte-identical per (type, version, memory).
- [ ] Connection-string formats per engine.
- [ ] List response omits `password`; single responses include decrypted `password`.
- [ ] JSON field names + enum-as-NAME + datetime format match what `frontend/` expects.
- [ ] CORS config equivalent.
- [ ] Validation rules (name regex, port ranges, uniqueness, STOPPED-to-update).

---

## 5. Known differences / cleanups (intentional)

1. **Crypto**: AES-GCM instead of AES/ECB. Requires a fresh DB (chosen). Old encrypted
   passwords are not decryptable — acceptable per decision.
2. **Schema**: GORM AutoMigrate instead of Hibernate + unused SQL files. The 3 `db/migration/`
   files are dropped; CHECK constraint / type index are optional to recreate.
3. **start/stop**: Docker SDK instead of shelling out to `docker` CLI (unified with logs/inspect).
4. **terraform output parsing**: real JSON instead of regex.
5. **Terraform base dir**: made configurable instead of hardcoded `/tmp/terraform`
   (important on the Windows host).

---

## 6. Suggested build order (incremental, each step compiles + tests)

1. Scaffold module, `config`, `domain` (enums, model, result).
2. `repository` + GORM `AutoMigrate`; smoke-test against local Postgres.
3. `infra/config_provider` + **parity table tests** vs. Java HCL output.
4. `infra/terraform` + `security/crypto` (+ unit tests).
5. `infra/docker` (logs/inspect/start/stop via SDK).
6. `service/*` (provision → details → control → destroy → update → console).
7. `validation` + `httpapi` (router, handlers, CORS, respond helpers) + `cmd/server/main.go`.
8. End-to-end against the React frontend; fix JSON/contract mismatches.
9. Delete the `backend/` Maven module + parent-pom reference; update `docker-compose.yml`,
   `README.md`, `.env.example`.

---

## 7. Open items to confirm before/while coding

- **Frontend contract**: exact JSON keys, enum casing, and datetime format the React app
  consumes (inspect `frontend/` API calls). Highest-risk parity area.
- **Health endpoint**: does the frontend or docker-compose health-check hit `/actuator/health`?
  If so, expose an equivalent.
- **`docker-compose.yml`**: how the backend is built/run today (port 8080, context path,
  env vars) — the Go service must slot in identically.
- **CHECK constraint / type index**: keep them (via post-AutoMigrate `Exec`) or drop them?
