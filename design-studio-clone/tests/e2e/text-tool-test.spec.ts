import { test, expect } from '@playwright/test';

test.describe('Text Tool Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
  });

  test('should select text tool and show TextPanel', async ({ page }) => {
    // Click on the Text tool in left toolbar
    await page.click('[data-testid="tool-text"], .tool-icon[title*="Text"], button:has-text("T")');
    
    // Wait for TextPanel to load
    await page.waitForSelector('.text-panel, [data-testid="text-panel"]', { timeout: 5000 });
    
    // Take screenshot to verify text panel is visible
    await page.screenshot({ path: 'tests/screenshots/text-tool-selected.png' });
    
    // Verify TextPanel elements are present
    const textPanel = await page.locator('.text-panel, [data-testid="text-panel"]').first();
    await expect(textPanel).toBeVisible();
  });

  test('should show Rich Text Editor button', async ({ page }) => {
    // Click on Text tool
    await page.click('[data-testid="tool-text"], .tool-icon[title*="Text"], button:has-text("T")');
    
    // Look for Rich Text Editor button
    const richTextButton = page.locator('button:has-text("Rich Text Editor")');
    await expect(richTextButton).toBeVisible();
    
    // Click Rich Text Editor button
    await richTextButton.click();
    
    // Wait for Quill editor to load
    await page.waitForSelector('.ql-editor, .quill-editor', { timeout: 5000 });
    
    // Take screenshot of Quill editor
    await page.screenshot({ path: 'tests/screenshots/quill-editor-loaded.png' });
  });

  test('should show advanced Quill toolbar with custom buttons', async ({ page }) => {
    // Navigate to text tool and open Rich Text Editor
    await page.click('[data-testid="tool-text"], .tool-icon[title*="Text"], button:has-text("T")');
    await page.click('button:has-text("Rich Text Editor")');
    
    // Wait for Quill editor
    await page.waitForSelector('.ql-editor', { timeout: 5000 });
    
    // Check for custom toolbar buttons (emojis)
    const shadowBtn = page.locator('button[title="Text Shadow"]');
    const gradientBtn = page.locator('button[title="Gradient Text"]');
    const lineHeightBtn = page.locator('button[title="Line Height"]');
    const letterSpacingBtn = page.locator('button[title="Letter Spacing"]');
    
    // Verify custom buttons are present
    await expect(shadowBtn).toBeVisible();
    await expect(gradientBtn).toBeVisible();
    await expect(lineHeightBtn).toBeVisible();
    await expect(letterSpacingBtn).toBeVisible();
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/advanced-quill-toolbar.png' });
  });
});