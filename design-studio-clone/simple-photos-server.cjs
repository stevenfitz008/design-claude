const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3003;

// CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Unsplash configuration from .env
const UNSPLASH_ACCESS_KEY = 'YFknnyxuQ-rxgU7w2oGqhmd1gjeIDONT2_mSc_ojnk8';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

// Helper function to make Unsplash API calls
async function unsplashRequest(endpoint, params = {}) {
  try {
    const response = await axios.get(`${UNSPLASH_BASE_URL}${endpoint}`, {
      params,
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Unsplash API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Search photos endpoint
app.get('/api/v1/photos/search', async (req, res) => {
  try {
    const { query = 'nature', page = 1, per_page = 20, order_by = 'relevant' } = req.query;
    
    const data = await unsplashRequest('/search/photos', {
      query,
      page: parseInt(page),
      per_page: parseInt(per_page),
      order_by
    });

    res.json({
      total: data.total,
      total_pages: data.total_pages,
      page: parseInt(page),
      per_page: parseInt(per_page),
      results: data.results
    });
  } catch (error) {
    console.error('Search photos error:', error);
    res.status(500).json({ 
      error: 'Failed to search photos', 
      message: error.message 
    });
  }
});

// Trending photos endpoint (using random photos)
app.get('/api/v1/photos/trending', async (req, res) => {
  try {
    const { page = 1, per_page = 20 } = req.query;
    
    const data = await unsplashRequest('/photos', {
      page: parseInt(page),
      per_page: parseInt(per_page),
      order_by: 'popular'
    });

    res.json({
      total: 10000, // Approximate
      total_pages: 500,
      page: parseInt(page),
      per_page: parseInt(per_page),
      results: data
    });
  } catch (error) {
    console.error('Trending photos error:', error);
    res.status(500).json({ 
      error: 'Failed to get trending photos', 
      message: error.message 
    });
  }
});

// Get single photo endpoint
app.get('/api/v1/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await unsplashRequest(`/photos/${id}`);
    
    res.json(data);
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ 
      error: 'Failed to get photo', 
      message: error.message 
    });
  }
});

// Track download endpoint
app.post('/api/v1/photos/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Trigger download tracking with Unsplash
    await unsplashRequest(`/photos/${id}/download`);
    
    res.json({ success: true, message: 'Download tracked' });
  } catch (error) {
    console.error('Track download error:', error);
    // Don't fail the request if tracking fails
    res.json({ success: true, message: 'Download tracking failed but request succeeded' });
  }
});

// Collections endpoint
app.get('/api/v1/photos/collections', async (req, res) => {
  try {
    const { page = 1, per_page = 20 } = req.query;
    
    const data = await unsplashRequest('/collections', {
      page: parseInt(page),
      per_page: parseInt(per_page)
    });

    res.json(data);
  } catch (error) {
    console.error('Collections error:', error);
    res.status(500).json({ 
      error: 'Failed to get collections', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/v1/photos/health/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'photos-api',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 Simple Photos Server running on http://localhost:${port}`);
  console.log(`📸 Unsplash API integration active`);
});