# Design Studio Startup Checklist

This checklist ensures all services are properly started for the Design Studio full-stack application.

## Prerequisites

- [x] Docker installed and running
- [x] Node.js 18+ installed
- [x] npm/yarn package manager available

## Database Services

### MongoDB (Port 27017)
```bash
# Check if MongoDB container exists
docker ps -a | grep mongo

# Start existing container
docker start unruffled_bhabha

# Or create new MongoDB container
docker run -d -p 27017:27017 --name design-studio-mongo mongo:latest

# Verify connection
mongosh --eval "db.adminCommand('ping')"
```

### PostgreSQL (Port 5432)
```bash
# Check if PostgreSQL container exists
docker ps -a | grep postgres

# Start existing container
docker start design-studio-postgres

# Or create new PostgreSQL container
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=design_studio --name design-studio-postgres postgres:latest

# Verify connection
docker exec -it design-studio-postgres psql -U postgres -d design_studio -c "SELECT 1;"
```

## Backend Service (Port 3001)

### Environment Setup
```bash
cd design-studio-backend

# Verify environment file exists
ls -la .env

# Check required environment variables
cat .env | grep -E "(DATABASE_URL|MONGODB_URI|PORT)"
```

### Start Backend Server
```bash
cd design-studio-backend

# Install dependencies (if needed)
npm install

# Generate Prisma client (if needed)
npm run db:generate

# Start development server
npm run start:dev
```

### Verify Backend Health
```bash
# Wait for server to fully start, then test endpoints
curl http://localhost:3001/api/v1/photos/health/status
curl http://localhost:3001/api/v1/videos/health/status
curl http://localhost:3001/api/v1/fonts/health/status

# Access API documentation
open http://localhost:3001/api/docs
```

## Frontend Service (Port 3000)

### Start Frontend Server
```bash
cd design-studio-clone

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

### Verify Frontend
```bash
# Test frontend response
curl -I http://localhost:3000

# Access application
open http://localhost:3000
```

## Startup Order

1. **Database Services First**
   - Start MongoDB container
   - Start PostgreSQL container
   - Verify both databases are responding

2. **Backend Service**
   - Ensure databases are running
   - Start NestJS backend server
   - Wait for all routes to be mapped
   - Verify health endpoints

3. **Frontend Service**
   - Start React/Vite development server
   - Verify application loads

## Health Check Commands

### Quick Status Check
```bash
# Check all containers
docker ps | grep -E "(mongo|postgres)"

# Check all ports
lsof -i :3000,3001,5432,27017

# Test all services
echo "Frontend:" && curl -I http://localhost:3000
echo "Backend:" && curl -s http://localhost:3001/api/v1/photos/health/status
```

### Full System Verification
```bash
# Database connections
mongosh --eval "db.adminCommand('ping')" --quiet
docker exec -it design-studio-postgres psql -U postgres -d design_studio -c "SELECT 1;" -q

# API endpoints sample
curl -s http://localhost:3001/api/v1/photos/health/status | jq .
curl -s http://localhost:3001/api/v1/videos/health/status | jq .
curl -s http://localhost:3001/api/v1/fonts/health/status | jq .
```

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Find process using port
lsof -i :3001
kill -9 <PID>
```

**Database Connection Failed:**
```bash
# Restart database containers
docker restart design-studio-mongo design-studio-postgres

# Check container logs
docker logs design-studio-mongo
docker logs design-studio-postgres
```

**Backend Won't Start:**
```bash
# Check environment variables
cd design-studio-backend && cat .env

# Regenerate Prisma client
npm run db:generate

# Clear node modules
rm -rf node_modules package-lock.json && npm install
```

**Frontend Build Issues:**
```bash
# Clear Vite cache
cd design-studio-clone
rm -rf node_modules/.vite
npm run dev
```

## Service URLs

- **Frontend Application:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Documentation:** http://localhost:3001/api/docs
- **MongoDB:** mongodb://localhost:27017
- **PostgreSQL:** postgresql://postgres:postgres@localhost:5432/design_studio

## Development Workflow

1. Run this checklist to start all services
2. Verify all health checks pass
3. Begin development with hot-reload enabled
4. Use API documentation for backend integration
5. Monitor logs for any errors

## Stopping Services

```bash
# Stop frontend (Ctrl+C in terminal)

# Stop backend (Ctrl+C in terminal)

# Stop database containers
docker stop design-studio-mongo design-studio-postgres

# Or stop all containers
docker stop $(docker ps -q)
```

---

**Last Updated:** September 8, 2025  
**Tested Configuration:** macOS with Docker Desktop, Node.js 18+