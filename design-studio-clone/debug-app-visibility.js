import { chromium } from 'playwright';

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', (msg) => {
    console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', (error) => {
    console.log('PAGE ERROR:', error.message);
  });
  
  try {
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    console.log('Page loaded, waiting for content...');
    await page.waitForTimeout(2000); // Wait 2 seconds for React to load
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-visibility.png', fullPage: true });
    console.log('Screenshot saved as debug-visibility.png');
    
    // Check if root div has content
    const rootContent = await page.locator('#root').innerHTML();
    console.log('Root div content length:', rootContent.length);
    console.log('Root div content preview:', rootContent.substring(0, 200));
    
    // Check for specific elements
    const hasAppLayout = await page.locator('[data-testid="app-layout"], .app-layout, .AppLayout').count();
    console.log('App layout elements found:', hasAppLayout);
    
    const hasLeftToolbar = await page.locator('[data-testid="left-toolbar"], .left-toolbar, .LeftToolbar').count();
    console.log('Left toolbar elements found:', hasLeftToolbar);
    
    // Check network requests
    const responses = [];
    page.on('response', (response) => {
      if (!response.url().includes('/@vite/client') && !response.url().includes('/@react-refresh')) {
        responses.push({ url: response.url(), status: response.status() });
      }
    });
    
    await page.waitForTimeout(1000);
    console.log('Network responses:', responses);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();