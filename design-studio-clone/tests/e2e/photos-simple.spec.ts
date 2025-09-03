import { test, expect, Page } from '@playwright/test';

test.describe('Photos Panel Improvements Verification', () => {
  test('capture improved photos panel state', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on the Photos panel in the left sidebar
    try {
      await page.click('text=Photos');
    } catch (e) {
      // Fallback: try clicking by icon
      console.log('Trying to find and click photos panel by icon');
      await page.click('[title*="Photo"], [aria-label*="Photo"]');
    }
    
    await page.waitForTimeout(2000); // Wait for photos to load
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'test-results/photos-panel-improved.png',
      fullPage: true 
    });
    
    // Try to find photo containers
    const containers = page.locator('[draggable="true"]');
    const count = await containers.count();
    console.log(`Found ${count} photo containers`);
    
    if (count > 0) {
      // Test hover behavior on first photo
      const firstContainer = containers.first();
      await firstContainer.hover();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Photos Panel Infinite Scroll', () => {
  test('should load more photos on scroll', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on the Photos panel in the left sidebar
    try {
      await page.click('text=Photos');
    } catch (e) {
      console.log('Trying to find and click photos panel by icon');
      await page.click('[title*="Photo"], [aria-label*="Photo"]');
    }

    // Click on the "Trending" tab within the photos panel
    await page.click('text=Trending');
    
    // Wait for initial photos to load in the trending panel
    await page.waitForSelector('#trending-scroll-container [draggable="true"]', { timeout: 15000 });
    
    // Get initial photo count
    const initialCount = await page.locator('#trending-scroll-container [draggable="true"]').count();
    console.log(`Initial photo count: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);
    
    // Scroll to the bottom of the photos panel
    const photosPanel = page.locator('#trending-scroll-container');
    await photosPanel.evaluate(el => el.scrollTop = el.scrollHeight);
    
    // Wait for more photos to load
    await page.waitForTimeout(2000);
    
    // Get new photo count
    const newCount = await page.locator('#trending-scroll-container [draggable="true"]').count();
    console.log(`New photo count after scroll: ${newCount}`);
    
    // Verify that more photos have loaded
    expect(newCount).toBeGreaterThan(initialCount);
    
    // Take a screenshot of the scrolled state
    await page.screenshot({ 
      path: 'test-results/photos-panel-scrolled.png',
      fullPage: true 
    });
  });
});
