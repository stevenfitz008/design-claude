import { test, expect } from '@playwright/test';

test.describe('CanvasContainer forwardRef Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the application to load
    try {
      await page.waitForSelector('[data-testid="app-layout"]', { timeout: 15000 });
    } catch {
      await page.waitForTimeout(3000);
    }
  });

  test('should load without React hooks errors', async ({ page }) => {
    // Monitor console for React errors
    const reactErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('React') || text.includes('hook') || text.includes('Rendered more hooks')) {
          reactErrors.push(text);
        }
      }
    });

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/canvas-ref-initial.png', fullPage: true });

    // Interact with Photos panel to trigger any potential React issues
    const photosButton = page.locator('[data-testid="tool-photos"], .toolbar-item:has-text("Photos"), button:has-text("Photos")').first();
    await expect(photosButton).toBeVisible({ timeout: 10000 });
    await photosButton.click();
    
    // Wait for panel to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/canvas-ref-photos-opened.png', fullPage: true });

    // Try clicking on different panels to test React re-renders
    const textButton = page.locator('[data-testid="tool-text"], .toolbar-item:has-text("Text"), button:has-text("Text")').first();
    if (await textButton.isVisible()) {
      await textButton.click();
      await page.waitForTimeout(1000);
    }

    const shapesButton = page.locator('[data-testid="tool-shapes"], .toolbar-item:has-text("Shapes"), button:has-text("Shapes")').first();
    if (await shapesButton.isVisible()) {
      await shapesButton.click();
      await page.waitForTimeout(1000);
    }

    // Final screenshot
    await page.screenshot({ path: 'test-results/canvas-ref-final.png', fullPage: true });

    // Check for the specific error that was fixed
    const hooksError = reactErrors.filter(error => 
      error.includes('Rendered more hooks than during the previous render')
    );

    console.log('All React errors captured:', reactErrors);
    
    // Assert no hooks rendering errors
    expect(hooksError).toHaveLength(0);
  });

  test('should allow canvas interaction without ref warnings', async ({ page }) => {
    // Monitor for ref warnings
    const refWarnings: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('forwardRef') || text.includes('ref') || text.includes('Function components cannot be given refs')) {
        refWarnings.push(text);
      }
    });

    // Try to hover over canvas area
    const canvasArea = page.locator('[data-testid="main-canvas"], .main-canvas, canvas').first();
    await expect(canvasArea).toBeVisible({ timeout: 10000 });
    
    // Hover over canvas
    await canvasArea.hover();
    await page.waitForTimeout(500);
    
    // Click on canvas
    await canvasArea.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'test-results/canvas-interaction.png', fullPage: true });

    console.log('Ref warnings captured:', refWarnings);
    
    // Should not have ref warnings
    expect(refWarnings).toHaveLength(0);
  });

  test('should have photos with drag functionality ready', async ({ page }) => {
    // Open photos panel
    const photosButton = page.locator('[data-testid="tool-photos"], .toolbar-item:has-text("Photos"), button:has-text("Photos")').first();
    await photosButton.click();
    await page.waitForTimeout(2000);

    // Check if photos are draggable
    const draggablePhotos = await page.locator('[draggable="true"]').count();
    
    console.log(`Found ${draggablePhotos} draggable photo elements`);
    
    // Should have at least some draggable photos
    expect(draggablePhotos).toBeGreaterThan(0);

    // Take screenshot showing draggable photos
    await page.screenshot({ path: 'test-results/draggable-photos.png', fullPage: true });
  });
});