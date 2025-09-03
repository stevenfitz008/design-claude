import { test } from '@playwright/test';

test('Capture current Photos panel state', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'current-initial-state.png', fullPage: true });
  
  // Click on Photos tab in the left toolbar
  await page.click('[data-testid="tool-photos"]');
  await page.waitForTimeout(2000);
  
  // Take screenshot of Photos panel
  await page.screenshot({ path: 'current-photos-panel.png', fullPage: true });
  
  console.log('Screenshots captured successfully');
});