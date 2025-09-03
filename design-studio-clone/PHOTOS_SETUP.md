# Premium Photos Panel Setup Guide

This guide explains how to set up and configure the premium Photos panel with live Unsplash API integration.

## 🌟 Features Overview

The premium Photos panel includes:

- **Live Unsplash API Integration** - Real photos from the world's largest free photo library
- **Progressive Image Loading** - Blur-to-sharp transitions for smooth UX
- **Advanced Search & Filtering** - Category, orientation, and color filters
- **Sophisticated Drag & Drop** - Drag photos directly onto the canvas
- **Virtual Scrolling** - Smooth performance with thousands of photos
- **Premium Animations** - Micro-interactions and sophisticated transitions
- **Image Effects** - Built-in filters and transformation tools
- **Responsive Design** - Works on all screen sizes
- **Accessibility** - Full ARIA support and keyboard navigation

## 🔧 Setup Instructions

### 1. Get Your Unsplash API Key

1. Visit [Unsplash Developers](https://unsplash.com/developers)
2. Create an account or sign in
3. Click "New Application"
4. Fill out the application form:
   - **Application name**: Your app name (e.g., "Design Studio")
   - **Description**: Brief description of your design tool
   - **Website**: Your website URL (can be localhost for development)
5. Accept the terms and create the application
6. Copy your **Access Key** from the dashboard

### 2. Configure Environment Variables

1. Copy the environment example file:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Unsplash API key to `.env.local`:
   ```env
   VITE_UNSPLASH_ACCESS_KEY=your_actual_access_key_here
   ```

3. Optional configuration:
   ```env
   # Enable image optimization features
   VITE_ENABLE_IMAGE_OPTIMIZATION=true
   
   # Enable virtual scrolling for better performance
   VITE_ENABLE_VIRTUAL_SCROLLING=true
   
   # Set image cache size (number of images to cache)
   VITE_IMAGE_CACHE_SIZE=100
   ```

### 3. Install Dependencies

The premium Photos panel requires these additional dependencies:

```bash
npm install lodash @types/lodash
```

All other dependencies should already be installed.

### 4. Start the Development Server

```bash
npm run dev
```

## 🎮 Usage Guide

### Basic Photo Search

1. Click the "Photos" tool in the left toolbar
2. The panel will load with featured photos by default
3. Use the search bar to find specific photos
4. Apply filters for category, orientation, and color
5. Click any photo to add it to your canvas
6. Or drag photos directly onto the canvas for precise placement

### Advanced Features

#### Drag and Drop
- Click and drag any photo from the panel
- Drop zones will highlight when dragging
- Drop onto the canvas to add at specific position
- Visual feedback shows valid drop areas

#### Image Effects (Canvas)
- Select an image on the canvas
- Access the Image Effects panel
- Adjust brightness, contrast, saturation, hue
- Apply preset filters (Vintage, B&W, Warm, etc.)
- Crop to different aspect ratios
- Flip and rotate images

#### Performance Features
- **Virtual Scrolling**: Handles thousands of photos smoothly
- **Progressive Loading**: Images load with blur-to-sharp transitions
- **Caching**: Recently viewed images are cached for faster access
- **Rate Limiting**: Automatically manages API request limits

## 🔧 Configuration Options

### Image Quality Settings

Control image quality in `src/services/unsplashService.ts`:

```typescript
// Adjust default quality (1-100)
const DEFAULT_QUALITY = 85;

// Modify device pixel ratio multiplier for retina displays
const retinMultiplier = window.devicePixelRatio;
```

### Virtual Scrolling Settings

Customize in `src/components/panels/PhotosPanelPremium.tsx`:

```typescript
const columnWidth = 180; // Width of each photo column
const gap = 16; // Gap between photos
const overscan = 2; // Number of extra rows to render for smooth scrolling
```

### Performance Tuning

For better performance with large image collections:

1. **Reduce per_page**: Lower the number of photos loaded per request
2. **Increase cache size**: Store more images in memory for faster access
3. **Adjust overscan**: Fine-tune virtual scrolling performance

## 🚫 Rate Limits and Best Practices

### Unsplash API Limits

- **Demo Apps**: 50 requests per hour
- **Production Apps**: 5,000 requests per hour (after review)

### Best Practices

1. **Cache Aggressively**: The service automatically caches images
2. **Use Appropriate Sizes**: Request optimal image dimensions for your use case  
3. **Monitor Usage**: Check remaining requests with `unsplashService.getRemainingRequests()`
4. **Attribution**: Always give credit to photographers (handled automatically)
5. **Track Downloads**: The service automatically tracks downloads for analytics

### Fallback Strategy

If the API fails or rate limits are exceeded:

1. The service will attempt to load random photos as a fallback
2. Error messages guide users to retry or browse different categories
3. Graceful degradation ensures the app remains functional

## 🎨 Customization

### Styling

All styles are in styled-components with theme support:

- Modify colors in your theme configuration
- Animations can be customized in component files
- CSS custom properties allow easy color/spacing adjustments

### Adding New Filters

To add new photo filters:

1. Update the `filterPresets` array in `ImageEffectsPanel.tsx`
2. Add corresponding CSS filters in the canvas rendering
3. Update the UI controls as needed

### Search Categories

Customize search categories in `PhotosPanelPremium.tsx`:

```typescript
const categories = [
  { value: 'your-category', label: 'Your Category' },
  // ... other categories
];
```

## 🐛 Troubleshooting

### Common Issues

**Photos not loading:**
- Check your API key in `.env.local`
- Verify the key is valid on Unsplash dashboard
- Check browser console for error messages

**Rate limit exceeded:**
- Wait for the rate limit to reset (shown in panel)
- Consider upgrading to production API limits
- Use cached images when possible

**Drag and drop not working:**
- Ensure the canvas has `data-canvas-container` attribute
- Check that drag handlers are properly attached
- Verify CSS is properly imported

**Performance issues:**
- Reduce the number of photos loaded per page
- Increase virtual scrolling overscan
- Clear image cache periodically

### Debug Mode

Enable debug logging by setting in console:

```javascript
localStorage.setItem('photos-debug', 'true');
```

This will log API requests, cache hits, and performance metrics.

## 🚀 Production Deployment

### Before Going Live

1. **Apply for Production Access** from Unsplash
2. **Update Rate Limits** in the service configuration
3. **Enable Image Optimization** for better performance
4. **Set up Error Monitoring** for API failures
5. **Configure CDN** for cached images (optional)

### Environment Variables for Production

```env
VITE_UNSPLASH_ACCESS_KEY=your_production_key
VITE_ENABLE_IMAGE_OPTIMIZATION=true
VITE_IMAGE_CDN_URL=https://your-cdn.com
VITE_API_BASE_URL=https://your-api.com
```

### Performance Monitoring

Monitor these metrics in production:

- API request count and rate limit usage
- Image loading times and cache hit rates
- User interaction patterns with photos
- Error rates and fallback usage

---

## 📚 API Reference

### UnsplashService Methods

```typescript
// Search photos with filters
searchPhotos(params: UnsplashSearchParams): Promise<UnsplashSearchResponse>

// Get random photos
getRandomPhotos(params?: Partial<UnsplashSearchParams>): Promise<UnsplashPhoto[]>

// Get single photo by ID
getPhoto(id: string): Promise<UnsplashPhoto>

// Get photos from a collection
getCollectionPhotos(id: number, page?: number): Promise<UnsplashPhoto[]>

// Get optimal image URL for specific dimensions
getOptimalImageUrl(photo: UnsplashPhoto, width?: number, height?: number): string

// Generate placeholder URL for loading states
getPlaceholderUrl(photo: UnsplashPhoto, width?: number, height?: number): string

// Track download for attribution
triggerDownload(photo: UnsplashPhoto): Promise<void>

// Check remaining API requests
getRemainingRequests(): number
```

This premium Photos panel provides a professional, production-ready solution for integrating high-quality photography into your design tool.