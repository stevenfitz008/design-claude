#!/usr/bin/env node

/**
 * Environment validation script for Design Studio Backend
 * Validates port configuration and service availability
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 Validating Backend Environment Configuration...\n');

// Load environment variables
const envPath = path.resolve(projectRoot, '.env');
const envExamplePath = path.resolve(projectRoot, '.env.example');

if (!fs.existsSync(envPath)) {
  console.error('❌ Missing .env file');
  console.log('💡 Copy .env.example to .env and configure values');
  process.exit(1);
}

// Parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
});

// Validation checks
const checks = [
  {
    name: 'Main Application Port',
    test: () => {
      const port = envVars.PORT;
      if (!port) return 'Missing PORT variable';
      if (port !== '3001') return `Port must be 3001, got ${port}`;
      return true;
    }
  },
  {
    name: 'WebSocket Port Separation',
    test: () => {
      const wsPort = envVars.WS_PORT;
      const appPort = envVars.PORT;
      if (!wsPort) return 'Missing WS_PORT variable';
      if (wsPort === appPort) return 'WebSocket port must be different from app port';
      if (wsPort !== '3002') return `WebSocket port should be 3002, got ${wsPort}`;
      return true;
    }
  },
  {
    name: 'CORS Configuration',
    test: () => {
      const origins = envVars.CORS_ORIGINS;
      if (!origins) return 'Missing CORS_ORIGINS';
      if (!origins.includes('localhost:3000')) return 'Must allow frontend port 3000';
      return true;
    }
  },
  {
    name: 'API Prefix Configuration',
    test: () => {
      const prefix = envVars.API_PREFIX;
      if (!prefix) return 'Missing API_PREFIX';
      if (prefix !== 'api/v1') return `API prefix should be 'api/v1', got '${prefix}'`;
      return true;
    }
  },
  {
    name: 'Package.json Scripts',
    test: () => {
      const packageJson = JSON.parse(fs.readFileSync(path.resolve(projectRoot, 'package.json'), 'utf8'));
      const startScript = packageJson.scripts?.['start:dev'];
      if (!startScript?.includes('PORT=3001')) return 'start:dev script missing PORT=3001';
      return true;
    }
  }
];

// Run checks
let allPassed = true;
checks.forEach(check => {
  const result = check.test();
  if (result === true) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name}: ${result}`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\n🎉 All environment checks passed!');
  console.log('\n📋 Current Configuration:');
  console.log(`   Application Port: ${envVars.PORT}`);
  console.log(`   WebSocket Port: ${envVars.WS_PORT}`);
  console.log(`   API Prefix: ${envVars.API_PREFIX}`);
  console.log(`   CORS Origins: ${envVars.CORS_ORIGINS}`);
} else {
  console.log('\n❌ Environment validation failed');
  console.log('\n📖 See ../PORT_CONFIGURATION.md for detailed setup guide');
  process.exit(1);
}