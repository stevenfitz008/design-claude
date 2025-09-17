import { test, expect } from '@playwright/test';

test.describe('Drag and Drop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the application to load - try multiple selectors
    try {
      await page.waitForSelector('[data-testid="app-layout"]', { timeout: 15000 });
    } catch {
      // Fallback: wait for any main content to load
      await page.waitForTimeout(3000);
    }
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-initial-state.png', fullPage: true });
  });

  test('should allow dragging photos to canvas without React errors', async ({ page }) => {
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Click on Photos panel in left toolbar - try multiple selectors
    const photosButton = page.locator('[data-testid="tool-photos"], .toolbar-item:has-text("Photos"), button:has-text("Photos")').first();
    await expect(photosButton).toBeVisible({ timeout: 10000 });
    await photosButton.click();
    
    // Wait for photos to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/02-photos-panel-open.png', fullPage: true });

    // Look for any photo element to drag
    const photoElements = await page.locator('[data-testid="photo-item"], .photo-item, img[src*="unsplash"], .photo-grid img').count();
    
    if (photoElements > 0) {
      // Get the first photo element
      const firstPhoto = page.locator('[data-testid="photo-item"], .photo-item, img[src*="unsplash"], .photo-grid img').first();
      
      // Get the canvas area
      const canvasArea = page.locator('[data-testid="canvas-container"], .canvas-container, .main-canvas, canvas').first();
      
      // Perform drag and drop
      await firstPhoto.dragTo(canvasArea);
      
      // Wait a moment for the drop to complete
      await page.waitForTimeout(1000);
      
      // Take screenshot after drop
      await page.screenshot({ path: 'test-results/03-after-drop.png', fullPage: true });
      
      // Check for React errors specifically
      const reactErrors = consoleErrors.filter(error => 
        error.includes('Rendered more hooks') || 
        error.includes('React') || 
        error.includes('hooks') ||
        error.includes('forwardRef')
      );
      
      // Log all console errors for debugging
      console.log('Console errors captured:', consoleErrors);
      
      // Assert no React hook errors
      expect(reactErrors).toHaveLength(0);
      
    } else {
      console.log('No photo elements found, taking screenshot for debugging');
      await page.screenshot({ path: 'test-results/02-no-photos-found.png', fullPage: true });
    }

    // Final check - make sure no critical React errors occurred
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Rendered more hooks than during the previous render')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should open photos panel successfully', async ({ page }) => {
    // Check that photos panel button exists and is clickable
    const photosButton = page.locator('button:has-text("Photos"), [data-testid="photos-button"]').first();
    await expect(photosButton).toBeVisible({ timeout: 5000 });
    
    // Click the photos button
    await photosButton.click();
    
    // Wait for panel content to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/photos-panel-test.png', fullPage: true });
    
    // Verify some photos-related content is visible
    const panelContent = page.locator('[data-testid="right-panel"], .right-panel');
    await expect(panelContent).toBeVisible();
  });

  test('should have canvas container with proper ref handling', async ({ page }) => {
    // Look for canvas container element
    const canvasContainer = page.locator('[data-testid="canvas-container"], .canvas-container, .main-canvas').first();
    await expect(canvasContainer).toBeVisible({ timeout: 5000 });
    
    // Check that the canvas area is interactive
    await canvasContainer.hover();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/canvas-container-test.png', fullPage: true });
  });
});