import { test, expect } from '@playwright/test';

test('Debug - Check for console errors', async ({ page }) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('Browser Error:', msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
      console.log('Browser Warning:', msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('Page Error:', error.message);
  });

  await page.goto('/');
  
  // Wait a bit for the page to load
  await page.waitForTimeout(5000);
  
  // Check what's actually in the DOM
  const bodyContent = await page.locator('body').innerHTML();
  console.log('Body content:', bodyContent);
  
  // Check if root div has content
  const rootContent = await page.locator('#root').innerHTML();
  console.log('Root div content:', rootContent);
  
  // Log any errors
  if (errors.length > 0) {
    console.log('Errors found:', errors);
  }
  
  if (warnings.length > 0) {
    console.log('Warnings found:', warnings);
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-screenshot.png' });
});