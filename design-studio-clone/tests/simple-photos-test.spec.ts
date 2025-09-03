import { test, expect } from '@playwright/test';

test('Photos Panel Basic Functionality', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'review-01-initial.png', fullPage: true });
  
  // Click on Photos tab
  await page.click('button:has-text("Photos")');
  await page.waitForTimeout(2000);
  
  // Take screenshot of Photos panel
  await page.screenshot({ path: 'review-02-photos-panel.png', fullPage: true });
  
  // Test search functionality
  const searchInput = page.locator('input[placeholder="Search photos..."]');
  await searchInput.fill('nature');
  await page.waitForTimeout(2000);
  
  // Take screenshot with search
  await page.screenshot({ path: 'review-03-search.png', fullPage: true });
  
  // Clear search
  await searchInput.clear();
  await page.waitForTimeout(1000);
  
  // Test scrolling in photos panel
  const scrollContainer = page.locator('div[style*="overflowY: auto"]').first();
  await scrollContainer.evaluate((el) => el.scrollTop = el.scrollHeight);
  await page.waitForTimeout(1000);
  
  // Take screenshot after scroll
  await page.screenshot({ path: 'review-04-scrolled.png', fullPage: true });
  
  // Test clicking on a photo (if any exist)
  const photos = page.locator('div[draggable="true"]');
  const photoCount = await photos.count();
  
  if (photoCount > 0) {
    await photos.first().click();
    await page.waitForTimeout(1000);
    
    // Take screenshot after adding photo
    await page.screenshot({ path: 'review-05-photo-added.png', fullPage: true });
  }
  
  console.log(`Found ${photoCount} photos in the panel`);
});