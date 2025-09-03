# Design Studio Backend - Suggested Commands

## Development Commands
```bash
# Start development server with hot reload
npm run start:dev

# Start with debug mode
npm run start:debug

# Build for production
npm run build

# Start production server
npm run start:prod
```

## Database Operations
```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and apply database migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed

# Reset database (careful!)
npx prisma migrate reset
```

## Docker Operations
```bash
# Start development environment (PostgreSQL, Redis, MongoDB)
npm run docker:dev

# Stop development environment
npm run docker:down

# View running containers
docker ps

# View logs
docker-compose logs -f
```

## Code Quality
```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Type checking (via build)
npm run build
```

## Testing
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Debug tests
npm run test:debug
```

## Database Utilities (Prisma)
```bash
# View database in browser
npx prisma studio

# Deploy migrations to production
npx prisma migrate deploy

# Generate migration from schema changes
npx prisma migrate dev --name <migration-name>

# Reset database and seed
npx prisma migrate reset --force
```

## System Commands (macOS)
```bash
# View processes on port 3000
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)

# Check system resources
top -o cpu

# Disk usage
du -sh *

# Network connections
netstat -an | grep LISTEN
```