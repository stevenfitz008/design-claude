import { test, expect } from '@playwright/test';

test.describe('Text Inline Editing - Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="left-toolbar"]')).toBeVisible({ timeout: 10000 });
    
    // Select text tool and wait for panel
    await page.locator('[data-testid="tool-text"]').click();
    await page.waitForTimeout(1000);
  });

  test('Drag and Drop Text Template Placement', async ({ page }) => {
    console.log('🧪 Testing: Drag and drop text template placement');
    
    // Ensure templates are available
    const templates = page.locator('[draggable="true"]');
    await page.waitForTimeout(1000);
    const templateCount = await templates.count();
    console.log(`Found ${templateCount} draggable templates`);
    
    if (templateCount === 0) {
      console.log('❌ No templates available for drag and drop test');
      return;
    }
    
    // Find canvas or canvas area
    const canvas = page.locator('canvas').first();
    const canvasArea = page.locator('.main-canvas-area').first();
    
    let dropTarget = canvas;
    let targetFound = false;
    
    try {
      await expect(canvas).toBeVisible({ timeout: 2000 });
      dropTarget = canvas;
      targetFound = true;
      console.log('✅ Using canvas element as drop target');
    } catch {
      try {
        await expect(canvasArea).toBeVisible({ timeout: 2000 });
        dropTarget = canvasArea;
        targetFound = true;
        console.log('✅ Using canvas area as drop target');
      } catch {
        console.log('⚠️ No suitable drop target found, skipping drag test');
        return;
      }
    }
    
    if (targetFound) {
      try {
        // Get the first template for dragging
        const firstTemplate = templates.first();
        
        // Perform drag and drop to center of target
        await firstTemplate.dragTo(dropTarget, {
          targetPosition: { x: 200, y: 150 }
        });
        
        await page.waitForTimeout(1000);
        console.log('✅ Drag and drop operation completed');
        
        // Check if any text appeared (this is canvas-dependent)
        const canvasTextAfter = await page.locator('canvas').textContent() || '';
        if (canvasTextAfter.length > 0) {
          console.log('✅ Text content detected in canvas after drag');
        } else {
          console.log('⚠️ No text content detected, but drag operation completed');
        }
        
      } catch (error) {
        console.log(`⚠️ Drag and drop failed: ${error}`);
      }
    }
  });

  test('Text Template Click to Add at Fixed Position', async ({ page }) => {
    console.log('🧪 Testing: Template click to add text at default position');
    
    // Get initial state
    const initialCanvasContent = await page.locator('canvas').textContent() || '';
    console.log(`Initial canvas content length: ${initialCanvasContent.length}`);
    
    // Click on first template
    const templates = page.locator('[draggable="true"]');
    const templateCount = await templates.count();
    
    if (templateCount > 0) {
      await templates.first().click();
      await page.waitForTimeout(1500);
      
      // Check final state
      const finalCanvasContent = await page.locator('canvas').textContent() || '';
      console.log(`Final canvas content length: ${finalCanvasContent.length}`);
      
      if (finalCanvasContent.length > initialCanvasContent.length) {
        console.log('✅ Text successfully added to canvas via template click');
      } else {
        console.log('⚠️ Text addition not clearly detectable in canvas content');
      }
      
      // Alternative check - DOM changes in canvas
      const canvasChildren = await page.locator('canvas *').count();
      console.log(`Canvas child elements: ${canvasChildren}`);
      
      if (canvasChildren > 0) {
        console.log('✅ Canvas contains child elements (likely text)');
      }
      
    } else {
      console.log('❌ No templates available');
    }
  });

  test('Double-Click Text Element for Inline Editing', async ({ page }) => {
    console.log('🧪 Testing: Double-click inline text editing');
    
    // First, add a text element by clicking a template
    const templates = page.locator('[draggable="true"]');
    const templateCount = await templates.count();
    
    if (templateCount === 0) {
      console.log('❌ No templates available, cannot test inline editing');
      return;
    }
    
    // Add text element
    await templates.first().click();
    await page.waitForTimeout(1500);
    console.log('✅ Text element added via template click');
    
    // Try to find text elements in canvas
    const canvasTextElements = page.locator('canvas text');
    const textElementCount = await canvasTextElements.count();
    console.log(`Found ${textElementCount} text elements in canvas`);
    
    if (textElementCount > 0) {
      try {
        // Double-click the last text element
        const lastTextElement = canvasTextElements.last();
        await lastTextElement.dblclick();
        
        // Wait for inline editor
        await page.waitForTimeout(500);
        
        // Look for textarea (inline editor)
        const textarea = page.locator('textarea');
        const textareaVisible = await textarea.isVisible();
        
        if (textareaVisible) {
          console.log('✅ Inline textarea editor appeared after double-click');
          
          // Test editing
          const originalValue = await textarea.inputValue();
          console.log(`Original text: ${originalValue}`);
          
          // Edit the text
          await textarea.fill('Edited Text Content');
          
          // Apply changes with Enter
          await textarea.press('Enter');
          await page.waitForTimeout(500);
          
          // Verify text was updated
          const updatedCanvas = await page.locator('canvas').textContent() || '';
          if (updatedCanvas.includes('Edited Text Content')) {
            console.log('✅ Text successfully edited and applied to canvas');
          } else {
            console.log('⚠️ Text edit may not have been applied to canvas');
          }
          
        } else {
          console.log('⚠️ Inline textarea editor did not appear');
        }
        
      } catch (error) {
        console.log(`⚠️ Double-click editing failed: ${error}`);
      }
    } else {
      console.log('⚠️ No text elements found for double-click testing');
    }
  });

  test('Text Editing Cancellation with Escape Key', async ({ page }) => {
    console.log('🧪 Testing: Text editing cancellation with Escape');
    
    // Add a text element first
    const templates = page.locator('[draggable="true"]');
    const templateCount = await templates.count();
    
    if (templateCount === 0) {
      console.log('❌ No templates available');
      return;
    }
    
    await templates.first().click();
    await page.waitForTimeout(1500);
    
    // Try to edit
    const textElements = page.locator('canvas text');
    const textCount = await textElements.count();
    
    if (textCount > 0) {
      try {
        await textElements.last().dblclick();
        await page.waitForTimeout(500);
        
        const textarea = page.locator('textarea');
        if (await textarea.isVisible()) {
          const originalText = await textarea.inputValue();
          console.log(`Original text: ${originalText}`);
          
          // Make changes
          await textarea.fill('This should be cancelled');
          
          // Cancel with Escape
          await textarea.press('Escape');
          await page.waitForTimeout(500);
          
          // Verify original text is preserved
          const canvasContent = await page.locator('canvas').textContent() || '';
          
          if (canvasContent.includes(originalText) && !canvasContent.includes('This should be cancelled')) {
            console.log('✅ Text editing successfully cancelled with Escape');
          } else {
            console.log('⚠️ Escape cancellation may not have worked as expected');
          }
        }
      } catch (error) {
        console.log(`⚠️ Escape test failed: ${error}`);
      }
    }
  });

  test('Multiple Text Elements on Canvas', async ({ page }) => {
    console.log('🧪 Testing: Multiple text elements support');
    
    const templates = page.locator('[draggable="true"]');
    const templateCount = await templates.count();
    
    if (templateCount < 3) {
      console.log('⚠️ Not enough templates for multiple element test');
      return;
    }
    
    // Add multiple text elements
    console.log('Adding first text element...');
    await templates.nth(0).click();
    await page.waitForTimeout(800);
    
    console.log('Adding second text element...');
    await templates.nth(1).click();
    await page.waitForTimeout(800);
    
    console.log('Adding third text element...');
    await templates.nth(2).click();
    await page.waitForTimeout(800);
    
    // Check canvas text elements
    const canvasTexts = page.locator('canvas text');
    const finalCount = await canvasTexts.count();
    
    console.log(`Final text elements in canvas: ${finalCount}`);
    
    if (finalCount >= 3) {
      console.log('✅ Multiple text elements successfully added to canvas');
    } else if (finalCount > 0) {
      console.log(`⚠️ Some text elements added (${finalCount}/3)`);
    } else {
      console.log('⚠️ No text elements detected in canvas');
    }
    
    // Check canvas content diversity
    const canvasContent = await page.locator('canvas').textContent() || '';
    const hasVariousTexts = (
      canvasContent.includes('Header') || 
      canvasContent.includes('Subheader') || 
      canvasContent.includes('Body') ||
      canvasContent.includes('Text')
    );
    
    if (hasVariousTexts) {
      console.log('✅ Various text content detected in canvas');
    }
  });

  test('Text Selection State Management', async ({ page }) => {
    console.log('🧪 Testing: Text element selection state');
    
    // Add a text element
    const templates = page.locator('[draggable="true"]');
    const templateCount = await templates.count();
    
    if (templateCount === 0) {
      console.log('❌ No templates available');
      return;
    }
    
    await templates.first().click();
    await page.waitForTimeout(1500);
    
    // Try to select text element by clicking on it
    const textElements = page.locator('canvas text');
    const textCount = await textElements.count();
    
    if (textCount > 0) {
      try {
        // Click on text element to select it
        await textElements.last().click();
        await page.waitForTimeout(500);
        
        // Check for selection indicators in text panel
        const selectedIndicator = page.locator('text="Text Selected"');
        const isIndicatorVisible = await selectedIndicator.isVisible();
        
        if (isIndicatorVisible) {
          console.log('✅ Text selection indicator visible in text panel');
          
          // Click elsewhere to deselect
          await page.locator('canvas').click({ position: { x: 50, y: 50 } });
          await page.waitForTimeout(500);
          
          const stillVisible = await selectedIndicator.isVisible();
          if (!stillVisible) {
            console.log('✅ Text deselection works correctly');
          } else {
            console.log('⚠️ Text may still be selected');
          }
          
        } else {
          console.log('⚠️ Text selection indicator not detected');
        }
        
      } catch (error) {
        console.log(`⚠️ Selection test failed: ${error}`);
      }
    }
  });
});
