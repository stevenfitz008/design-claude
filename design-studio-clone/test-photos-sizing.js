import { chromium } from 'playwright';

async function testPhotosPanelSizing() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Click on photos tool to activate photos panel
    console.log('Looking for photos tool...');
    
    // Try different selectors for the photos tool
    const photosSelectors = [
      '[data-testid="photos-tool"]',
      'button:has-text("Photos")',
      '[title="Photos"]',
      'button[aria-label*="photo"]',
      '.left-toolbar button:nth-child(2)', // Assuming photos is second button
    ];
    
    let clicked = false;
    for (const selector of photosSelectors) {
      const button = page.locator(selector);
      const count = await button.count();
      console.log(`Selector "${selector}" found ${count} elements`);
      
      if (count > 0) {
        await button.first().click();
        await page.waitForTimeout(1000);
        clicked = true;
        console.log('✅ Clicked photos tool');
        break;
      }
    }
    
    if (!clicked) {
      // List all buttons to see what's available
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      console.log(`Found ${buttonCount} buttons total`);
      
      for (let i = 0; i < Math.min(10, buttonCount); i++) {
        const button = allButtons.nth(i);
        const text = await button.textContent();
        const title = await button.getAttribute('title');
        console.log(`Button ${i}: text="${text}", title="${title}"`);
      }
    }
    
    // Check if photos panel exists and get its dimensions
    const photosPanel = page.locator('[data-testid="photos-panel"]');
    if (await photosPanel.count() > 0) {
      const panelBox = await photosPanel.boundingBox();
      console.log('Photos panel dimensions:', panelBox);
      
      // Check search input sizing
      const searchInput = photosPanel.locator('input[placeholder="Search photos..."]');
      if (await searchInput.count() > 0) {
        const searchBox = await searchInput.boundingBox();
        console.log('Search input dimensions:', searchBox);
        console.log('Search input width ratio:', searchBox.width / panelBox.width);
      }
      
      // Check photos grid container
      const photosGrid = photosPanel.locator('div').filter({ hasText: /Loading photos|No photos found/ }).or(
        photosPanel.locator('div').filter({ has: page.locator('img') }).first()
      );
      
      if (await photosGrid.count() > 0) {
        const gridBox = await photosGrid.boundingBox();
        console.log('Photos grid dimensions:', gridBox);
        console.log('Grid fills panel:', (gridBox.width / panelBox.width).toFixed(2));
      }
      
      // Check if photos are loading
      const photos = photosPanel.locator('img');
      const photoCount = await photos.count();
      console.log('Number of photos loaded:', photoCount);
      
      if (photoCount > 0) {
        // Check first few photos dimensions
        for (let i = 0; i < Math.min(3, photoCount); i++) {
          const photo = photos.nth(i);
          const photoBox = await photo.boundingBox();
          console.log(`Photo ${i + 1} dimensions:`, photoBox);
        }
      }
      
    } else {
      console.log('Photos panel not found - checking right panel structure');
      
      // Check if right panel exists
      const rightPanel = page.locator('.right-panel').or(page.locator('[style*="padding: 16px"]'));
      if (await rightPanel.count() > 0) {
        const rightPanelBox = await rightPanel.boundingBox();
        console.log('Right panel dimensions:', rightPanelBox);
        
        // Check panel content
        const panelContent = await rightPanel.textContent();
        console.log('Right panel content preview:', panelContent?.substring(0, 200));
      }
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'photos-panel-sizing-test.png', 
      fullPage: false 
    });
    
    console.log('✅ Test completed - screenshot saved as photos-panel-sizing-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await page.waitForTimeout(3000); // Keep browser open for manual inspection
    await browser.close();
  }
}

testPhotosPanelSizing();