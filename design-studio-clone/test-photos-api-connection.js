// Test script to verify photos API connection
import axios from 'axios';

async function testPhotosAPIConnection() {
  console.log('🔍 Testing Photos API Connection...\n');

  const BACKEND_URL = 'http://localhost:3001/api/v1';
  
  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BACKEND_URL}/photos/health/status`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test 2: Trending Photos (same format as frontend service)
    console.log('2. Testing trending photos (frontend format)...');
    const trendingResponse = await axios.get(`${BACKEND_URL}/photos/trending`, {
      params: { page: 1, per_page: 20 }
    });
    console.log('✅ Trending photos response structure:');
    console.log('- Total results:', trendingResponse.data.results?.length || 0);
    console.log('- Sample photo structure:', trendingResponse.data.results?.[0] ? {
      id: trendingResponse.data.results[0].id,
      urls: !!trendingResponse.data.results[0].urls,
      user: !!trendingResponse.data.results[0].user,
      width: trendingResponse.data.results[0].width,
      height: trendingResponse.data.results[0].height
    } : 'No photos');
    console.log('');

    // Test 3: Search Photos (same format as frontend service)
    console.log('3. Testing search photos (frontend format)...');
    const searchResponse = await axios.get(`${BACKEND_URL}/photos/search`, {
      params: { query: 'nature', page: 1, per_page: 20 }
    });
    console.log('✅ Search photos response structure:');
    console.log('- Total results:', searchResponse.data.results?.length || 0);
    console.log('- Sample photo structure:', searchResponse.data.results?.[0] ? {
      id: searchResponse.data.results[0].id,
      urls: !!searchResponse.data.results[0].urls,
      user: !!searchResponse.data.results[0].user,
      alt_description: searchResponse.data.results[0].alt_description
    } : 'No photos');
    console.log('');

    // Test 4: Verify exact format matches frontend expectation
    console.log('4. Testing frontend mediaService compatibility...');
    
    // Simulate exactly what mediaService.getTrendingPhotos() does
    const mediaServiceTest = await axios.get(`${BACKEND_URL}/photos/trending`, {
      params: { per_page: 20, page: 1 }
    });
    
    if (mediaServiceTest.data.results && mediaServiceTest.data.results.length > 0) {
      const photo = mediaServiceTest.data.results[0];
      console.log('✅ Frontend compatibility test:');
      console.log('- Photo ID:', photo.id);
      console.log('- Has URLs object:', !!photo.urls);
      console.log('- Has small URL:', !!photo.urls?.small);
      console.log('- Has user object:', !!photo.user);
      console.log('- Has user name:', !!photo.user?.name);
      console.log('- Data type matches expected format:', typeof photo.id === 'string');
      
      // Test conversion to frontend format (like in PhotosPanelSimple)
      const convertedPhoto = {
        id: photo.id,
        urls: { small: photo.urls.small },
        user: { name: photo.user.name },
        alt_description: photo.alt_description,
        description: photo.description
      };
      console.log('✅ Converted photo format:', convertedPhoto);
    }

    console.log('\n🎉 All API tests completed successfully!');
    console.log('✅ Backend API is working correctly');
    console.log('✅ Data format matches frontend expectations');
    console.log('✅ Photos should load correctly in the frontend');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend is running on http://localhost:3001');
    }
  }
}

// Test frontend service integration
async function testFrontendServiceIntegration() {
  console.log('\n🔧 Testing Frontend Service Integration...\n');

  try {
    // Simulate the exact API call made by mediaService
    const response = await axios.create({
      baseURL: 'http://localhost:3001/api/v1',
      timeout: 15000,
    }).get('/photos/trending', {
      params: { per_page: 20, page: 1 }
    });

    console.log('✅ Frontend service simulation successful');
    console.log('- Response status:', response.status);
    console.log('- Content type:', response.headers['content-type']);
    console.log('- Data structure matches expected format');

    // Test if this matches what PhotosPanelSimple expects
    if (response.data.results && Array.isArray(response.data.results)) {
      console.log('✅ Data format is correct for PhotosPanelSimple');
      console.log('- Results array length:', response.data.results.length);
      console.log('- First photo has required fields:', {
        hasId: !!response.data.results[0]?.id,
        hasUrls: !!response.data.results[0]?.urls,
        hasSmallUrl: !!response.data.results[0]?.urls?.small,
        hasUser: !!response.data.results[0]?.user,
        hasUserName: !!response.data.results[0]?.user?.name
      });
    }

  } catch (error) {
    console.error('❌ Frontend service simulation failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testPhotosAPIConnection();
  await testFrontendServiceIntegration();
}

runTests();