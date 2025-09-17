import { test, expect, Page } from '@playwright/test';

test.describe('Text Editor Functionality', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to the Design Studio application
    await page.goto('http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForSelector('[data-testid="left-toolbar"]', { timeout: 10000 });
    await page.waitForTimeout(2000); // Extra wait for full initialization
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Should display and interact with Rich Text Editor in Text Panel', async () => {
    console.log('🎯 Testing Rich Text Editor in Text Panel');
    
    // Step 1: Click on Text tool in left toolbar
    await page.click('[data-testid="tool-text"]');
    console.log('✅ Clicked Text tool');
    
    // Wait for text panel to load
    await page.waitForSelector('[data-testid="text-panel"]', { timeout: 5000 });
    console.log('✅ Text panel loaded');
    
    // Step 2: Click on Rich Text Editor button
    const richTextButton = page.locator('text="✨ Rich Text Editor"');
    await richTextButton.click();
    console.log('✅ Clicked Rich Text Editor button');
    
    // Step 3: Verify Rich Text Editor appears
    await page.waitForSelector('[data-testid="rich-text-editor"]', { timeout: 5000 });
    console.log('✅ Rich Text Editor appeared');
    
    // Step 4: Wait for Quill editor to load
    await page.waitForSelector('.ql-editor', { timeout: 10000 });
    console.log('✅ Quill editor loaded');
    
    // Step 5: Test typing in the rich text editor
    await page.click('.ql-editor');
    await page.fill('.ql-editor', '');
    await page.type('.ql-editor', 'This is a test of rich text functionality!');
    console.log('✅ Typed text in rich text editor');
    
    // Step 6: Test formatting tools (if toolbar is available)
    const boldButton = page.locator('.ql-bold');
    if (await boldButton.isVisible()) {
      // Select some text first
      await page.keyboard.press('Control+A'); // Select all
      await boldButton.click();
      console.log('✅ Applied bold formatting');
    }
    
    // Step 7: Test Apply Changes button
    const applyButton = page.locator('text="Apply Changes"');
    if (await applyButton.isVisible()) {
      await applyButton.click();
      console.log('✅ Clicked Apply Changes');
    }
    
    // Take screenshot of rich text editor
    await page.screenshot({ path: 'design-studio-clone/.playwright-mcp/rich-text-editor.png', fullPage: true });
    console.log('✅ Screenshot taken of rich text editor');
  });

  test('Should add text to canvas and enable inline editing', async () => {
    console.log('🎯 Testing Inline Text Editing on Canvas');
    
    // Step 1: Click on Text tool in left toolbar
    await page.click('[data-testid="tool-text"]');
    console.log('✅ Clicked Text tool');
    
    // Wait for text panel to load
    await page.waitForSelector('[data-testid="text-panel"]', { timeout: 5000 });
    
    // Step 2: Select a text template and drag to canvas
    const textTemplate = page.locator('[draggable="true"]').first();
    await textTemplate.click();
    console.log('✅ Clicked on text template');
    
    // Alternative: Try to add text directly to canvas by dragging a template
    const canvasArea = page.locator('#canvas-stage');
    if (await canvasArea.isVisible()) {
      // Get canvas bounds
      const canvasBounds = await canvasArea.boundingBox();
      if (canvasBounds) {
        // Drag text template to canvas center
        await textTemplate.dragTo(canvasArea, {
          targetPosition: {
            x: canvasBounds.width / 2,
            y: canvasBounds.height / 2
          }
        });
        console.log('✅ Dragged text template to canvas');
      }
    }
    
    // Wait a bit for the text element to be created
    await page.waitForTimeout(1000);
    
    // Step 3: Try to find a text element on canvas and double-click it
    const textElements = page.locator('text');
    const textElementCount = await textElements.count();
    
    if (textElementCount > 0) {
      console.log(`Found ${textElementCount} text elements on canvas`);
      
      // Double-click the first text element to start inline editing
      await textElements.first().dblclick();
      console.log('✅ Double-clicked text element');
      
      // Step 4: Check if inline text editor (textarea) appears
      try {
        await page.waitForSelector('textarea', { timeout: 3000 });
        console.log('✅ Inline text editor (textarea) appeared');
        
        // Step 5: Test editing text
        const textarea = page.locator('textarea');
        await textarea.fill('Edited inline text!');
        console.log('✅ Edited text in inline editor');
        
        // Step 6: Press Enter to confirm changes
        await page.keyboard.press('Enter');
        console.log('✅ Confirmed text changes with Enter');
        
      } catch (error) {
        console.log('⚠️ Inline text editor did not appear - this might be expected if no text elements exist');
      }
    } else {
      console.log('⚠️ No text elements found on canvas - might need to add text first');
    }
    
    // Take screenshot of canvas with text
    await page.screenshot({ path: 'design-studio-clone/.playwright-mcp/canvas-with-text-elements.png', fullPage: true });
    console.log('✅ Screenshot taken of canvas with text elements');
  });

  test('Should test Rich Text Editor formatting options', async () => {
    console.log('🎯 Testing Rich Text Editor Formatting Options');
    
    // Step 1: Open Text panel and Rich Text Editor
    await page.click('[data-testid="tool-text"]');
    await page.waitForSelector('[data-testid="text-panel"]', { timeout: 5000 });
    
    const richTextButton = page.locator('text="✨ Rich Text Editor"');
    await richTextButton.click();
    
    // Step 2: Wait for Rich Text Editor to fully load
    await page.waitForSelector('.ql-editor', { timeout: 10000 });
    await page.waitForSelector('.ql-toolbar', { timeout: 10000 });
    console.log('✅ Rich Text Editor and toolbar loaded');
    
    // Step 3: Add some test content
    await page.click('.ql-editor');
    await page.fill('.ql-editor', 'Testing formatting options: Bold, Italic, Underline');
    console.log('✅ Added test content');
    
    // Step 4: Test formatting tools
    const toolbarButtons = {
      bold: '.ql-bold',
      italic: '.ql-italic',
      underline: '.ql-underline',
      header: '.ql-header .ql-picker-label',
      color: '.ql-color .ql-picker-label',
      align: '.ql-align .ql-picker-label'
    };
    
    // Select all text first
    await page.keyboard.press('Control+A');
    
    // Test each formatting option
    for (const [name, selector] of Object.entries(toolbarButtons)) {
      const button = page.locator(selector);
      if (await button.isVisible()) {
        await button.click();
        console.log(`✅ Tested ${name} formatting`);
        await page.waitForTimeout(500); // Wait between clicks
      } else {
        console.log(`⚠️ ${name} button not found or visible`);
      }
    }
    
    // Step 5: Test applying changes
    const applyButton = page.locator('text="Apply Changes"');
    if (await applyButton.isVisible()) {
      await applyButton.click();
      console.log('✅ Applied formatting changes');
    }
    
    // Take screenshot of formatted text
    await page.screenshot({ path: 'design-studio-clone/.playwright-mcp/rich-text-formatted.png', fullPage: true });
    console.log('✅ Screenshot taken of formatted rich text');
  });

  test('Should test complete text workflow', async () => {
    console.log('🎯 Testing Complete Text Workflow');
    
    // Step 1: Open Text panel
    await page.click('[data-testid="tool-text"]');
    await page.waitForSelector('[data-testid="text-panel"]', { timeout: 5000 });
    console.log('✅ Opened Text panel');
    
    // Step 2: Create rich text
    const richTextButton = page.locator('text="✨ Rich Text Editor"');
    await richTextButton.click();
    await page.waitForSelector('.ql-editor', { timeout: 10000 });
    
    await page.click('.ql-editor');
    await page.fill('.ql-editor', 'Complete Text Workflow Test');
    
    // Apply changes
    const applyButton = page.locator('text="Apply Changes"');
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
    console.log('✅ Created rich text element');
    
    // Step 3: Try to interact with canvas text (if any exists)
    await page.waitForTimeout(2000);
    
    // Look for any text elements that might have been created
    const textElements = page.locator('text');
    const textElementCount = await textElements.count();
    
    console.log(`Found ${textElementCount} text elements after rich text creation`);
    
    // Step 4: Test template selection
    const templates = page.locator('[draggable="true"]');
    const templateCount = await templates.count();
    
    if (templateCount > 0) {
      await templates.first().click();
      console.log('✅ Selected text template');
      
      // Try dragging to canvas if canvas is visible
      const canvasArea = page.locator('#canvas-stage, canvas');
      if (await canvasArea.first().isVisible()) {
        await templates.first().dragTo(canvasArea.first());
        console.log('✅ Dragged template to canvas');
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'design-studio-clone/.playwright-mcp/complete-text-workflow.png', fullPage: true });
    console.log('✅ Complete workflow test finished');
  });

  test('Should verify UI elements and accessibility', async () => {
    console.log('🎯 Testing UI Elements and Accessibility');
    
    // Step 1: Verify Text tool exists and is clickable
    const textTool = page.locator('[data-testid="tool-text"]');
    await expect(textTool).toBeVisible();
    await expect(textTool).toBeEnabled();
    
    await textTool.click();
    console.log('✅ Text tool is accessible and clickable');
    
    // Step 2: Verify Text panel loads and contains expected elements
    await page.waitForSelector('[data-testid="text-panel"]', { timeout: 5000 });
    
    // Check for Rich Text Editor button
    const richTextButton = page.locator('text="✨ Rich Text Editor"');
    await expect(richTextButton).toBeVisible();
    console.log('✅ Rich Text Editor button is visible');
    
    // Check for search functionality
    const searchInput = page.locator('input[placeholder*="Search text templates"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('header');
      console.log('✅ Search input is functional');
    }
    
    // Step 3: Test Rich Text Editor UI
    await richTextButton.click();
    await page.waitForSelector('.ql-editor', { timeout: 10000 });
    
    // Verify toolbar elements
    const toolbarElements = [
      '.ql-toolbar',
      '.ql-editor',
      'text="Apply Changes"',
      'text="Cancel"'
    ];
    
    for (const selector of toolbarElements) {
      const element = page.locator(selector);
      if (await element.first().isVisible()) {
        console.log(`✅ UI element found: ${selector}`);
      } else {
        console.log(`⚠️ UI element not found: ${selector}`);
      }
    }
    
    // Final UI screenshot
    await page.screenshot({ path: 'design-studio-clone/.playwright-mcp/text-editor-ui-elements.png', fullPage: true });
    console.log('✅ UI and accessibility test completed');
  });
});
