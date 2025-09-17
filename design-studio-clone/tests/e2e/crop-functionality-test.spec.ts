import { test, expect } from '@playwright/test';

test.describe('Image Crop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('crop button should activate crop mode and show overlay', async ({ page }) => {
    // Wait for the canvas to be ready
    await page.waitForSelector('canvas');
    
    // Select the image element by clicking on the visible image in the canvas
    // The image appears to be positioned around the right side of the canvas
    await page.click('canvas', { position: { x: 750, y: 270 } });
    
    // Wait for element to be selected and top bar to update
    await page.waitForTimeout(500);
    
    // Take screenshot before crop
    await page.screenshot({ 
      path: 'tests/screenshots/before-crop.png',
      fullPage: false 
    });

    // Look for and click the crop button
    const cropButton = page.locator('button[title*="Crop"], button[title*="crop"]').first();
    await expect(cropButton).toBeVisible();
    await cropButton.click();

    // Wait for crop overlay to appear
    await page.waitForTimeout(1000);
    
    // Take screenshot after crop button click
    await page.screenshot({ 
      path: 'tests/screenshots/after-crop-click.png',
      fullPage: false 
    });

    // Check for crop overlay elements (blue handles)
    const cropHandles = page.locator('rect[fill="#48aff0"]');
    await expect(cropHandles.first()).toBeVisible();
    
    // Verify crop mode is active by checking for crop overlay
    const cropOverlay = page.locator('rect[fill="black"][opacity="0.5"]');
    await expect(cropOverlay.first()).toBeVisible();
    
    // Log success
    console.log('✅ Crop functionality test passed: overlay is visible');
  });

  test('crop state should be synchronized between components', async ({ page }) => {
    // Add debug console logging
    await page.addInitScript(() => {
      window.addEventListener('error', (e) => console.log('Page error:', e.error));
    });

    // Listen for console logs to verify state synchronization
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('crop') || text.includes('Crop') || text.includes('🌾')) {
        logs.push(text);
        console.log('Console log:', text);
      }
    });

    // Select image and start crop
    await page.waitForSelector('canvas');
    await page.click('canvas', { position: { x: 750, y: 270 } });
    await page.waitForTimeout(500);

    // Click crop button
    const cropButton = page.locator('button[title*="Crop"], button[title*="crop"]').first();
    await cropButton.click();
    await page.waitForTimeout(1000);

    // Verify logs show state synchronization
    const relevantLogs = logs.filter(log => 
      log.includes('Canvas Store') || 
      log.includes('CanvasEngine') ||
      log.includes('crop mode')
    );
    
    console.log('Crop state logs:', relevantLogs);
    expect(relevantLogs.length).toBeGreaterThan(0);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/crop-state-sync.png',
      fullPage: false 
    });
  });

  test('should handle crop workflow end-to-end', async ({ page }) => {
    // Start crop workflow
    await page.waitForSelector('canvas');
    await page.click('canvas', { position: { x: 750, y: 270 } });
    await page.waitForTimeout(500);

    // Click crop button
    const cropButton = page.locator('button[title*="Crop"], button[title*="crop"]').first();
    await cropButton.click();
    await page.waitForTimeout(1000);

    // Try to interact with crop handles (drag corner handle)
    const cornerHandle = page.locator('rect[fill="#48aff0"]').first();
    await expect(cornerHandle).toBeVisible();

    // Perform a small drag operation on the corner handle
    const handleBox = await cornerHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width/2, handleBox.y + handleBox.height/2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + 20, handleBox.y + 20);
      await page.mouse.up();
    }

    await page.waitForTimeout(500);

    // Double-click to finish crop (or look for finish button)
    const cropArea = page.locator('rect[fill="transparent"]').last();
    await cropArea.dblclick();
    
    await page.waitForTimeout(1000);

    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/crop-workflow-complete.png',
      fullPage: false 
    });
    
    console.log('✅ Crop workflow test completed');
  });
});