#!/usr/bin/env node

/**
 * Comprehensive API Test Suite for Design Studio Backend
 * 
 * This script tests all major API endpoints to ensure they're functional
 * Run with: node test-apis.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let authToken = '';

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
};

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function request(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function testHealthEndpoints() {
  log('\n🔍 Testing Health Endpoints', 'blue');
  
  const endpoints = [
    '/health',
    '/health/ready',
    '/health/live'
  ];

  for (const endpoint of endpoints) {
    const result = await request('GET', endpoint);
    if (result.success) {
      log(`✅ ${endpoint} - OK`, 'green');
    } else {
      log(`❌ ${endpoint} - Failed: ${JSON.stringify(result.error)}`, 'red');
    }
  }
}

async function testAuthentication() {
  log('\n🔐 Testing Authentication', 'blue');
  
  // Test registration
  const registerResult = await request('POST', '/auth/register', testUser);
  if (registerResult.success || registerResult.status === 409) {
    log('✅ Registration endpoint - OK', 'green');
  } else {
    log(`❌ Registration failed: ${JSON.stringify(registerResult.error)}`, 'red');
  }

  // Test login
  const loginResult = await request('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (loginResult.success && loginResult.data.accessToken) {
    authToken = loginResult.data.accessToken;
    log('✅ Login endpoint - OK', 'green');
  } else {
    log(`❌ Login failed: ${JSON.stringify(loginResult.error)}`, 'red');
    return false;
  }

  return true;
}

async function testProjectsAPI() {
  log('\n📁 Testing Projects API', 'blue');
  
  const authHeaders = { Authorization: `Bearer ${authToken}` };
  
  // Test create project
  const createResult = await request('POST', '/projects', {
    name: 'Test Project',
    description: 'A test project',
    canvasWidth: 1920,
    canvasHeight: 1080
  }, authHeaders);
  
  let projectId = null;
  if (createResult.success && createResult.data?.id) {
    projectId = createResult.data.id;
    log('✅ Create project - OK', 'green');
  } else {
    log(`❌ Create project failed: ${JSON.stringify(createResult.error)}`, 'red');
  }

  // Test get projects
  const getResult = await request('GET', '/projects', null, authHeaders);
  if (getResult.success) {
    log('✅ Get projects - OK', 'green');
  } else {
    log(`❌ Get projects failed: ${JSON.stringify(getResult.error)}`, 'red');
  }

  // Test get single project
  if (projectId) {
    const getSingleResult = await request('GET', `/projects/${projectId}`, null, authHeaders);
    if (getSingleResult.success) {
      log('✅ Get single project - OK', 'green');
    } else {
      log(`❌ Get single project failed: ${JSON.stringify(getSingleResult.error)}`, 'red');
    }
  }

  return projectId;
}

async function testTemplatesAPI() {
  log('\n📄 Testing Templates API', 'blue');
  
  // Test get templates (public endpoint)
  const getResult = await request('GET', '/templates');
  if (getResult.success) {
    log('✅ Get templates - OK', 'green');
  } else {
    log(`❌ Get templates failed: ${JSON.stringify(getResult.error)}`, 'red');
  }

  // Test get categories
  const categoriesResult = await request('GET', '/templates/categories');
  if (categoriesResult.success) {
    log('✅ Get template categories - OK', 'green');
  } else {
    log(`❌ Get template categories failed: ${JSON.stringify(categoriesResult.error)}`, 'red');
  }
}

async function testUploadsAPI() {
  log('\n📤 Testing Uploads API', 'blue');
  
  const authHeaders = { Authorization: `Bearer ${authToken}` };
  
  // Test get signed URL
  const signedUrlResult = await request('POST', '/uploads/signed-url', {
    filename: 'test-image.jpg',
    contentType: 'image/jpeg',
    folder: 'test'
  }, authHeaders);
  
  if (signedUrlResult.success) {
    log('✅ Get signed URL - OK', 'green');
  } else {
    log(`❌ Get signed URL failed: ${JSON.stringify(signedUrlResult.error)}`, 'red');
  }

  // Test get user uploads
  const uploadsResult = await request('GET', '/uploads', null, authHeaders);
  if (uploadsResult.success) {
    log('✅ Get user uploads - OK', 'green');
  } else {
    log(`❌ Get user uploads failed: ${JSON.stringify(uploadsResult.error)}`, 'red');
  }
}

async function testFontsAPI() {
  log('\n🔤 Testing Fonts API', 'blue');
  
  // Test get fonts (public endpoint)
  const fontsResult = await request('GET', '/fonts');
  if (fontsResult.success) {
    log('✅ Get fonts - OK', 'green');
  } else {
    log(`❌ Get fonts failed: ${JSON.stringify(fontsResult.error)}`, 'red');
  }

  // Test search fonts
  const searchResult = await request('GET', '/fonts/search?q=Arial');
  if (searchResult.success) {
    log('✅ Search fonts - OK', 'green');
  } else {
    log(`❌ Search fonts failed: ${JSON.stringify(searchResult.error)}`, 'red');
  }
}

async function testPhotosAPI() {
  log('\n🖼️ Testing Photos API', 'blue');
  
  const authHeaders = { Authorization: `Bearer ${authToken}` };
  
  // Test search photos
  const searchResult = await request('GET', '/photos/search?query=nature&page=1&perPage=10', null, authHeaders);
  if (searchResult.success) {
    log('✅ Search photos - OK', 'green');
  } else {
    log(`❌ Search photos failed: ${JSON.stringify(searchResult.error)}`, 'red');
  }
}

async function testAnimationsAPI() {
  log('\n🎬 Testing Animations API', 'blue');
  
  const authHeaders = { Authorization: `Bearer ${authToken}` };
  
  // First create a project for testing
  const projectResult = await request('POST', '/projects', {
    name: 'Animation Test Project',
    canvasWidth: 800,
    canvasHeight: 600
  }, authHeaders);
  
  if (!projectResult.success) {
    log('❌ Could not create project for animation tests', 'red');
    return;
  }
  
  const projectId = projectResult.data.id;
  
  // Test create timeline
  const timelineResult = await request('POST', '/animations/timelines', {
    projectId: projectId,
    name: 'Test Timeline',
    duration: 10,
    frameRate: 30
  }, authHeaders);
  
  if (timelineResult.success) {
    log('✅ Create timeline - OK', 'green');
  } else {
    log(`❌ Create timeline failed: ${JSON.stringify(timelineResult.error)}`, 'red');
  }
}

async function testDAMAPI() {
  log('\n🗂️ Testing DAM (Digital Asset Management) API', 'blue');
  
  const authHeaders = { Authorization: `Bearer ${authToken}` };
  
  // Test get asset collections
  const collectionsResult = await request('GET', '/dam/collections', null, authHeaders);
  if (collectionsResult.success) {
    log('✅ Get asset collections - OK', 'green');
  } else {
    log(`❌ Get asset collections failed: ${JSON.stringify(collectionsResult.error)}`, 'red');
  }

  // Test search assets
  const searchResult = await request('GET', '/dam/search?query=test', null, authHeaders);
  if (searchResult.success) {
    log('✅ Search assets - OK', 'green');
  } else {
    log(`❌ Search assets failed: ${JSON.stringify(searchResult.error)}`, 'red');
  }
}

async function testExportAPI() {
  log('\n📤 Testing Export API', 'blue');
  
  const authHeaders = { Authorization: `Bearer ${authToken}` };
  
  // First create a project for testing
  const projectResult = await request('POST', '/projects', {
    name: 'Export Test Project',
    canvasWidth: 800,
    canvasHeight: 600
  }, authHeaders);
  
  if (!projectResult.success) {
    log('❌ Could not create project for export tests', 'red');
    return;
  }
  
  const projectId = projectResult.data.id;
  
  // Test create export job
  const exportResult = await request('POST', '/exports', {
    projectId: projectId,
    format: 'PNG',
    width: 800,
    height: 600
  }, authHeaders);
  
  if (exportResult.success) {
    log('✅ Create export job - OK', 'green');
  } else {
    log(`❌ Create export job failed: ${JSON.stringify(exportResult.error)}`, 'red');
  }

  // Test get user exports
  const getExportsResult = await request('GET', '/exports', null, authHeaders);
  if (getExportsResult.success) {
    log('✅ Get user exports - OK', 'green');
  } else {
    log(`❌ Get user exports failed: ${JSON.stringify(getExportsResult.error)}`, 'red');
  }
}

async function runAllTests() {
  log('🚀 Starting Design Studio API Test Suite\n', 'blue');
  
  try {
    await testHealthEndpoints();
    
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      log('\n❌ Authentication failed - skipping protected endpoints', 'red');
      return;
    }

    await testProjectsAPI();
    await testTemplatesAPI();
    await testUploadsAPI();
    await testFontsAPI();
    await testPhotosAPI();
    await testAnimationsAPI();
    await testDAMAPI();
    await testExportAPI();
    
    log('\n🎉 API Testing Complete!', 'green');
    log('\nNote: Some endpoints may fail due to missing external API keys or services.', 'yellow');
    log('This is expected in a development environment.', 'yellow');
    
  } catch (error) {
    log(`\n💥 Test suite crashed: ${error.message}`, 'red');
  }
}

// Run the tests
runAllTests();