// Simple Node.js test for Unsplash service
import axios from 'axios';

const BACKEND_API_URL = 'http://localhost:3001/api/v1';

async function testUnsplashIntegration() {
  console.log('🧪 Testing Unsplash Integration with Backend...\n');

  try {
    // Test 1: Search Photos
    console.log('Test 1: Search Photos');
    const searchResponse = await axios.get(`${BACKEND_API_URL}/photos/search`, {
      params: {
        query: 'nature',
        per_page: 3
      }
    });

    console.log(`✅ Search successful: ${searchResponse.data.total} total results`);
    console.log(`   Page: ${searchResponse.data.page}/${searchResponse.data.total_pages}`);
    console.log(`   Results: ${searchResponse.data.results.length} photos`);
    console.log(`   First photo: ${searchResponse.data.results[0]?.description || 'No description'} by ${searchResponse.data.results[0]?.user.name}`);
    console.log('');

    // Test 2: Trending Photos
    console.log('Test 2: Trending Photos');
    const trendingResponse = await axios.get(`${BACKEND_API_URL}/photos/trending`, {
      params: {
        per_page: 3
      }
    });

    console.log(`✅ Trending successful: ${trendingResponse.data.results.length} photos`);
    console.log(`   Page: ${trendingResponse.data.page}/${trendingResponse.data.total_pages}`);
    console.log(`   First photo: ${trendingResponse.data.results[0]?.description || 'No description'} by ${trendingResponse.data.results[0]?.user.name}`);
    console.log('');

    // Test 3: Get specific photo
    if (searchResponse.data.results.length > 0) {
      const photoId = searchResponse.data.results[0].id;
      console.log(`Test 3: Get Photo by ID (${photoId})`);
      
      const photoResponse = await axios.get(`${BACKEND_API_URL}/photos/${photoId}`);
      console.log(`✅ Photo details retrieved successfully`);
      console.log(`   Photo: ${photoResponse.data.description || 'No description'}`);
      console.log(`   User: ${photoResponse.data.user.name}`);
      console.log(`   Dimensions: ${photoResponse.data.width} x ${photoResponse.data.height}`);
      console.log(`   Likes: ${photoResponse.data.likes}`);
      console.log('');
    }

    // Test 4: Collections
    console.log('Test 4: Collections');
    const collectionsResponse = await axios.get(`${BACKEND_API_URL}/photos/collections`, {
      params: {
        per_page: 2
      }
    });

    console.log(`✅ Collections retrieved: ${collectionsResponse.data.length} collections`);
    if (collectionsResponse.data.length > 0) {
      console.log(`   First collection: ${collectionsResponse.data[0].title} (${collectionsResponse.data[0].total_photos} photos)`);
    }
    console.log('');

    console.log('🎉 All tests passed! Unsplash integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', error.response.data);
    }
  }
}

testUnsplashIntegration();