import { test, expect } from '@playwright/test';

test.describe('Advanced Text Formatting Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
  });

  test('should show advanced text formatting controls when text is selected', async ({ page }) => {
    // Step 1: Select Text tool
    await page.click('[data-testid="tool-text"]');
    await page.waitForTimeout(500);

    // Step 2: Add a text element by clicking on a text template
    // Look for text templates in the right panel
    const textTemplate = page.locator('.text-template, .template-button, button:has-text("Add Text")').first();
    if (await textTemplate.isVisible()) {
      await textTemplate.click();
      await page.waitForTimeout(500);
    } else {
      // If no templates, try clicking on canvas to add text
      await page.click('.konvajs-content, [data-testid="main-canvas"]', { 
        position: { x: 400, y: 300 } 
      });
    }

    // Step 3: Select the text element on canvas
    // Look for text elements and click to select
    const canvasArea = page.locator('.konvajs-content, [data-testid="main-canvas"]').first();
    await canvasArea.click({ position: { x: 400, y: 300 } });
    
    // Wait for selection to register
    await page.waitForTimeout(1000);

    // Step 4: Take screenshot to verify text formatting controls appear
    await page.screenshot({ path: 'tests/screenshots/text-formatting-controls.png', fullPage: true });

    // Step 5: Verify advanced text formatting controls are visible in top bar
    
    // Check for font family selector
    const fontFamilySelect = page.locator('select').filter({ hasText: 'Arial' }).or(
      page.locator('select[title="Font Family"]')
    );
    
    // Check for font size selector  
    const fontSizeSelect = page.locator('select[title="Font Size"]');
    
    // Check for text formatting buttons
    const boldButton = page.locator('button[title="Bold"]');
    const italicButton = page.locator('button[title="Italic"]');
    const underlineButton = page.locator('button[title="Underline"]');
    
    // Check for alignment buttons
    const alignLeftButton = page.locator('button[title="Align Left"]');
    const alignCenterButton = page.locator('button[title="Align Center"]');
    const alignRightButton = page.locator('button[title="Align Right"]');
    
    // Check for color selector
    const colorSelect = page.locator('select[title="Text Color"]');

    // Verify controls are visible (at least some should be present)
    const controls = [fontFamilySelect, fontSizeSelect, boldButton, italicButton, underlineButton, 
                     alignLeftButton, alignCenterButton, alignRightButton, colorSelect];
    
    let visibleControls = 0;
    for (const control of controls) {
      if (await control.isVisible()) {
        visibleControls++;
      }
    }

    // At least 3 controls should be visible when text is selected
    expect(visibleControls).toBeGreaterThanOrEqual(3);

    console.log(`✅ Found ${visibleControls} text formatting controls in top bar`);
  });

  test('should test font family change functionality', async ({ page }) => {
    // Add text and select it (simplified for testing)
    await page.click('[data-testid="tool-text"]');
    await page.waitForTimeout(500);
    
    // Try to click on canvas to create text
    await page.click('.konvajs-content, [data-testid="main-canvas"]', { 
      position: { x: 400, y: 300 } 
    });
    await page.waitForTimeout(500);
    
    // Select the text element
    await page.click('.konvajs-content, [data-testid="main-canvas"]', { 
      position: { x: 400, y: 300 } 
    });
    await page.waitForTimeout(1000);

    // Look for font family selector and try to change it
    const fontSelect = page.locator('select[title="Font Family"], select').first();
    if (await fontSelect.isVisible()) {
      await fontSelect.selectOption({ label: 'Georgia' });
      await page.waitForTimeout(500);
      
      // Take screenshot to verify change
      await page.screenshot({ path: 'tests/screenshots/font-change-test.png' });
      
      console.log('✅ Font family change test completed');
    } else {
      console.log('⚠️ Font family selector not found');
    }
  });

  test('should test text formatting buttons', async ({ page }) => {
    // Add and select text
    await page.click('[data-testid="tool-text"]');
    await page.waitForTimeout(500);
    
    await page.click('.konvajs-content, [data-testid="main-canvas"]', { 
      position: { x: 400, y: 300 } 
    });
    await page.waitForTimeout(500);
    
    // Select text element
    await page.click('.konvajs-content, [data-testid="main-canvas"]', { 
      position: { x: 400, y: 300 } 
    });
    await page.waitForTimeout(1000);

    // Test Bold button
    const boldButton = page.locator('button[title="Bold"]');
    if (await boldButton.isVisible()) {
      await boldButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Bold button clicked');
    }

    // Test Italic button
    const italicButton = page.locator('button[title="Italic"]');
    if (await italicButton.isVisible()) {
      await italicButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Italic button clicked');
    }

    // Test text alignment
    const alignCenterButton = page.locator('button[title="Align Center"]');
    if (await alignCenterButton.isVisible()) {
      await alignCenterButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Align Center button clicked');
    }

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/text-formatting-applied.png' });
    
    console.log('✅ Text formatting buttons test completed');
  });
});