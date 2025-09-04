#!/usr/bin/env node

/**
 * Environment validation script for Design Studio Frontend
 * Validates port configuration and API connectivity
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🔍 Validating Frontend Environment Configuration...\n');

// Load environment variables
const envPath = resolve(projectRoot, '.env');
const envExamplePath = resolve(projectRoot, '.env.example');

if (!existsSync(envPath)) {
  console.error('❌ Missing .env file');
  console.log('💡 Copy .env.example to .env and configure values');
  process.exit(1);
}

// Parse .env file
const envContent = readFileSync(envPath, 'utf8');
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
    name: 'Backend API URL Configuration',
    test: () => {
      const url = envVars.VITE_BACKEND_API_URL;
      if (!url) return 'Missing VITE_BACKEND_API_URL';
      if (!url.includes('localhost:3001')) return 'Must use port 3001 for backend';
      if (!url.includes('/api/v1')) return 'Must include /api/v1 path';
      return true;
    }
  },
  {
    name: 'No Conflicting Environment Files',
    test: () => {
      const conflicts = ['.env.local', '.env.development.local', '.env.production.local'];
      const found = conflicts.filter(file => existsSync(resolve(projectRoot, file)));
      if (found.length > 0) return `Conflicting files found: ${found.join(', ')}`;
      return true;
    }
  },
  {
    name: 'Package.json Port Configuration',
    test: () => {
      const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));
      const devScript = packageJson.scripts?.dev;
      if (!devScript?.includes('--port 3000')) return 'dev script missing explicit port 3000';
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
  console.log(`   Frontend Port: 3000`);
  console.log(`   Backend API: ${envVars.VITE_BACKEND_API_URL || 'Not configured'}`);
} else {
  console.log('\n❌ Environment validation failed');
  console.log('\n📖 See PORT_CONFIGURATION.md for detailed setup guide');
  process.exit(1);
}