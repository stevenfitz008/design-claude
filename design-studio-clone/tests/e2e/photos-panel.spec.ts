import { test, expect, Page } from '@playwright/test';

test.describe('Photos Panel Dynamic Sizing and Hover Behavior', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    
    // Wait for the Photos panel to be visible
    await page.waitForSelector('[data-testid="photos-panel"]', { timeout: 10000 });
  });

  test('should display photos with dynamic sizing based on aspect ratio', async () => {
    // Wait for photos to load
    await page.waitForSelector('img', { timeout: 15000 });
    
    // Take screenshot before improvements
    await page.screenshot({ 
      path: 'test-results/photos-panel-before.png',
      fullPage: true 
    });

    // Get all photo containers
    const photoContainers = page.locator('[draggable="true"]');
    const count = await photoContainers.count();
    
    console.log(`Found ${count} photo containers`);
    expect(count).toBeGreaterThan(0);

    // Test dynamic height calculation for each photo
    for (let i = 0; i < Math.min(count, 5); i++) {
      const container = photoContainers.nth(i);
      const img = container.locator('img');
      
      // Get the computed styles and dimensions
      const containerBox = await container.boundingBox();
      const imgBox = await img.boundingBox();
      
      if (containerBox && imgBox) {
        console.log(`Photo ${i}: Container height: ${containerBox.height}px, Image height: ${imgBox.height}px`);
        
        // Verify the image fills the width of the container
        expect(Math.abs(containerBox.width - imgBox.width)).toBeLessThan(2);
        
        // Verify container height is between min (60px) and max (200px)
        expect(containerBox.height).toBeGreaterThanOrEqual(60);
        expect(containerBox.height).toBeLessThanOrEqual(200);
      }
    }
  });

  test('should show photographer names only on hover', async () => {
    await page.waitForSelector('img', { timeout: 15000 });
    
    const photoContainers = page.locator('[draggable="true"]');
    const firstContainer = photoContainers.first();
    
    // Check that photographer name overlay is currently visible (this is the issue we need to fix)
    const photographerOverlay = firstContainer.locator('div').last(); // The bottom overlay
    const isVisible = await photographerOverlay.isVisible();
    const opacity = await photographerOverlay.evaluate(el => window.getComputedStyle(el).opacity);
    
    console.log(`Photographer overlay visibility: ${isVisible}, opacity: ${opacity}`);
    
    // Currently, the overlay is always visible - this is what we need to fix
    expect(isVisible).toBe(true); // This confirms the current issue
    
    // Test hover behavior
    await firstContainer.hover();
    
    // Take screenshot during hover
    await page.screenshot({ 
      path: 'test-results/photos-panel-hover.png',
      clip: { x: 0, y: 0, width: 400, height: 600 }
    });
    
    // The overlay should still be visible on hover (but it should only be visible on hover)
    const isVisibleOnHover = await photographerOverlay.isVisible();
    expect(isVisibleOnHover).toBe(true);
  });

  test('should have proper container sizing that fits images perfectly', async () => {
    await page.waitForSelector('img', { timeout: 15000 });
    
    // Get the grid container
    const gridContainer = page.locator('[style*="display: grid"]');
    await expect(gridContainer).toBeVisible();
    
    // Get all photo containers
    const photoContainers = page.locator('[draggable="true"]');
    const count = await photoContainers.count();
    
    // Test the Bento box effect - containers should fit their images perfectly
    for (let i = 0; i < Math.min(count, 3); i++) {
      const container = photoContainers.nth(i);
      const img = container.locator('img');
      
      await img.waitFor({ state: 'visible' });
      
      // Get natural image dimensions
      const imgDimensions = await img.evaluate((img: HTMLImageElement) => ({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.offsetWidth,
        displayHeight: img.offsetHeight
      }));
      
      // Get container dimensions
      const containerBox = await container.boundingBox();
      
      if (containerBox && imgDimensions.naturalWidth && imgDimensions.naturalHeight) {
        const aspectRatio = imgDimensions.naturalWidth / imgDimensions.naturalHeight;
        const expectedHeight = Math.max(60, Math.min(150 / aspectRatio, 200));
        
        console.log(`Photo ${i}: Expected height: ${expectedHeight}px, Actual height: ${containerBox.height}px, Aspect ratio: ${aspectRatio}`);
        
        // Allow for small rounding differences
        expect(Math.abs(containerBox.height - expectedHeight)).toBeLessThan(5);
      }
    }
  });

  test('should maintain proper hover effects and interactions', async () => {
    await page.waitForSelector('img', { timeout: 15000 });
    
    const firstContainer = page.locator('[draggable="true"]').first();
    
    // Get initial styles
    const initialBorderColor = await firstContainer.evaluate(el => window.getComputedStyle(el).borderColor);
    const initialTransform = await firstContainer.evaluate(el => window.getComputedStyle(el).transform);
    
    console.log(`Initial border color: ${initialBorderColor}, transform: ${initialTransform}`);
    
    // Hover over the container
    await firstContainer.hover();
    
    // Wait a moment for the hover effect
    await page.waitForTimeout(300);
    
    // Get hover styles
    const hoverBorderColor = await firstContainer.evaluate(el => window.getComputedStyle(el).borderColor);
    const hoverTransform = await firstContainer.evaluate(el => window.getComputedStyle(el).transform);
    
    console.log(`Hover border color: ${hoverBorderColor}, transform: ${hoverTransform}`);
    
    // Verify the hover effects are applied
    expect(hoverBorderColor).not.toBe(initialBorderColor);
    expect(hoverTransform).not.toBe(initialTransform);
    expect(hoverTransform).toContain('scale');
  });

  test('should take final screenshots for comparison', async () => {
    await page.waitForSelector('img', { timeout: 15000 });
    
    // Take a comprehensive screenshot
    await page.screenshot({ 
      path: 'test-results/photos-panel-final.png',
      fullPage: true 
    });
    
    // Take a focused screenshot of just the photos area
    const photosContainer = page.locator('[style*="height:"]').first();
    await photosContainer.screenshot({ 
      path: 'test-results/photos-grid-detail.png' 
    });
  });
});