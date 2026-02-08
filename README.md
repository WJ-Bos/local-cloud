# Local Cloud Control Plane

A learning-focused platform that mimics cloud infrastructure services (like AWS EC2/RDS) running entirely on local hardware.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose v3.8+

### Start the Platform

```bash
# Clone the repository
git clone <repository-url>
cd local-cloud-control-plane

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean state)
docker-compose down -v
```

### Access the Application

Once all services are running:

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **Health Check**: http://localhost:8080/api/v1/actuator/health
- **PostgreSQL**: localhost:5432

## 📦 Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| Frontend | control-plane-frontend | 3000 | React UI with Nginx |
| Backend | control-plane-backend | 8080 | Spring Boot API |
| Database | control-plane-db | 5432 | PostgreSQL 15 |

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   Frontend      │  React + Nginx
│   (Port 3000)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Backend      │  Spring Boot
│   (Port 8080)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │  Database
│   (Port 5432)   │
└─────────────────┘
```

## 🛠️ Development

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
npm run dev
# Access at http://localhost:5173
```

**Database:**
```bash
docker run -d \
  -e POSTGRES_DB=control_plane \
  -e POSTGRES_USER=control_plane \
  -e POSTGRES_PASSWORD=control_plane \
  -p 5432:5432 \
  postgres:15-alpine
```

### Build Services Individually

**Backend:**
```bash
cd backend
./mvnw clean package
docker build -t control-plane-backend .
```

**Frontend:**
```bash
cd frontend
npm run build
docker build -t control-plane-frontend .
```

## 📋 Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose stop

# Remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Restart service
docker-compose restart [service-name]

# View running services
docker-compose ps
```

## 🔍 Health Checks

All services include health checks:

**PostgreSQL:**
```bash
docker exec control-plane-db pg_isready -U control_plane
```

**Backend:**
```bash
curl http://localhost:8080/api/v1/actuator/health
```

**Frontend:**
```bash
curl http://localhost:3000
```

## 💾 Data Persistence

PostgreSQL data is persisted in a Docker volume:
- Volume name: `postgres_data`
- Location: Managed by Docker

To backup the database:
```bash
docker exec control-plane-db pg_dump -U control_plane control_plane > backup.sql
```

To restore:
```bash
cat backup.sql | docker exec -i control-plane-db psql -U control_plane -d control_plane
```

## 🌐 Networking

All services run on the `control-plane-network` bridge network:
- Services can communicate using container names
- Example: Backend connects to `postgres:5432`

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# Check logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

### Database connection issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker exec -it control-plane-db psql -U control_plane -d control_plane
```

### Port conflicts
If ports are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:80"    # Change frontend port
  - "8081:8080"  # Change backend port
  - "5433:5432"  # Change database port
```

## 📝 Environment Variables

Create a `.env` file in the root directory (see `.env.example`):
```env
POSTGRES_DB=control_plane
POSTGRES_USER=control_plane
POSTGRES_PASSWORD=control_plane
```

## 🔐 Security Notes

**Phase 1 MVP:**
- No authentication required
- CORS configured for local development
- CSRF disabled for REST API

**Production Considerations:**
- Add authentication/authorization
- Use secure passwords
- Enable HTTPS
- Restrict CORS origins
- Enable CSRF protection

## 📚 API Documentation

Base URL: `http://localhost:8080/api/v1`

### Endpoints

**Create Database:**
```bash
POST /databases
Content-Type: application/json

{
  "name": "my-database",
  "port": 5433
}
```

**Get All Databases:**
```bash
GET /databases
```

**Get Database by ID:**
```bash
GET /databases/{id}
```

**Delete Database:**
```bash
DELETE /databases/{id}
```

## 🎯 Phase 1 Features

- ✅ PostgreSQL database provisioning
- ✅ Create, List, Destroy operations
- ✅ Port selection (auto or manual)
- ✅ Status tracking (PROVISIONING, RUNNING, FAILED, etc.)
- ✅ Docker containerization
- ✅ Health checks
- ⏳ Terraform integration (coming soon)

## 📦 Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS 3
- **Backend**: Spring Boot 4, Java 21, Maven
- **Database**: PostgreSQL 15
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (for frontend)

## 📄 License

This is an educational project for learning cloud infrastructure concepts.

## 🤝 Contributing

This is a personal learning project. Feel free to fork and experiment!

## 📞 Support

For issues, check the troubleshooting section or review the logs:
```bash
docker-compose logs -f
```
