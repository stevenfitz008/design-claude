#!/bin/bash

# Port Configuration Validation Script
# Validates both frontend and backend environment configurations

echo "🔍 Design Studio Port Configuration Validation"
echo "=============================================="
echo

# Check if projects exist
if [ ! -d "design-studio-clone" ]; then
  echo "❌ Frontend project not found: design-studio-clone/"
  exit 1
fi

if [ ! -d "design-studio-backend" ]; then
  echo "❌ Backend project not found: design-studio-backend/"
  exit 1
fi

echo "📱 Validating Frontend Configuration..."
echo "--------------------------------------"
cd design-studio-clone
if ! npm run env:validate; then
  echo
  echo "❌ Frontend validation failed"
  exit 1
fi

echo
echo "🚀 Validating Backend Configuration..."
echo "-------------------------------------"
cd ../design-studio-backend
if ! npm run env:validate; then
  echo
  echo "❌ Backend validation failed"
  exit 1
fi

cd ..
echo
echo "🎉 All port configurations validated successfully!"
echo
echo "📋 Summary:"
echo "  ✅ Frontend (React + Vite):  http://localhost:3000"
echo "  ✅ Backend (NestJS API):     http://localhost:3001/api/v1"
echo "  ✅ WebSocket Server:         ws://localhost:3002"
echo "  ✅ Preview Server:           http://localhost:4173"
echo
echo "🚀 Ready to start development:"
echo "  Terminal 1: cd design-studio-backend && npm run start:dev"
echo "  Terminal 2: cd design-studio-clone && npm run dev"
echo