import { test, expect } from '@playwright/test';

test.describe('Debug Application Issues', () => {
  test('should inspect page state and errors', async ({ page }) => {
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors  
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000); // Give it time to load

    // Check page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check HTML content
    const html = await page.content();
    console.log('HTML length:', html.length);
    console.log('HTML preview:', html.substring(0, 500));

    // Check if React app mounted
    const reactRoot = await page.locator('#root').count();
    console.log('React root elements:', reactRoot);

    if (reactRoot > 0) {
      const rootContent = await page.locator('#root').innerHTML();
      console.log('Root content length:', rootContent.length);
      console.log('Root content preview:', rootContent.substring(0, 200));
    }

    // Check for common elements
    const body = await page.locator('body').count();
    const divs = await page.locator('div').count();
    const scripts = await page.locator('script').count();
    
    console.log('Body elements:', body);
    console.log('Div elements:', divs);
    console.log('Script elements:', scripts);

    // Log errors
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    
    if (pageErrors.length > 0) {
      console.log('Page errors:', pageErrors);
    }

    // Check specific components we expect
    const components = [
      '[data-testid="right-panel"]',
      '.panel-title',
      '.bp5-button',
      'div[class*="styled"]'
    ];

    for (const selector of components) {
      const count = await page.locator(selector).count();
      console.log(`${selector}:`, count);
    }
  });
});