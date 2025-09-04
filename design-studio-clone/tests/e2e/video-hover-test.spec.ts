import { test, expect, Page } from '@playwright/test';

test.describe('VideosPanel Hover Overlay', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Click on the Videos tool in the left toolbar to open Videos panel
    const videosButton = page.locator('[data-testid="tool-videos"], [title*="Videos"], button').filter({ hasText: /videos/i }).first();
    if (await videosButton.isVisible()) {
      await videosButton.click();
    } else {
      // Fallback: try to find by position (Videos is typically 7th tool)
      const toolButtons = page.locator('[data-testid^="tool-"], .left-toolbar button').nth(6);
      await toolButtons.click();
    }
    
    // Wait for videos panel to be visible and videos to load
    await page.waitForSelector('[id="videos-scroll-container"]', { timeout: 10000 });
    
    // Wait for videos to load (either from API or fallback to mock data)
    await page.waitForSelector('[draggable="true"]', { timeout: 15000 });
  });

  test('should display video cards with hover overlays', async ({ page }) => {
    // Check that videos panel is visible
    const videosPanel = page.locator('[id="videos-scroll-container"]');
    await expect(videosPanel).toBeVisible();
    
    // Check that video cards are present
    const videoCards = page.locator('[draggable="true"]');
    const cardCount = await videoCards.count();
    expect(cardCount).toBeGreaterThan(0);
    console.log(`Found ${cardCount} video cards`);
    
    // Check that each video card has an overlay element
    for (let i = 0; i < Math.min(cardCount, 5); i++) { // Test first 5 cards
      const videoCard = videoCards.nth(i);
      const overlay = videoCard.locator('.video-overlay');
      await expect(overlay).toBeAttached();
      console.log(`Video card ${i + 1}: Has overlay element`);
    }
  });

  test('should show and hide overlay on hover', async ({ page }) => {
    // Get the first video card
    const firstVideoCard = page.locator('[draggable="true"]').first();
    const overlay = firstVideoCard.locator('.video-overlay');
    
    await expect(firstVideoCard).toBeVisible();
    await expect(overlay).toBeAttached();
    
    // Check initial state - overlay should be hidden
    await expect(overlay).toHaveCSS('opacity', '0');
    console.log('✅ Initial state: Overlay is hidden');
    
    // Hover over the video card
    await firstVideoCard.hover();
    
    // Wait a bit for the transition and check if overlay becomes visible
    await page.waitForTimeout(300); // Wait for CSS transition
    await expect(overlay).toHaveCSS('opacity', '1');
    console.log('✅ Hover state: Overlay is visible');
    
    // Move mouse away to test mouse leave
    await page.locator('body').hover(); // Hover somewhere else
    
    // Wait for transition and check if overlay hides
    await page.waitForTimeout(300);
    await expect(overlay).toHaveCSS('opacity', '0');
    console.log('✅ Mouse leave: Overlay is hidden again');
  });

  test('should display correct overlay content', async ({ page }) => {
    const firstVideoCard = page.locator('[draggable="true"]').first();
    const overlay = firstVideoCard.locator('.video-overlay');
    
    // Hover to make overlay visible
    await firstVideoCard.hover();
    await page.waitForTimeout(300);
    
    // Check overlay content structure
    const overlayText = await overlay.textContent();
    expect(overlayText).toBeTruthy();
    expect(overlayText).toContain('Pexels');
    console.log(`✅ Overlay content: "${overlayText}"`);
    
    // Check that it contains author name (should be more than just "Pexels")
    expect(overlayText?.trim().length).toBeGreaterThan(6); // More than just "Pexels"
  });

  test('should work for multiple video cards', async ({ page }) => {
    const videoCards = page.locator('[draggable="true"]');
    const cardCount = await videoCards.count();
    const testCount = Math.min(cardCount, 3); // Test first 3 cards
    
    for (let i = 0; i < testCount; i++) {
      const videoCard = videoCards.nth(i);
      const overlay = videoCard.locator('.video-overlay');
      
      console.log(`Testing video card ${i + 1}...`);
      
      // Initial hidden state
      await expect(overlay).toHaveCSS('opacity', '0');
      
      // Hover and check visible state
      await videoCard.hover();
      await page.waitForTimeout(200);
      await expect(overlay).toHaveCSS('opacity', '1');
      
      // Check content
      const overlayText = await overlay.textContent();
      expect(overlayText).toContain('Pexels');
      
      console.log(`✅ Video card ${i + 1}: Hover overlay working`);
      
      // Move away
      await page.locator('body').hover();
      await page.waitForTimeout(200);
    }
  });

  test('should take screenshot of hover state', async ({ page }) => {
    // Get viewport size for screenshot
    const viewport = page.viewportSize();
    console.log(`Viewport: ${viewport?.width}x${viewport?.height}`);
    
    // Hover over the first video to show overlay
    const firstVideoCard = page.locator('[draggable="true"]').first();
    await firstVideoCard.hover();
    await page.waitForTimeout(500); // Wait for full transition
    
    // Take a screenshot showing the hover state
    await page.screenshot({ 
      path: 'videos-hover-overlay-test.png',
      fullPage: false
    });
    
    console.log('✅ Screenshot saved: videos-hover-overlay-test.png');
  });
});