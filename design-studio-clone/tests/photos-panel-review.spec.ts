import { test, expect } from '@playwright/test';

test.describe('Photos Panel Comprehensive Review', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000); // Allow initial load
  });

  test('should load the application and display the Photos tab', async ({ page }) => {
    // Check if the main layout is loaded
    await expect(page.locator('[data-testid="left-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-panel"]')).toBeVisible();
    
    // Click on Photos tab
    await page.locator('button:has-text("Photos")').click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'photos-panel-initial.png',
      fullPage: true 
    });
  });

  test('should display Photos panel with search functionality', async ({ page }) => {
    // Navigate to Photos panel
    await page.locator('button:has-text("Photos")').click();
    await page.waitForTimeout(1000);
    
    // Check Photos panel header
    await expect(page.locator('h3:has-text("Photos")')).toBeVisible();
    
    // Check search input
    const searchInput = page.locator('input[placeholder="Search photos..."]');
    await expect(searchInput).toBeVisible();
    
    // Test search functionality
    await searchInput.fill('nature');
    await page.waitForTimeout(1000); // Wait for debounced search
    
    // Take screenshot of search state
    await page.screenshot({ 
      path: 'photos-panel-search.png',
      fullPage: true 
    });
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(1000);
  });

  test('should display photo grid with proper layout', async ({ page }) => {
    // Navigate to Photos panel
    await page.locator('button:has-text("Photos")').click();
    await page.waitForTimeout(3000); // Allow photos to load
    
    // Check for photo grid
    const photoGrid = page.locator('div').filter({ hasText: 'Photos' }).locator('..').locator('div[style*="display: grid"]');
    await expect(photoGrid).toBeVisible();
    
    // Check if photos are loaded
    const photoElements = page.locator('img[alt*="Unsplash"]');
    const photoCount = await photoElements.count();
    console.log(`Found ${photoCount} photos in the grid`);
    
    // Take screenshot of photo grid
    await page.screenshot({ 
      path: 'photos-panel-grid.png',
      fullPage: true 
    });
    
    // Check individual photo styling
    if (photoCount > 0) {
      const firstPhoto = photoElements.first();
      await firstPhoto.hover();
      await page.waitForTimeout(500);
      
      // Take screenshot of hover state
      await page.screenshot({ 
        path: 'photos-panel-hover.png',
        fullPage: true 
      });
    }
  });

  test('should test infinite scroll functionality', async ({ page }) => {
    // Navigate to Photos panel
    await page.locator('button:has-text("Photos")').click();
    await page.waitForTimeout(3000);
    
    // Find the scrollable container
    const scrollContainer = page.locator('div[style*="overflowY: auto"]').first();
    
    // Get initial photo count
    let initialCount = await page.locator('img[alt*="Unsplash"]').count();
    console.log(`Initial photo count: ${initialCount}`);
    
    // Scroll to bottom to trigger infinite scroll
    await scrollContainer.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    
    await page.waitForTimeout(2000); // Wait for potential new photos
    
    // Check if more photos loaded
    let newCount = await page.locator('img[alt*="Unsplash"]').count();
    console.log(`Photo count after scroll: ${newCount}`);
    
    // Take screenshot after scroll
    await page.screenshot({ 
      path: 'photos-panel-after-scroll.png',
      fullPage: true 
    });
  });

  test('should test drag and drop functionality', async ({ page }) => {
    // Navigate to Photos panel
    await page.locator('button:has-text("Photos")').click();
    await page.waitForTimeout(3000);
    
    // Wait for photos to load
    const photoElements = page.locator('img[alt*="Unsplash"]');
    const photoCount = await photoElements.count();
    
    if (photoCount > 0) {
      const firstPhoto = photoElements.first().locator('..');
      const canvas = page.locator('[data-canvas-container]');
      
      // Get bounding boxes
      const photoBox = await firstPhoto.boundingBox();
      const canvasBox = await canvas.boundingBox();
      
      if (photoBox && canvasBox) {
        // Perform drag and drop
        await page.mouse.move(photoBox.x + photoBox.width / 2, photoBox.y + photoBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
        await page.mouse.up();
        
        await page.waitForTimeout(1000);
        
        // Take screenshot after drag and drop
        await page.screenshot({ 
          path: 'photos-panel-drag-drop.png',
          fullPage: true 
        });
        
        // Check if image was added to canvas
        const canvasImages = page.locator('[data-canvas-container] img');
        const canvasImageCount = await canvasImages.count();
        console.log(`Images on canvas after drag: ${canvasImageCount}`);
      }
    }
  });

  test('should test click to add functionality', async ({ page }) => {
    // Navigate to Photos panel
    await page.locator('button:has-text("Photos")').click();
    await page.waitForTimeout(3000);
    
    // Wait for photos to load
    const photoElements = page.locator('img[alt*="Unsplash"]');
    const photoCount = await photoElements.count();
    
    if (photoCount > 0) {
      // Click on first photo
      const firstPhoto = photoElements.first().locator('..');
      await firstPhoto.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot after click
      await page.screenshot({ 
        path: 'photos-panel-click-add.png',
        fullPage: true 
      });
      
      // Check if image was added to canvas
      const canvasImages = page.locator('[data-canvas-container] img');
      const canvasImageCount = await canvasImages.count();
      console.log(`Images on canvas after click: ${canvasImageCount}`);
    }
  });

  test('should test image manipulation on canvas', async ({ page }) => {
    // Navigate to Photos panel and add an image
    await page.locator('button:has-text("Photos")').click();
    await page.waitForTimeout(3000);
    
    const photoElements = page.locator('img[alt*="Unsplash"]');
    const photoCount = await photoElements.count();
    
    if (photoCount > 0) {
      // Add image to canvas by clicking
      const firstPhoto = photoElements.first().locator('..');
      await firstPhoto.click();
      await page.waitForTimeout(1000);
      
      // Find the image on canvas
      const canvasImage = page.locator('[data-canvas-container] div[style*="position: absolute"]').first();
      
      if (await canvasImage.isVisible()) {
        // Click to select the image
        await canvasImage.click();
        await page.waitForTimeout(500);
        
        // Check if resize handles are visible
        const resizeHandles = page.locator('[data-canvas-container] div[style*="backgroundColor: #48aff0"]');
        const handleCount = await resizeHandles.count();
        console.log(`Resize handles visible: ${handleCount}`);
        
        // Take screenshot with selected image
        await page.screenshot({ 
          path: 'photos-panel-image-selected.png',
          fullPage: true 
        });
        
        // Test double-click to delete
        await canvasImage.dblclick();
        await page.waitForTimeout(500);
        
        // Take screenshot after deletion
        await page.screenshot({ 
          path: 'photos-panel-image-deleted.png',
          fullPage: true 
        });
      }
    }
  });

  test('should compare layout with reference design patterns', async ({ page }) => {
    // Navigate to Photos panel
    await page.locator('button:has-text("Photos")').click();
    await page.waitForTimeout(3000);
    
    // Measure key UI elements
    const leftToolbar = page.locator('[data-testid="left-toolbar"]');
    const rightPanel = page.locator('[data-testid="right-panel"]');
    const mainCanvas = page.locator('[data-testid="main-canvas"]');
    
    const leftBox = await leftToolbar.boundingBox();
    const rightBox = await rightPanel.boundingBox();
    const canvasBox = await mainCanvas.boundingBox();
    
    console.log('Layout measurements:');
    console.log(`Left toolbar width: ${leftBox?.width}px`);
    console.log(`Right panel width: ${rightBox?.width}px`);
    console.log(`Canvas area width: ${canvasBox?.width}px`);
    
    // Take final comparison screenshot
    await page.screenshot({ 
      path: 'photos-panel-final-comparison.png',
      fullPage: true 
    });
    
    // Check panel content structure
    const photosHeader = page.locator('h3:has-text("Photos")');
    const searchInput = page.locator('input[placeholder="Search photos..."]');
    const unsplashCredit = page.locator('text=Photos by Unsplash');
    
    await expect(photosHeader).toBeVisible();
    await expect(searchInput).toBeVisible();
    await expect(unsplashCredit).toBeVisible();
  });
});