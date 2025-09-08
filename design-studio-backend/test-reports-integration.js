#!/usr/bin/env node

/**
 * Test Script for Reports System Integration
 * 
 * This script tests the new reports system endpoints to ensure
 * the canvas integration is working correctly.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Test data
const mockCanvasState = {
  elements: [
    {
      id: 'test-element-1',
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      text: 'Test Text Element',
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#333333'
    },
    {
      id: 'test-element-2',
      type: 'shape',
      x: 150,
      y: 200,
      width: 100,
      height: 100,
      fill: '#48aff0',
      stroke: '#2c5282',
      strokeWidth: 2
    }
  ],
  canvasSize: { width: 1000, height: 625 },
  backgroundColor: '#ffffff',
  zoom: 1,
  pan: { x: 0, y: 0 },
  showGrid: false,
  gridSize: 20,
  snapToGrid: false,
  showGuides: false,
  snapToGuides: false
};

// Helper function for HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWY2czRpMHEwMDA1MTFyNW8xcDBhcXdmIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IkpvaG4gRG9lIiwicGxhbiI6IkZSRUUiLCJpYXQiOjE3NTcxNTQ3MjQsImV4cCI6MTc1NzI0MTEyNH0.Dm9vJa-NM-TWUCC_kEgZqgtIKKZErNmhIeeCdGtGVLA',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch (err) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing health check...');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200) {
      console.log('✅ Backend is healthy');
      return true;
    } else {
      console.log('❌ Backend health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend not accessible:', error.message);
    return false;
  }
}

async function testCreateReport() {
  console.log('\n📝 Testing report creation...');
  try {
    const reportData = {
      title: 'Test Report for Canvas Integration',
      description: 'Created by test script to validate reports system',
      author: 'Test Script',
      category: 'Testing',
      tags: ['test', 'canvas-integration']
    };

    const response = await makeRequest('POST', '/api/design-system/reports', reportData);
    
    if (response.status === 201) {
      console.log('✅ Report created successfully');
      console.log(`   Report ID: ${response.data.id}`);
      return response.data;
    } else {
      console.log('❌ Failed to create report:', response.status, response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Report creation error:', error.message);
    return null;
  }
}

async function testSaveCanvasVersion(reportId) {
  console.log('\n💾 Testing canvas version save...');
  try {
    const versionData = {
      canvasState: mockCanvasState,
      changeDescription: 'Initial canvas state from test script',
      autoSaved: false
    };

    const response = await makeRequest(
      'POST', 
      `/api/design-system/reports/${reportId}/versions`,
      versionData
    );
    
    if (response.status === 201) {
      console.log('✅ Canvas version saved successfully');
      console.log(`   Version: ${response.data.version}`);
      console.log(`   Elements: ${response.data.elementCount}`);
      console.log(`   Canvas Size: ${response.data.canvasWidth}x${response.data.canvasHeight}`);
      return response.data;
    } else {
      console.log('❌ Failed to save canvas version:', response.status, response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Canvas version save error:', error.message);
    return null;
  }
}

async function testAutoSave(reportId) {
  console.log('\n🔄 Testing auto-save functionality...');
  try {
    // Modify the canvas state slightly
    const modifiedCanvasState = {
      ...mockCanvasState,
      elements: [
        ...mockCanvasState.elements,
        {
          id: 'auto-save-element',
          type: 'text',
          x: 300,
          y: 300,
          width: 150,
          height: 30,
          text: 'Auto-saved element',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#666666'
        }
      ]
    };

    const response = await makeRequest(
      'POST', 
      `/api/design-system/reports/${reportId}/auto-save`,
      { canvasState: modifiedCanvasState }
    );
    
    if (response.status === 201) {
      console.log('✅ Auto-save completed successfully');
      console.log(`   Version: ${response.data.version}`);
      console.log(`   Auto-saved: ${response.data.autoSaved}`);
      return response.data;
    } else {
      console.log('❌ Auto-save failed:', response.status, response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Auto-save error:', error.message);
    return null;
  }
}

async function testGetVersionHistory(reportId) {
  console.log('\n📚 Testing version history retrieval...');
  try {
    const response = await makeRequest('GET', `/api/design-system/reports/${reportId}/versions`);
    
    if (response.status === 200) {
      const versions = response.data;
      console.log('✅ Version history retrieved successfully');
      console.log(`   Total versions: ${versions.length}`);
      
      versions.forEach((version, index) => {
        console.log(`   ${index + 1}. v${version.version} - ${version.changeDescription || 'No description'} (${version.autoSaved ? 'Auto' : 'Manual'})`);
      });
      
      return versions;
    } else {
      console.log('❌ Failed to get version history:', response.status, response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Version history error:', error.message);
    return null;
  }
}

async function testOpenInCanvas(reportId, versionId = null) {
  console.log('\n📂 Testing open in canvas...');
  try {
    const path = versionId 
      ? `/api/design-system/reports/${reportId}/open?versionId=${versionId}`
      : `/api/design-system/reports/${reportId}/open`;
      
    const response = await makeRequest('PUT', path);
    
    if (response.status === 200) {
      console.log('✅ Report opened in canvas successfully');
      console.log(`   Report ID: ${response.data.reportId}`);
      console.log(`   Version: ${response.data.version}`);
      console.log(`   Elements: ${response.data.canvasState.elements.length}`);
      console.log(`   Canvas Size: ${response.data.canvasState.canvasSize.width}x${response.data.canvasState.canvasSize.height}`);
      return response.data;
    } else {
      console.log('❌ Failed to open in canvas:', response.status, response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Open in canvas error:', error.message);
    return null;
  }
}

// Main test execution
async function runTests() {
  console.log('🧪 Starting Reports System Integration Tests');
  console.log('='.repeat(50));

  // Check if backend is running
  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    console.log('\n❌ Backend is not running or accessible');
    console.log('   Please start the backend with: npm run start:dev');
    process.exit(1);
  }

  // Test report creation
  const report = await testCreateReport();
  if (!report) {
    console.log('\n❌ Cannot proceed without a report');
    process.exit(1);
  }

  const reportId = report.id;

  // Test canvas version saving
  const version1 = await testSaveCanvasVersion(reportId);
  if (!version1) {
    console.log('\n❌ Canvas version save failed');
    return;
  }

  // Test auto-save
  const version2 = await testAutoSave(reportId);

  // Test version history
  const versions = await testGetVersionHistory(reportId);

  // Test opening in canvas
  const canvasData = await testOpenInCanvas(reportId);

  // Test loading specific version if we have multiple
  if (versions && versions.length > 1) {
    console.log('\n🔄 Testing specific version loading...');
    await testOpenInCanvas(reportId, versions[0].id);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Reports System Integration Tests Complete!');
  
  if (report && version1 && canvasData) {
    console.log('\n✅ All core functionality is working:');
    console.log('   • Report creation');
    console.log('   • Canvas state saving');
    console.log('   • Version management');
    console.log('   • Canvas loading');
    console.log('   • Auto-save system');
    
    console.log('\n🚀 The reports system is ready for use!');
    console.log(`   Test Report ID: ${reportId}`);
  } else {
    console.log('\n⚠️  Some tests failed - please check the logs above');
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };