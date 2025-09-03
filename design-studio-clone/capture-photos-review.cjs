const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to application...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Taking initial screenshot...');
    await page.screenshot({ path: 'review-01-initial.png', fullPage: true });
    
    console.log('Clicking on Photos tab...');
    await page.click('button:has-text("Photos")');
    await page.waitForTimeout(3000);
    
    console.log('Taking Photos panel screenshot...');
    await page.screenshot({ path: 'review-02-photos-panel.png', fullPage: true });
    
    console.log('Testing search functionality...');
    const searchInput = page.locator('input[placeholder="Search photos..."]');
    await searchInput.fill('nature');
    await page.waitForTimeout(3000);
    
    console.log('Taking search screenshot...');
    await page.screenshot({ path: 'review-03-search.png', fullPage: true });
    
    console.log('Clearing search...');
    await searchInput.clear();
    await page.waitForTimeout(2000);
    
    console.log('Testing scroll...');
    const scrollContainer = page.locator('div[style*="overflowY: auto"]').first();
    if (await scrollContainer.count() > 0) {
      await scrollContainer.evaluate((el) => el.scrollTop = el.scrollHeight);
      await page.waitForTimeout(2000);
      
      console.log('Taking scroll screenshot...');
      await page.screenshot({ path: 'review-04-scrolled.png', fullPage: true });
    }
    
    console.log('Checking for photos...');
    const photos = page.locator('div[draggable="true"]');
    const photoCount = await photos.count();
    console.log(`Found ${photoCount} draggable photos`);
    
    if (photoCount > 0) {
      console.log('Clicking first photo...');
      await photos.first().click();
      await page.waitForTimeout(2000);
      
      console.log('Taking photo added screenshot...');
      await page.screenshot({ path: 'review-05-photo-added.png', fullPage: true });
      
      // Check if image was added to canvas
      const canvasImages = page.locator('[data-canvas-container] img');
      const canvasImageCount = await canvasImages.count();
      console.log(`Images on canvas: ${canvasImageCount}`);
      
      if (canvasImageCount > 0) {
        console.log('Clicking on canvas image to select...');
        const firstCanvasImage = page.locator('[data-canvas-container] div[style*="position: absolute"]').first();
        await firstCanvasImage.click();
        await page.waitForTimeout(1000);
        
        console.log('Taking selected image screenshot...');
        await page.screenshot({ path: 'review-06-image-selected.png', fullPage: true });
      }
    }
    
    console.log('Testing hover on photos...');
    const photoElements = page.locator('div[draggable="true"]');
    if (await photoElements.count() > 0) {
      await photoElements.first().hover();
      await page.waitForTimeout(500);
      
      console.log('Taking hover screenshot...');
      await page.screenshot({ path: 'review-07-hover.png', fullPage: true });
    }
    
    console.log('Review complete!');
    
  } catch (error) {
    console.error('Error during review:', error);
  } finally {
    await browser.close();
  }
})();