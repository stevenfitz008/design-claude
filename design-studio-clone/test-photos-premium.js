import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Testing PhotosPanelPremium integration...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1400, height: 900 });
    
    console.log('📱 Navigating to localhost:3000...');
    
    // Navigate to the app with error handling
    try {
      await page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
    } catch (error) {
      console.error('❌ Failed to load the app:', error.message);
      return;
    }
    
    console.log('✅ App loaded successfully');
    
    // Wait for the app to initialize
    await page.waitForTimeout(2000);
    
    // Look for the photos button in the left toolbar and click it
    console.log('📷 Looking for Photos button...');
    
    const photosButton = page.locator('[data-testid*="photo"], [title*="Photo"], button:has-text("Photos"), [aria-label*="photo"]').first();
    
    if (await photosButton.isVisible({ timeout: 5000 })) {
      console.log('✅ Found Photos button, clicking...');
      await photosButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️  Photos button not found, checking if photos panel is already active');
    }
    
    // Check if PhotosPanelPremium is loaded
    console.log('🔍 Checking for PhotosPanelPremium components...');
    
    const photosPanel = await page.locator('[data-testid="photos-grid"], .virtual-scroll-container, .search-input').first();
    
    if (await photosPanel.isVisible({ timeout: 5000 })) {
      console.log('✅ PhotosPanelPremium is loaded!');
      
      // Take a screenshot
      await page.screenshot({ 
        path: 'photos-premium-integration.png',
        fullPage: false
      });
      console.log('📸 Screenshot saved as photos-premium-integration.png');
      
      // Check for search functionality
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        console.log('✅ Search input found');
        await searchInput.fill('nature');
        await page.waitForTimeout(2000);
        console.log('🔍 Searched for "nature"');
        
        // Take another screenshot with search results
        await page.screenshot({ 
          path: 'photos-premium-search.png',
          fullPage: false
        });
        console.log('📸 Search screenshot saved as photos-premium-search.png');
      }
      
      // Check for photo grid
      const photoGrid = page.locator('[data-testid="photos-grid"], .virtual-scroll-container');
      if (await photoGrid.isVisible()) {
        console.log('✅ Photo grid is visible');
      }
      
      // Look for any error messages
      const errorElements = await page.locator('.error-overlay, .error-message, [data-testid*="error"]').all();
      if (errorElements.length > 0) {
        console.log('⚠️  Found error elements:', errorElements.length);
      } else {
        console.log('✅ No error elements found');
      }
      
    } else {
      console.log('❌ PhotosPanelPremium not found - might still be using SimplePhotosPanel');
      
      // Take a screenshot anyway
      await page.screenshot({ 
        path: 'photos-panel-current.png',
        fullPage: false
      });
      console.log('📸 Current state screenshot saved as photos-panel-current.png');
    }
    
    console.log('🎉 PhotosPanelPremium integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take error screenshot
    const page = await browser.newPage();
    try {
      await page.goto('http://localhost:3000', { timeout: 10000 });
      await page.screenshot({ path: 'photos-premium-error.png' });
      console.log('📸 Error screenshot saved');
    } catch (e) {
      console.log('Could not capture error screenshot');
    }
  } finally {
    await browser.close();
    console.log('🏁 Browser closed');
  }
})();