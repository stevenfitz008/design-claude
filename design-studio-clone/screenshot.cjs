const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Wait for app to load
    await page.waitForTimeout(2000);
    
    // Try to click the Resize button
    try {
      // Look for resize button in the left toolbar
      const buttons = await page.$$('.bp5-button, .bp4-button, .bp3-button');
      for (const button of buttons) {
        const text = await button.textContent();
        if (text && text.toLowerCase().includes('resize')) {
          await button.click();
          break;
        }
      }
    } catch (e) {
      console.log('Could not find resize button, continuing...');
    }
    
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'updated-resize-panel.png', 
      fullPage: true 
    });
    console.log('Screenshot saved: updated-resize-panel.png');
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    await page.screenshot({ path: 'debug-screenshot.png' });
  }
  
  await browser.close();
})();