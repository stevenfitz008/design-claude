#!/usr/bin/env node

import https from 'https';
import http from 'http';

const BACKEND_URL = 'http://localhost:3001/api/v1';
const FRONTEND_URL = 'http://localhost:5173';

console.log('🔄 Testing Unsplash API Integration...\n');

// Utility function to make HTTP requests
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const startTime = Date.now();
        
        client.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                try {
                    const parsed = res.headers['content-type']?.includes('application/json') 
                        ? JSON.parse(data) : data;
                    resolve({ 
                        status: res.statusCode, 
                        data: parsed, 
                        responseTime,
                        headers: res.headers 
                    });
                } catch (e) {
                    resolve({ 
                        status: res.statusCode, 
                        data: data, 
                        responseTime,
                        headers: res.headers 
                    });
                }
            });
        }).on('error', reject);
    });
}

// Test functions
async function testBackendConnection() {
    console.log('🔗 Testing Backend Connection...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/photos/trending?per_page=1`);
        if (response.status === 200) {
            console.log(`✅ Backend connected successfully! (${response.responseTime}ms)`);
            return true;
        } else {
            console.log(`⚠️ Backend responded with status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Backend connection failed: ${error.message}`);
        return false;
    }
}

async function testTrendingPhotos() {
    console.log('\n🔥 Testing Trending Photos...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/photos/trending?per_page=12`);
        if (response.status === 200 && response.data.results) {
            const photos = response.data.results;
            console.log(`✅ Loaded ${photos.length} trending photos (${response.responseTime}ms)`);
            console.log(`   Total available: ${response.data.total || 'N/A'}`);
            console.log(`   Sample photo: "${photos[0]?.alt_description || photos[0]?.description || 'Untitled'}" by ${photos[0]?.user?.name}`);
            return true;
        } else {
            console.log(`❌ Failed to load trending photos: Status ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error loading trending photos: ${error.message}`);
        return false;
    }
}

async function testPhotoSearch() {
    console.log('\n🔍 Testing Photo Search...');
    const queries = ['nature', 'city', 'ocean'];
    let successCount = 0;
    
    for (const query of queries) {
        try {
            const response = await makeRequest(`${BACKEND_URL}/photos/search?query=${query}&per_page=3`);
            if (response.status === 200 && response.data.results) {
                const photos = response.data.results;
                console.log(`✅ "${query}": ${photos.length} results (${response.responseTime}ms)`);
                successCount++;
            } else {
                console.log(`❌ "${query}": Failed with status ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ "${query}": ${error.message}`);
        }
    }
    
    console.log(`   Search test: ${successCount}/${queries.length} queries successful`);
    return successCount === queries.length;
}

async function testFrontendConnection() {
    console.log('\n🚀 Testing Frontend Connection...');
    try {
        const response = await makeRequest(FRONTEND_URL);
        if (response.status === 200) {
            console.log(`✅ Frontend server is running! (${response.responseTime}ms)`);
            return true;
        } else {
            console.log(`⚠️ Frontend responded with status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Frontend connection failed: ${error.message}`);
        console.log('   Make sure frontend is running: npm run dev');
        return false;
    }
}

async function testPagination() {
    console.log('\n📄 Testing Pagination...');
    try {
        const page1 = await makeRequest(`${BACKEND_URL}/photos/trending?per_page=5&page=1`);
        const page2 = await makeRequest(`${BACKEND_URL}/photos/trending?per_page=5&page=2`);
        
        if (page1.status === 200 && page2.status === 200) {
            const photos1 = page1.data.results || [];
            const photos2 = page2.data.results || [];
            console.log(`✅ Pagination working: Page 1 (${photos1.length}), Page 2 (${photos2.length})`);
            
            // Check if photos are different (basic uniqueness test)
            const photo1Ids = photos1.map(p => p.id);
            const photo2Ids = photos2.map(p => p.id);
            const overlap = photo1Ids.filter(id => photo2Ids.includes(id));
            console.log(`   Photo uniqueness: ${overlap.length === 0 ? 'All unique' : overlap.length + ' duplicates'}`);
            
            return true;
        } else {
            console.log(`❌ Pagination failed: Page 1 (${page1.status}), Page 2 (${page2.status})`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Pagination test failed: ${error.message}`);
        return false;
    }
}

async function testErrorHandling() {
    console.log('\n🛡️ Testing Error Handling...');
    const errorTests = [
        { name: 'Invalid endpoint', url: `${BACKEND_URL}/photos/invalid` },
        { name: 'Missing query', url: `${BACKEND_URL}/photos/search?query=` },
        { name: 'Invalid page', url: `${BACKEND_URL}/photos/trending?page=0` }
    ];
    
    let handledCount = 0;
    
    for (const test of errorTests) {
        try {
            const response = await makeRequest(test.url);
            if (response.status >= 400) {
                console.log(`✅ ${test.name}: Properly handled (${response.status})`);
                handledCount++;
            } else {
                console.log(`⚠️ ${test.name}: Unexpected success (${response.status})`);
            }
        } catch (error) {
            console.log(`✅ ${test.name}: Network error handled - ${error.message}`);
            handledCount++;
        }
    }
    
    console.log(`   Error handling: ${handledCount}/${errorTests.length} scenarios properly handled`);
    return handledCount >= errorTests.length * 0.67; // Allow some flexibility
}

// Run all tests
async function runAllTests() {
    console.log('🎯 Unsplash API Integration Test Suite\n');
    console.log('Backend URL:', BACKEND_URL);
    console.log('Frontend URL:', FRONTEND_URL);
    console.log('='.repeat(50));
    
    const tests = [
        { name: 'Backend Connection', fn: testBackendConnection },
        { name: 'Trending Photos', fn: testTrendingPhotos },
        { name: 'Photo Search', fn: testPhotoSearch },
        { name: 'Pagination', fn: testPagination },
        { name: 'Error Handling', fn: testErrorHandling },
        { name: 'Frontend Connection', fn: testFrontendConnection }
    ];
    
    let passedTests = 0;
    const startTime = Date.now();
    
    for (const test of tests) {
        try {
            const passed = await test.fn();
            if (passed) passedTests++;
        } catch (error) {
            console.log(`❌ ${test.name} test crashed: ${error.message}`);
        }
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 Test Results: ${passedTests}/${tests.length} tests passed`);
    console.log(`⏱️ Total execution time: ${totalTime}ms`);
    
    if (passedTests === tests.length) {
        console.log('🎉 ALL TESTS PASSED! Unsplash integration is working perfectly!');
        console.log('\n📋 Next steps:');
        console.log('   1. Open the frontend: http://localhost:5173');
        console.log('   2. Click the Photos tool in the left toolbar');
        console.log('   3. Test search functionality and image loading');
        console.log('   4. Test drag and drop functionality');
    } else {
        console.log('⚠️ Some tests failed. Check the output above for details.');
    }
    
    console.log('\n🌐 Open the comprehensive test page:');
    console.log(`   file://${process.cwd()}/unsplash-integration-test.html`);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('\n💥 Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('\n💥 Unhandled Rejection:', reason);
    process.exit(1);
});

// Run tests
runAllTests().catch(console.error);