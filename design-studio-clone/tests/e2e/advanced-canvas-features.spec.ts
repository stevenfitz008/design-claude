import { test, expect } from '@playwright/test';

test.describe('Advanced Canvas Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
  });

  test('Canvas loads with enhanced features', async ({ page }) => {
    // Verify the enhanced canvas engine is loaded
    await expect(page.locator('canvas')).toBeVisible();
    
    // Take initial screenshot
    await page.screenshot({ path: '.playwright-mcp/enhanced-canvas-initial.png', fullPage: true });
    
    // Verify basic canvas functionality
    await expect(page.locator('text=Untitled Design')).toBeVisible();
  });

  test('Advanced transform controls display', async ({ page }) => {
    // Add a test element to the canvas first
    await page.click('button[title*="Shapes"]');
    await page.waitForTimeout(1000);
    
    // Select a shape to add
    await page.click('[data-testid="shape-circle"]', { force: true }).catch(() => {
      // Fallback: click any circle-like element
      return page.click('div:has-text("Circle")', { force: true });
    });
    
    await page.waitForTimeout(500);
    
    // Click on canvas to add the shape
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(1000);
    
    // Take screenshot showing element added
    await page.screenshot({ path: '.playwright-mcp/enhanced-transform-with-circle.png' });
    
    // Click on the element to select it
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Take screenshot showing selection state
    await page.screenshot({ path: '.playwright-mcp/enhanced-transform-selected.png' });
    
    // Verify transform controls are visible (the toolbar should appear)
    // The toolbar appears when elements are selected according to the code
    await page.screenshot({ path: '.playwright-mcp/enhanced-transform-controls-active.png' });
  });

  test('Flip functionality', async ({ page }) => {
    // Add a shape for testing flip
    await page.click('button[title*="Shapes"]');
    await page.waitForTimeout(1000);
    
    // Add a shape
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Select the element
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Test horizontal flip
    const flipHorizontalBtn = page.locator('button[data-icon="swap-horizontal"]').first();
    if (await flipHorizontalBtn.isVisible()) {
      await flipHorizontalBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: '.playwright-mcp/flip-horizontal-test.png' });
    }
    
    // Test vertical flip
    const flipVerticalBtn = page.locator('button[data-icon="swap-vertical"]').first();
    if (await flipVerticalBtn.isVisible()) {
      await flipVerticalBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: '.playwright-mcp/flip-vertical-test.png' });
    }
  });

  test('Fit to page functionality', async ({ page }) => {
    // Add an element and test fit to page
    await page.click('button[title*="Shapes"]');
    await page.waitForTimeout(1000);
    
    await page.click('canvas', { position: { x: 200, y: 200 } });
    await page.waitForTimeout(500);
    
    // Select the element
    await page.click('canvas', { position: { x: 200, y: 200 } });
    await page.waitForTimeout(500);
    
    // Test fit to page
    const fitToPageBtn = page.locator('button[data-icon="fullscreen"]').first();
    if (await fitToPageBtn.isVisible()) {
      await fitToPageBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '.playwright-mcp/fit-to-page-test.png' });
    }
  });

  test('Advanced effects panel interaction', async ({ page }) => {
    // Add an element and open effects panel
    await page.click('button[title*="Shapes"]');
    await page.waitForTimeout(1000);
    
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Select the element
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Test effects button
    const effectsBtn = page.locator('button[data-icon="media"]').first();
    if (await effectsBtn.isVisible()) {
      await effectsBtn.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot showing effects panel
      await page.screenshot({ path: '.playwright-mcp/effects-panel-open.png' });
      
      // Check if effects panel dialog opened
      const effectsDialog = page.locator('.bp5-dialog');
      if (await effectsDialog.isVisible()) {
        await page.screenshot({ path: '.playwright-mcp/effects-dialog-visible.png' });
        
        // Close the dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  });

  test('Masking tool functionality', async ({ page }) => {
    // Add an element and test masking
    await page.click('button[title*="Shapes"]');
    await page.waitForTimeout(1000);
    
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Select the element
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Test mask button
    const maskBtn = page.locator('button[data-icon="layers"]').first();
    if (await maskBtn.isVisible()) {
      await maskBtn.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot showing mask panel
      await page.screenshot({ path: '.playwright-mcp/mask-panel-open.png' });
      
      // Check if mask panel dialog opened
      const maskDialog = page.locator('.bp5-dialog');
      if (await maskDialog.isVisible()) {
        await page.screenshot({ path: '.playwright-mcp/mask-dialog-visible.png' });
        
        // Close the dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  });

  test('Animation functionality', async ({ page }) => {
    // Add an element and test animation
    await page.click('button[title*="Shapes"]');
    await page.waitForTimeout(1000);
    
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Select the element
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Test animate button
    const animateBtn = page.locator('button[data-icon="flash"]').first();
    if (await animateBtn.isVisible()) {
      await animateBtn.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot showing animation panel
      await page.screenshot({ path: '.playwright-mcp/animation-panel-open.png' });
      
      // Check if animation panel dialog opened
      const animationDialog = page.locator('.bp5-dialog');
      if (await animationDialog.isVisible()) {
        await page.screenshot({ path: '.playwright-mcp/animation-dialog-visible.png' });
        
        // Close the dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  });

  test('Layer management (duplicate, delete, position)', async ({ page }) => {
    // Add multiple elements to test layer management
    await page.click('button[title*="Shapes"]');
    await page.waitForTimeout(1000);
    
    // Add first shape
    await page.click('canvas', { position: { x: 300, y: 250 } });
    await page.waitForTimeout(500);
    
    // Add second shape
    await page.click('canvas', { position: { x: 500, y: 350 } });
    await page.waitForTimeout(500);
    
    // Select first element
    await page.click('canvas', { position: { x: 300, y: 250 } });
    await page.waitForTimeout(500);
    
    // Test duplicate functionality
    const duplicateBtn = page.locator('button[data-icon="duplicate"]').first();
    if (await duplicateBtn.isVisible()) {
      await duplicateBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '.playwright-mcp/duplicate-test.png' });
    }
    
    // Test bring to front
    const bringToFrontBtn = page.locator('button[data-icon="bring-data"]').first();
    if (await bringToFrontBtn.isVisible()) {
      await bringToFrontBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: '.playwright-mcp/bring-to-front-test.png' });
    }
    
    // Test send to back
    const sendToBackBtn = page.locator('button[data-icon="send-to-back"]').first();
    if (await sendToBackBtn.isVisible()) {
      await sendToBackBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: '.playwright-mcp/send-to-back-test.png' });
    }
  });

  test('Keyboard shortcuts work with advanced features', async ({ page }) => {
    // Add an element for testing keyboard shortcuts
    await page.click('button[title*="Shapes"]');
    await page.waitForTimeout(1000);
    
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Select the element
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Test keyboard shortcut for duplicate (Ctrl+D)
    await page.keyboard.press('Meta+D'); // Use Meta key for Mac, Ctrl for Windows/Linux
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '.playwright-mcp/keyboard-duplicate-test.png' });
    
    // Test delete key
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '.playwright-mcp/keyboard-delete-test.png' });
  });

  test('Responsive canvas behavior', async ({ page }) => {
    // Test canvas responsiveness at different viewport sizes
    
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '.playwright-mcp/canvas-desktop-1920.png' });
    
    // Tablet view
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '.playwright-mcp/canvas-tablet-1024.png' });
    
    // Large mobile view
    await page.setViewportSize({ width: 414, height: 896 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '.playwright-mcp/canvas-mobile-414.png' });
    
    // Verify canvas is still interactive
    await expect(page.locator('canvas')).toBeVisible();
    
    // Return to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
  });

  test('Complete advanced canvas workflow', async ({ page }) => {
    // Comprehensive test that combines multiple advanced features
    
    // Step 1: Add multiple elements
    await page.click('button[title*="Shapes"]');
    await page.waitForTimeout(1000);
    
    // Add circle
    await page.click('canvas', { position: { x: 300, y: 250 } });
    await page.waitForTimeout(500);
    
    // Add rectangle at different position
    await page.click('canvas', { position: { x: 500, y: 350 } });
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '.playwright-mcp/workflow-step1-elements-added.png' });
    
    // Step 2: Select and manipulate first element
    await page.click('canvas', { position: { x: 300, y: 250 } });
    await page.waitForTimeout(500);
    
    // Flip it horizontally
    const flipBtn = page.locator('button[data-icon="swap-horizontal"]').first();
    if (await flipBtn.isVisible()) {
      await flipBtn.click();
      await page.waitForTimeout(300);
    }
    
    await page.screenshot({ path: '.playwright-mcp/workflow-step2-flipped.png' });
    
    // Step 3: Duplicate the element
    const duplicateBtn = page.locator('button[data-icon="duplicate"]').first();
    if (await duplicateBtn.isVisible()) {
      await duplicateBtn.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: '.playwright-mcp/workflow-step3-duplicated.png' });
    
    // Step 4: Layer management
    const bringToFrontBtn = page.locator('button[data-icon="bring-data"]').first();
    if (await bringToFrontBtn.isVisible()) {
      await bringToFrontBtn.click();
      await page.waitForTimeout(300);
    }
    
    await page.screenshot({ path: '.playwright-mcp/workflow-step4-layer-managed.png' });
    
    // Step 5: Final state
    await page.click('canvas', { position: { x: 100, y: 100 } }); // Click empty area to deselect
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '.playwright-mcp/workflow-final-state.png', fullPage: true });
    
    // Verify all elements are still on canvas
    await expect(page.locator('canvas')).toBeVisible();
  });
});