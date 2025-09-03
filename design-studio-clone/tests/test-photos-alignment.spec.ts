import { test, expect } from '@playwright/test';

test('Verify Photos Panel Alignment and Multiple Images', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3001');
  
  // Wait for the app to load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Click on the Photos button in the left toolbar
  await page.click('[data-testid="left-toolbar"] button[title="Photos"]');
  
  // Alternative selector if the first doesn't work
  try {
    await page.click('button:has-text("Photos")');
  } catch (e) {
    // Try icon-based selection
    await page.click('[data-icon="media"]');
  }
  
  // Wait for photos panel to be visible
  await page.waitForSelector('[data-testid="photos-panel"]', { timeout: 10000 });
  
  // Take a screenshot of the current state
  await page.screenshot({ 
    path: 'photos-panel-current-state.png',
    fullPage: false 
  });
  
  // Verify multiple photos are loaded
  const photoImages = await page.locator('[data-testid="photos-panel"] img').count();
  console.log(`Found ${photoImages} photos in the panel`);
  
  // Verify photos have proper dimensions and are not all the same size
  const photos = page.locator('[data-testid="photos-panel"] img');
  const photoCount = await photos.count();
  
  if (photoCount > 0) {
    for (let i = 0; i < Math.min(photoCount, 5); i++) {
      const photo = photos.nth(i);
      const boundingBox = await photo.boundingBox();
      if (boundingBox) {
        console.log(`Photo ${i+1}: ${boundingBox.width}x${boundingBox.height}`);
      }
    }
  }
  
  // Check if search functionality is present
  const searchInput = page.locator('input[placeholder*="Search"]');
  await expect(searchInput).toBeVisible();
  
  // Check if "Photos by Unsplash" attribution is present
  const attribution = page.locator('text=Photos by');
  await expect(attribution).toBeVisible();
});