import { test, expect } from '@playwright/test';

test.describe('Canvas Debug', () => {
  test('Debug canvas loading', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Take initial screenshot
    await page.screenshot({ path: '.playwright-mcp/canvas-debug-initial.png', fullPage: true });
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    
    // Check what elements are present
    const canvasElements = await page.locator('canvas').count();
    console.log('Canvas elements found:', canvasElements);
    
    // Take another screenshot
    await page.screenshot({ path: '.playwright-mcp/canvas-debug-after-wait.png', fullPage: true });
    
    // Check for any error messages in console
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.waitForTimeout(2000);
    
    console.log('Console messages:', logs);
    
    // Look for any canvas in the DOM tree
    const canvasLocator = page.locator('canvas');
    if (await canvasLocator.count() > 0) {
      console.log('Canvas found!');
      await expect(canvasLocator.first()).toBeVisible();
    } else {
      console.log('No canvas found. Checking for konva container...');
      const konvaContainer = page.locator('.konvajs-content');
      if (await konvaContainer.count() > 0) {
        console.log('Konva container found');
      } else {
        console.log('No konva container found');
      }
    }
    
    // Check if there are any React errors
    const errorBoundary = page.locator('text=Something went wrong');
    if (await errorBoundary.count() > 0) {
      console.log('React error boundary triggered');
    }
  });
});