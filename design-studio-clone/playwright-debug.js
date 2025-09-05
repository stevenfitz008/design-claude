import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const args = msg.args();
    console.log(`[${type.toUpperCase()}] ${msg.text()}`);
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  // Enable request failure logging
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });
  
  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('\n=== PAGE ANALYSIS ===');
    
    // Check if React app mounted
    const reactRoot = await page.locator('#root').count();
    console.log(`React root element found: ${reactRoot > 0}`);
    
    // Check for main UI components
    const leftToolbar = await page.locator('[data-testid="left-toolbar"], .left-toolbar, [class*="toolbar"]').count();
    const topNav = await page.locator('[data-testid="top-navigation"], .top-nav, nav').count();
    const canvas = await page.locator('canvas, [data-testid="canvas"], [class*="canvas"]').count();
    const actionBar = await page.locator('[data-testid="action-bar"], .action-bar, [class*="action-bar"]').count();
    const rightPanel = await page.locator('[data-testid="right-panel"], .right-panel, [class*="right-panel"]').count();
    
    console.log(`Left Toolbar found: ${leftToolbar > 0} (${leftToolbar} elements)`);
    console.log(`Top Navigation found: ${topNav > 0} (${topNav} elements)`);
    console.log(`Canvas found: ${canvas > 0} (${canvas} elements)`);
    console.log(`ActionBar found: ${actionBar > 0} (${actionBar} elements)`);
    console.log(`Right Panel found: ${rightPanel > 0} (${rightPanel} elements)`);
    
    // Check document title
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    
    // Check for error messages
    const errorElements = await page.locator('*:has-text("Error"), *:has-text("error"), *:has-text("failed"), *:has-text("Cannot")').count();
    if (errorElements > 0) {
      console.log(`\nPossible error messages found (${errorElements} elements)`);
      const errorTexts = await page.locator('*:has-text("Error"), *:has-text("error"), *:has-text("failed"), *:has-text("Cannot")').allTextContents();
      errorTexts.forEach((text, i) => {
        console.log(`Error ${i + 1}: ${text.trim()}`);
      });
    }
    
    // Get body content preview
    const bodyText = await page.locator('body').textContent();
    const bodyPreview = bodyText ? bodyText.slice(0, 200) + '...' : 'No body text';
    console.log(`\nBody content preview: ${bodyPreview}`);
    
    // Check for React DevTools
    const hasReact = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
    });
    console.log(`React detected: ${hasReact}`);
    
    // Take screenshot
    const screenshotPath = '/Users/stevenfitzpatrick/Library/Application Support/Claude/design-claude/design-studio-clone/app-debug-screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\nScreenshot saved to: ${screenshotPath}`);
    
    // Wait a bit to see the page
    console.log('\nKeeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await browser.close();
  }
})();