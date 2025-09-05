import { test, expect } from '@playwright/test';

test.describe('Advanced Canvas System - Final Demo', () => {
  test('Complete Canvas System Working', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the application to load completely
    await page.waitForTimeout(2000);
    
    // Take initial screenshot showing the professional interface
    await page.screenshot({ path: '.playwright-mcp/design-review-final-desktop.png', fullPage: true });
    
    // Test left toolbar functionality
    await page.click('button[title*="Photos"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '.playwright-mcp/photos-panel-final-check.png' });
    
    // Test shapes panel
    await page.click('button[title*="Shapes"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '.playwright-mcp/shapes-panel-final-check.png' });
    
    // Test text panel
    await page.click('button[title*="Text"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '.playwright-mcp/text-panel-final-check.png' });
    
    // Test canvas interaction - click on existing element
    await page.click('canvas', { position: { x: 640, y: 300 } });
    await page.waitForTimeout(500);
    await page.screenshot({ path: '.playwright-mcp/canvas-element-selected.png' });
    
    // Test responsive design - tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '.playwright-mcp/tablet-responsive-768px.png' });
    
    // Test responsive design - mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '.playwright-mcp/mobile-responsive-375px.png' });
    
    // Return to desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    // Final state screenshot
    await page.screenshot({ path: '.playwright-mcp/final-system-state.png', fullPage: true });
    
    // Verify core elements are visible
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('text=Untitled Design')).toBeVisible();
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });
  
  test('Advanced Transform Controls Demonstration', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Click on existing canvas element
    await page.click('canvas', { position: { x: 640, y: 320 } });
    await page.waitForTimeout(500);
    
    // Take screenshot showing selection state
    await page.screenshot({ path: '.playwright-mcp/transform-controls-demo.png' });
    
    // Test hover on different elements
    await page.hover('canvas', { position: { x: 640, y: 180 } }); // Text element
    await page.waitForTimeout(300);
    await page.screenshot({ path: '.playwright-mcp/text-element-hover.png' });
    
    await page.hover('canvas', { position: { x: 630, y: 320 } }); // Shape element  
    await page.waitForTimeout(300);
    await page.screenshot({ path: '.playwright-mcp/shape-element-hover.png' });
  });
});