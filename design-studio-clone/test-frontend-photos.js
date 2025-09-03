// Test frontend photos integration with browser automation
import { spawn } from 'child_process';
import axios from 'axios';

async function testFrontendPhotos() {
  console.log('🧪 Testing Frontend Photos Panel Integration...\n');

  try {
    // Test 1: Check if frontend is running
    console.log('Test 1: Check Frontend Server');
    try {
      const frontendResponse = await axios.get('http://localhost:5173/', { timeout: 5000 });
      console.log('✅ Frontend is running on port 5173');
    } catch (error) {
      console.log('❌ Frontend not accessible on port 5173');
      return;
    }

    // Test 2: Check if backend is accessible from frontend's perspective
    console.log('\nTest 2: Check Backend API from Frontend');
    try {
      const backendResponse = await axios.get('http://localhost:3001/api/v1/photos/trending?per_page=2', { timeout: 10000 });
      console.log('✅ Backend API is accessible');
      console.log(`   Photos loaded: ${backendResponse.data.results.length}`);
    } catch (error) {
      console.log('❌ Backend API not accessible:', error.message);
      return;
    }

    // Test 3: Check the test HTML page
    console.log('\nTest 3: Check Test HTML Page');
    try {
      const testPageResponse = await axios.get('http://localhost:5173/test-unsplash.html', { timeout: 5000 });
      console.log('✅ Test HTML page is accessible');
    } catch (error) {
      console.log('❌ Test HTML page not accessible:', error.message);
    }

    console.log('\n🎉 Frontend integration tests completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Open http://localhost:5173/test-unsplash.html in your browser');
    console.log('2. Check the browser console for any errors');
    console.log('3. Verify that photos are loading from the backend');
    console.log('4. Test search functionality');
    console.log('5. Open http://localhost:5173/ and navigate to Photos panel');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendPhotos();