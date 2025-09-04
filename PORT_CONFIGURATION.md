# Port Configuration Guide

## Standard Port Assignment

This project uses standardized ports to prevent conflicts and ensure consistent development experience:

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend (Vite)** | 3000 | http://localhost:3000 | React development server |
| **Backend (NestJS)** | 3001 | http://localhost:3001/api/v1 | Main API server |
| **Preview (Vite)** | 4173 | http://localhost:4173 | Production preview |
| **WebSocket** | 3002 | ws://localhost:3002 | Real-time features |
| **Storybook** | 6006 | http://localhost:6006 | Component library |

## Configuration Files

### Frontend (.env)
```bash
# Backend API Configuration - CRITICAL
VITE_BACKEND_API_URL=http://localhost:3001/api/v1

# Optional configurations
VITE_ENABLE_IMAGE_OPTIMIZATION=true
VITE_ENABLE_VIRTUAL_SCROLLING=true
VITE_IMAGE_CACHE_SIZE=100
```

### Backend (.env)
```bash
# Application port - MUST be 3001
PORT=3001
API_PREFIX=api/v1

# WebSocket port - separate from main app
WS_PORT=3002
WS_PATH=/socket.io

# CORS origins - include both dev and build server ports
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Enforced Configuration

### Package.json Scripts
Both projects have port enforcement in their npm scripts:

**Frontend:**
- `npm run dev` → `vite --port 3000`
- `npm run preview` → `vite preview --port 4173`

**Backend:**
- `npm run start:dev` → `PORT=3001 nest start --watch`
- All start scripts explicitly set `PORT=3001`

### Vite Configuration
```typescript
export default defineConfig({
  server: {
    port: 3000,  // Enforced frontend port
    open: true,
  },
  preview: {
    port: 4173,  // Enforced preview port
  },
});
```

## Validation Commands

Test your configuration:

```bash
# Check frontend configuration
cd design-studio-clone
npm run env:check

# Check backend configuration  
cd design-studio-backend
npm run env:check
```

## Best Practices

### ✅ DO:
- Use the provided npm scripts (`npm run dev`, `npm run start:dev`)
- Keep ports consistent across all environments
- Update CORS settings if ports change
- Test API connectivity after port changes

### ❌ DON'T:
- Run servers on arbitrary ports
- Create conflicting `.env` files
- Modify ports without updating all references
- Skip environment validation

## Troubleshooting

### Common Issues:

1. **API connection fails**: Check `VITE_BACKEND_API_URL` in frontend `.env`
2. **Port conflicts**: Ensure no other services use ports 3000-3002
3. **CORS errors**: Verify `CORS_ORIGINS` includes correct frontend port
4. **Environment priority**: Only use one `.env` file per project directory

### Port Conflict Resolution:
```bash
# Find processes using ports
lsof -ti:3000 -ti:3001 -ti:3002

# Kill conflicting processes if needed
kill $(lsof -ti:3000)
kill $(lsof -ti:3001)
kill $(lsof -ti:3002)
```

## Environment File Priority

Vite loads environment files in this order (higher priority first):
1. `.env.local` (should not exist in this project)
2. `.env.development` (if NODE_ENV=development)
3. `.env`
4. `.env.example` (reference only)

**Important**: Only `.env` and `.env.example` should exist in each project directory.