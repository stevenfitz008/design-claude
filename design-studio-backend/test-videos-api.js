const axios = require('axios');

const BACKEND_URL = 'http://127.0.0.1:3002/api/v1';

async function testVideosAPI() {
  console.log('🎬 Testing Videos API Integration...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing Videos Service Health Check...');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/videos/health/status`);
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 2: Get trending videos
    console.log('2️⃣ Testing Trending Videos...');
    try {
      const trendingResponse = await axios.get(`${BACKEND_URL}/videos/trending`, {
        params: { per_page: 5, page: 1 }
      });
      console.log('✅ Trending videos response:', {
        total_results: trendingResponse.data.total_results,
        videos_count: trendingResponse.data.videos?.length || 0,
        page: trendingResponse.data.page,
        per_page: trendingResponse.data.per_page,
      });
      
      if (trendingResponse.data.videos?.length > 0) {
        const firstVideo = trendingResponse.data.videos[0];
        console.log('📹 First video details:', {
          id: firstVideo.id,
          duration: firstVideo.duration,
          dimensions: `${firstVideo.width}x${firstVideo.height}`,
          user: firstVideo.user?.name,
          video_files_count: firstVideo.video_files?.length || 0
        });
      }
    } catch (error) {
      console.log('❌ Trending videos failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 3: Search videos
    console.log('3️⃣ Testing Video Search...');
    try {
      const searchResponse = await axios.get(`${BACKEND_URL}/videos/search`, {
        params: { 
          query: 'nature',
          per_page: 3,
          page: 1
        }
      });
      console.log('✅ Search videos response:', {
        total_results: searchResponse.data.total_results,
        videos_count: searchResponse.data.videos?.length || 0,
        page: searchResponse.data.page,
        per_page: searchResponse.data.per_page,
        query: 'nature'
      });

      if (searchResponse.data.videos?.length > 0) {
        const firstVideo = searchResponse.data.videos[0];
        console.log('🔍 Search result sample:', {
          id: firstVideo.id,
          duration: firstVideo.duration,
          dimensions: `${firstVideo.width}x${firstVideo.height}`,
          user: firstVideo.user?.name,
          preview_url: firstVideo.preview_url ? 'Available' : 'Missing',
          download_url: firstVideo.download_url ? 'Available' : 'Missing'
        });
      }
    } catch (error) {
      console.log('❌ Video search failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 4: Get specific video (if we have one from trending)
    console.log('4️⃣ Testing Video Details...');
    try {
      // First get a video ID from trending
      const trendingResponse = await axios.get(`${BACKEND_URL}/videos/trending`, {
        params: { per_page: 1, page: 1 }
      });

      if (trendingResponse.data.videos?.length > 0) {
        const videoId = trendingResponse.data.videos[0].id;
        const detailResponse = await axios.get(`${BACKEND_URL}/videos/${videoId}`);
        
        console.log('✅ Video details response:', {
          id: detailResponse.data.id,
          duration: detailResponse.data.duration,
          dimensions: `${detailResponse.data.width}x${detailResponse.data.height}`,
          user: detailResponse.data.user?.name,
          video_files: detailResponse.data.video_files?.map(f => ({
            quality: f.quality,
            file_type: f.file_type,
            size: f.size || 'unknown'
          }))
        });
      } else {
        console.log('⚠️ No trending videos available for detail test');
      }
    } catch (error) {
      console.log('❌ Video details failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ API test suite failed:', error.message);
  }

  console.log('\n🏁 Videos API Test Complete!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testVideosAPI().catch(console.error);
}

module.exports = { testVideosAPI };