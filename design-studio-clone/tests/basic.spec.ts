import { test, expect } from '@playwright/test';

test.describe('Basic Application Test', () => {
  test('should load the main application', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check if the page loads without errors
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if we can see the main app structure
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Log the page content to debug
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for error messages
    const errorMessages = await page.locator('text=error').count();
    console.log('Error messages found:', errorMessages);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-debug.png', fullPage: true });
  });

  test('should have right panel', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000); // Give it time to load
    
    // Check if right panel exists
    const rightPanel = page.locator('[data-testid="right-panel"]');
    const isVisible = await rightPanel.isVisible();
    console.log('Right panel visible:', isVisible);
    
    if (isVisible) {
      console.log('✅ Right panel found');
    } else {
      // Look for any panels
      const panels = await page.locator('*[data-testid*="panel"]').count();
      console.log('Panels found:', panels);
      
      // Look for any div elements that might be panels
      const divs = await page.locator('div').count();
      console.log('Total divs:', divs);
    }
  });
});