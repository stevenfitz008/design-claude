import { chromium } from 'playwright';
import fs from 'fs';

async function reviewDesignStudio() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to localhost:3001...');
    await page.goto('http://localhost:3001');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
    
    // Take initial screenshot
    await page.screenshot({ path: 'app-with-components.png', fullPage: true });
    console.log('Screenshot taken: app-with-components.png');
    
    // Check for Photos tool and click it
    console.log('Looking for Photos tool...');
    const photosTool = page.locator('[data-testid="tool-photos"]').first();
    if (await photosTool.isVisible()) {
      console.log('Found Photos tool, clicking...');
      await photosTool.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of Photos panel
      await page.screenshot({ path: 'photos-panel.png', fullPage: true });
      console.log('Photos panel screenshot taken: photos-panel.png');
      
      // Check for photos grid
      const photosGrid = page.locator('[data-testid="photos-grid"]');
      if (await photosGrid.isVisible()) {
        console.log('Photos grid is visible');
        
        // Wait for photos to load
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'photos-loaded.png', fullPage: true });
        console.log('Photos loaded screenshot taken: photos-loaded.png');
      }
    } else {
      console.log('Photos tool not found');
    }
    
    // Test responsiveness - tablet viewport
    console.log('Testing tablet viewport (768px)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tablet-view.png', fullPage: true });
    
    // Test responsiveness - mobile viewport 
    console.log('Testing mobile viewport (375px)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'mobile-view.png', fullPage: true });
    
    // Test search functionality
    console.log('Testing search functionality...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('input[placeholder="Search photos..."]').fill('mountain');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'search-test.png', fullPage: true });
    
    console.log('All screenshots captured successfully!');
    
  } catch (error) {
    console.error('Error during review:', error);
  }
  
  await browser.close();
}

reviewDesignStudio();