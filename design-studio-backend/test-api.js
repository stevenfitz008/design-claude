const express = require('express');
const app = express();
const port = 3010;

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy'
    }
  });
});

// Mock auth endpoint
app.post('/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: 'mock-user-id',
      email: req.body.email,
      name: req.body.name
    },
    accessToken: 'mock-jwt-token'
  });
});

app.post('/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: 'mock-user-id',
      email: req.body.email,
      name: 'Test User'
    },
    accessToken: 'mock-jwt-token'
  });
});

// Mock projects endpoint
app.get('/projects', (req, res) => {
  res.json({
    data: [
      {
        id: 'project-1',
        name: 'Test Project',
        description: 'A test project',
        canvasWidth: 1920,
        canvasHeight: 1080,
        createdAt: new Date().toISOString()
      }
    ],
    total: 1,
    page: 1,
    pageSize: 20
  });
});

// Mock photos endpoint  
app.get('/photos/search', (req, res) => {
  res.json({
    total: 100,
    total_pages: 5,
    page: 1,
    per_page: 20,
    results: [
      {
        id: 'photo-1',
        description: 'Beautiful landscape',
        urls: {
          regular: 'https://picsum.photos/800/600?random=1',
          small: 'https://picsum.photos/400/300?random=1',
          thumb: 'https://picsum.photos/200/150?random=1'
        },
        user: {
          name: 'Test Photographer'
        }
      }
    ]
  });
});

// Mock fonts endpoint
app.get('/fonts', (req, res) => {
  res.json({
    total: 50,
    page: 1,
    per_page: 20,
    items: [
      {
        family: 'Roboto',
        category: 'sans-serif',
        variants: ['300', '400', '700'],
        css_url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap'
      },
      {
        family: 'Open Sans',
        category: 'sans-serif', 
        variants: ['400', '600', '700'],
        css_url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap'
      }
    ]
  });
});

// Mock templates endpoint
app.get('/templates', (req, res) => {
  res.json({
    total: 25,
    page: 1,
    pageSize: 20,
    data: [
      {
        id: 'template-1',
        name: 'Business Card Template',
        category: 'business',
        dimensions: { width: 400, height: 240, aspectRatio: '5:3' },
        thumbnailUrl: 'https://picsum.photos/400/240?random=template1',
        isPremium: false,
        isFeatured: true
      },
      {
        id: 'template-2',
        name: 'Social Media Post',
        category: 'social-media',
        dimensions: { width: 800, height: 800, aspectRatio: '1:1' },
        thumbnailUrl: 'https://picsum.photos/800/800?random=template2',
        isPremium: true,
        isFeatured: false
      }
    ]
  });
});

app.listen(port, () => {
  console.log(`🚀 Mock API server running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});