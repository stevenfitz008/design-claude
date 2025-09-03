import { test, expect } from '@playwright/test';

test('Debug Photos Section Issues', async ({ page }) => {
  console.log('Starting Photos section debug test...');
  
  // Navigate to the application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Take initial screenshot
  await page.screenshot({ path: 'photos-debug-1-initial.png', fullPage: true });
  
  // Try to find the Photos button
  console.log('Looking for Photos button...');
  const photosButton = page.locator('[data-testid="tool-photos"]');
  await expect(photosButton).toBeVisible({ timeout: 10000 });
  
  // Click Photos button
  console.log('Clicking Photos button...');
  await photosButton.click();
  await page.waitForTimeout(1000);
  
  // Take screenshot after clicking Photos
  await page.screenshot({ path: 'photos-debug-2-photos-clicked.png', fullPage: true });
  
  // Check if Photos panel is visible
  console.log('Checking Photos panel...');
  const photosGrid = page.locator('[data-testid="photos-grid"]');
  
  if (await photosGrid.isVisible()) {
    console.log('✅ Photos grid is visible');
    
    // Wait for photos to load
    console.log('Waiting for photos to load...');
    await page.waitForTimeout(2000);
    
    // Check for loading state
    const loadingText = page.locator('[data-testid="loading-photos"]');
    if (await loadingText.isVisible()) {
      console.log('⏳ Photos are still loading...');
      await page.waitForTimeout(3000);
    }
    
    // Check for photo items
    const photos = page.locator('[data-testid^="photo-"]');
    const photoCount = await photos.count();
    console.log(`📸 Found ${photoCount} photos`);
    
    if (photoCount > 0) {
      console.log('✅ Photos loaded successfully');
      
      // Test clicking a photo
      console.log('Testing photo click...');
      await photos.first().click();
      await page.waitForTimeout(1000);
      
      // Check for alert or any response
      console.log('✅ Photo click test completed');
    } else {
      console.log('❌ No photos found');
    }
  } else {
    console.log('❌ Photos grid not visible');
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'photos-debug-3-final.png', fullPage: true });
  
  console.log('Photos debug test completed');
});