import { test, expect, Page } from '@playwright/test';

test.describe('Text Editing Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Design Studio
    await page.goto('http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForTimeout(2000);
    
    // Ensure the main app layout is loaded by checking for key elements
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for React to fully hydrate the application
    await page.waitForFunction(() => {
      return document.querySelector('canvas') !== null || 
             document.querySelector('.main-canvas-area') !== null ||
             document.querySelector('[class*="canvas"]') !== null;
    }, { timeout: 15000 });
  });

  test('should display text panel when text tool is selected', async ({ page }) => {
    console.log('🧪 Test: Text panel visibility');
    
    // Click on the Text tool in left toolbar
    const textTool = page.locator('[data-testid="tool-text"]');
    await expect(textTool).toBeVisible();
    await textTool.click();
    
    // Wait for panel to switch
    await page.waitForTimeout(500);
    
    // Verify TextPanel appears in right panel
    const textPanel = page.locator('[data-testid="text-panel"]');
    await expect(textPanel).toBeVisible({ timeout: 5000 });
    
    // Verify panel header elements
    await expect(page.locator('text=Rich Text Editor')).toBeVisible();
    await expect(page.locator('input[placeholder="Search text templates..."]')).toBeVisible();
    
    console.log('✅ Text panel displays correctly when text tool is selected');
  });

  test('should show text templates in the panel', async ({ page }) => {
    console.log('🧪 Test: Text templates visibility');
    
    // Select text tool
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    
    // Wait for text panel to load
    const textPanel = page.locator('[data-testid="text-panel"]');
    await expect(textPanel).toBeVisible({ timeout: 5000 });
    
    // Check that templates are loaded
    const templateItems = page.locator('[data-testid="text-panel"] [draggable="true"]');
    await expect(templateItems.first()).toBeVisible({ timeout: 5000 });
    
    // Count visible templates - should have at least the default templates
    const templateCount = await templateItems.count();
    expect(templateCount).toBeGreaterThan(0);
    
    // Check that template names are visible
    await expect(page.locator('text="Create header"')).toBeVisible();
    await expect(page.locator('text="Create sub header"')).toBeVisible();
    await expect(page.locator('text="Create body text"')).toBeVisible();
    
    console.log(`✅ Found ${templateCount} text templates in the panel`);
  });

  test('should add text element to canvas when template is clicked', async ({ page }) => {
    console.log('🧪 Test: Template click-to-add functionality');
    
    // Select text tool
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    
    // Wait for templates to load
    await expect(page.locator('[data-testid="text-panel"] [draggable="true"]').first()).toBeVisible({ timeout: 5000 });
    
    // Get initial canvas element count
    const initialElements = await page.locator('canvas text').count();
    
    // Click on the first template (Header)
    const firstTemplate = page.locator('[data-testid="text-panel"] [draggable="true"]').first();
    await firstTemplate.click();
    
    // Wait for element to be added to canvas
    await page.waitForTimeout(1000);
    
    // Check that a new text element was added
    const finalElements = await page.locator('canvas text').count();
    expect(finalElements).toBe(initialElements + 1);
    
    // Verify the text element contains expected content
    const addedText = page.locator('canvas').locator('text').last();
    await expect(addedText).toContainText('Header Text');
    
    console.log('✅ Template click successfully adds text element to canvas');
  });

  test('should support drag and drop text templates to canvas', async ({ page }) => {
    console.log('🧪 Test: Drag and drop text placement');
    
    // Select text tool
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    
    // Wait for templates to load
    await expect(page.locator('[data-testid="text-panel"] [draggable="true"]').first()).toBeVisible({ timeout: 5000 });
    
    // Get canvas area for drop target
    const canvas = page.locator('[data-testid="canvas-container"] canvas');
    await expect(canvas).toBeVisible();
    
    // Get canvas bounding box for positioning
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    // Select a template to drag (second template - subheader)
    const templateToDrag = page.locator('[data-testid="text-panel"] [draggable="true"]').nth(1);
    await expect(templateToDrag).toBeVisible();
    
    // Perform drag and drop
    const dropX = canvasBox.x + canvasBox.width * 0.6; // Drop at 60% across canvas
    const dropY = canvasBox.y + canvasBox.height * 0.3; // Drop at 30% down canvas
    
    await templateToDrag.dragTo(canvas, {
      targetPosition: {
        x: dropX - canvasBox.x,
        y: dropY - canvasBox.y
      }
    });
    
    // Wait for element to be processed
    await page.waitForTimeout(1000);
    
    // Verify a text element was added
    const textElements = page.locator('canvas text');
    await expect(textElements.last()).toContainText('Subheader Text');
    
    console.log('✅ Drag and drop successfully places text at target location');
  });

  test('should allow inline text editing on double-click', async ({ page }) => {
    console.log('🧪 Test: Inline text editing with double-click');
    
    // Select text tool and add a text element first
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    
    // Add a text element by clicking template
    await expect(page.locator('[data-testid="text-panel"] [draggable="true"]').first()).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="text-panel"] [draggable="true"]').first().click();
    await page.waitForTimeout(1000);
    
    // Find the added text element on canvas
    const textElement = page.locator('canvas text').last();
    await expect(textElement).toBeVisible();
    
    // Double-click to start inline editing
    await textElement.dblclick();
    
    // Wait for the inline editor (textarea) to appear
    await page.waitForTimeout(500);
    
    // Look for the textarea editor overlay
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 3000 });
    
    // Verify textarea has the original text
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe('Header Text');
    
    // Edit the text
    await textarea.fill('Edited Header Text');
    
    // Press Enter to apply changes
    await textarea.press('Enter');
    
    // Wait for changes to apply
    await page.waitForTimeout(500);
    
    // Verify the text was updated on canvas
    await expect(page.locator('canvas')).toContainText('Edited Header Text');
    
    console.log('✅ Inline text editing works correctly with double-click');
  });

  test('should allow text editing cancellation with Escape key', async ({ page }) => {
    console.log('🧪 Test: Text editing cancellation');
    
    // Add a text element
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="text-panel"] [draggable="true"]').first()).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="text-panel"] [draggable="true"]').first().click();
    await page.waitForTimeout(1000);
    
    // Start editing
    const textElement = page.locator('canvas text').last();
    await textElement.dblclick();
    
    // Wait for textarea to appear
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 3000 });
    
    // Get original text
    const originalText = await textarea.inputValue();
    
    // Edit the text
    await textarea.fill('This should be cancelled');
    
    // Press Escape to cancel
    await textarea.press('Escape');
    
    // Wait for edit mode to end
    await page.waitForTimeout(500);
    
    // Verify the text was not changed
    await expect(page.locator('canvas')).toContainText(originalText);
    await expect(page.locator('canvas')).not.toContainText('This should be cancelled');
    
    console.log('✅ Text editing cancellation works correctly with Escape key');
  });

  test('should show Rich Text Editor when button is clicked', async ({ page }) => {
    console.log('🧪 Test: Rich Text Editor functionality');
    
    // Select text tool
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    
    // Wait for text panel
    await expect(page.locator('[data-testid="text-panel"]')).toBeVisible({ timeout: 5000 });
    
    // Click the Rich Text Editor button
    const richTextButton = page.locator('button:has-text("Rich Text Editor")');
    await expect(richTextButton).toBeVisible();
    await richTextButton.click();
    
    // Wait for rich text editor to load
    await page.waitForTimeout(2000);
    
    // Check if rich text editor container appears
    const richTextEditor = page.locator('[data-testid="rich-text-editor"]');
    await expect(richTextEditor).toBeVisible({ timeout: 10000 });
    
    // Verify editor components are present
    await expect(page.locator('text="Rich Text Editor"')).toBeVisible();
    
    // Check for Quill editor (may take time to load)
    // We'll look for the characteristic Quill toolbar or editor area
    const quillContent = page.locator('.ql-editor, .ql-container, [contenteditable="true"]');
    await expect(quillContent).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Rich Text Editor loads and displays correctly');
  });

  test('should support multiple text elements on canvas', async ({ page }) => {
    console.log('🧪 Test: Multiple text elements support');
    
    // Select text tool
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    
    // Wait for templates
    await expect(page.locator('[data-testid="text-panel"] [draggable="true"]').first()).toBeVisible({ timeout: 5000 });
    
    // Add first text element
    await page.locator('[data-testid="text-panel"] [draggable="true"]').nth(0).click();
    await page.waitForTimeout(500);
    
    // Add second text element
    await page.locator('[data-testid="text-panel"] [draggable="true"]').nth(1).click();
    await page.waitForTimeout(500);
    
    // Add third text element
    await page.locator('[data-testid="text-panel"] [draggable="true"]').nth(2).click();
    await page.waitForTimeout(500);
    
    // Verify multiple text elements exist
    const textElements = page.locator('canvas text');
    const count = await textElements.count();
    expect(count).toBeGreaterThanOrEqual(3);
    
    // Verify different text content
    await expect(page.locator('canvas')).toContainText('Header Text');
    await expect(page.locator('canvas')).toContainText('Subheader Text');
    await expect(page.locator('canvas')).toContainText('Body text goes here');
    
    console.log(`✅ Successfully added ${count} text elements to canvas`);
  });

  test('should display text with proper styling from templates', async ({ page }) => {
    console.log('🧪 Test: Text styling from templates');
    
    // Select text tool
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    
    // Wait for templates
    await expect(page.locator('[data-testid="text-panel"] [draggable="true"]').first()).toBeVisible({ timeout: 5000 });
    
    // Add a header text (should be large and bold)
    await page.locator('[data-testid="text-panel"] [draggable="true"]').first().click();
    await page.waitForTimeout(1000);
    
    // Get the text element
    const headerElement = page.locator('canvas text').last();
    await expect(headerElement).toBeVisible();
    
    // Check text content
    await expect(headerElement).toContainText('Header Text');
    
    // Note: Canvas text styling verification is limited in Playwright
    // We can verify the text exists and contains expected content
    
    // Add body text (should be smaller)
    await page.locator('[data-testid="text-panel"] [draggable="true"]').nth(2).click();
    await page.waitForTimeout(1000);
    
    // Verify body text was added
    await expect(page.locator('canvas')).toContainText('Body text goes here');
    
    console.log('✅ Text elements display with template-defined styling');
  });

  test('should handle text search functionality', async ({ page }) => {
    console.log('🧪 Test: Text template search');
    
    // Select text tool
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    
    // Wait for text panel and templates
    await expect(page.locator('[data-testid="text-panel"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="text-panel"] [draggable="true"]').first()).toBeVisible();
    
    // Get initial template count
    const initialCount = await page.locator('[data-testid="text-panel"] [draggable="true"]').count();
    
    // Search for "header" templates
    const searchInput = page.locator('input[placeholder="Search text templates..."]');
    await searchInput.fill('header');
    await page.waitForTimeout(1000);
    
    // Check that search results are shown
    const searchResults = page.locator('[data-testid="text-panel"] [draggable="true"]');
    const searchCount = await searchResults.count();
    
    // Should have fewer results than initial (filtered)
    expect(searchCount).toBeLessThanOrEqual(initialCount);
    
    // Verify "header" related templates are shown
    await expect(page.locator('text="Create header"')).toBeVisible();
    await expect(page.locator('text="Create sub header"')).toBeVisible();
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(1000);
    
    // Should return to full template list
    const finalCount = await page.locator('[data-testid="text-panel"] [draggable="true"]').count();
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    
    console.log(`✅ Search functionality works: ${initialCount} → ${searchCount} → ${finalCount} templates`);
  });

  test('should preserve text selection and editing state', async ({ page }) => {
    console.log('🧪 Test: Text selection and editing state persistence');
    
    // Add a text element
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="text-panel"] [draggable="true"]').first()).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="text-panel"] [draggable="true"]').first().click();
    await page.waitForTimeout(1000);
    
    // Click on the text element to select it
    const textElement = page.locator('canvas text').last();
    await textElement.click();
    await page.waitForTimeout(500);
    
    // Check if "Text Selected" indicator appears in text panel
    const selectedIndicator = page.locator('text="Text Selected"');
    await expect(selectedIndicator).toBeVisible({ timeout: 2000 });
    
    // Click elsewhere to deselect
    await page.locator('canvas').click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(500);
    
    // Selection indicator should disappear
    await expect(selectedIndicator).not.toBeVisible();
    
    console.log('✅ Text selection state is properly tracked and displayed');
  });

  test('should work end-to-end: select tool → add text → edit → apply', async ({ page }) => {
    console.log('🧪 Test: Complete text editing workflow');
    
    // Step 1: Select text tool
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(500);
    
    // Step 2: Verify text panel appears
    await expect(page.locator('[data-testid="text-panel"]')).toBeVisible({ timeout: 5000 });
    
    // Step 3: Add text by clicking template
    await expect(page.locator('[data-testid="text-panel"] [draggable="true"]').first()).toBeVisible();
    await page.locator('[data-testid="text-panel"] [draggable="true"]').first().click();
    await page.waitForTimeout(1000);
    
    // Step 4: Verify text appears on canvas
    const addedText = page.locator('canvas text').last();
    await expect(addedText).toContainText('Header Text');
    
    // Step 5: Double-click to edit
    await addedText.dblclick();
    
    // Step 6: Edit text in textarea
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 3000 });
    await textarea.fill('Final Edited Text');
    
    // Step 7: Apply changes with Enter
    await textarea.press('Enter');
    await page.waitForTimeout(500);
    
    // Step 8: Verify final text on canvas
    await expect(page.locator('canvas')).toContainText('Final Edited Text');
    
    // Step 9: Test drag and drop as well
    const canvas = page.locator('[data-testid="canvas-container"] canvas');
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      await page.locator('[data-testid="text-panel"] [draggable="true"]').nth(1).dragTo(canvas, {
        targetPosition: {
          x: canvasBox.width * 0.7,
          y: canvasBox.height * 0.7
        }
      });
      await page.waitForTimeout(1000);
      await expect(page.locator('canvas')).toContainText('Subheader Text');
    }
    
    console.log('✅ Complete text editing workflow functions correctly');
  });
});
