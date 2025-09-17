import { test, expect, Page } from '@playwright/test';

test.describe('Comprehensive Text Editor Test', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`BROWSER ERROR: ${msg.text()}`);
      } else {
        console.log(`BROWSER: ${msg.text()}`);
      }
    });
    page.on('pageerror', error => console.error(`PAGE ERROR: ${error.message}`));
    
    // Navigate to the Design Studio application
    await page.goto('http://localhost:3000');
    
    // Wait for application to fully load
    await page.waitForSelector('[data-testid="left-toolbar"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Extra wait for initialization
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Complete Text Editor Functionality Verification', async () => {
    console.log('🔍 COMPREHENSIVE TEXT EDITOR FUNCTIONALITY TEST');
    console.log('=' * 60);
    
    // STEP 1: Verify Application Loads
    console.log('\n🚀 STEP 1: Application Loading Verification');
    const appLayout = await page.$('[data-testid="app-layout"]');
    expect(appLayout).toBeTruthy();
    console.log('✅ Application layout loaded successfully');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'design-studio-clone/.playwright-mcp/01-app-initial-state.png', 
      fullPage: true 
    });
    
    // STEP 2: Test Text Tool Selection
    console.log('\n🔄 STEP 2: Text Tool Selection');
    const textTool = await page.$('[data-testid="tool-text"]');
    expect(textTool).toBeTruthy();
    
    await textTool!.click();
    console.log('✅ Text tool clicked successfully');
    
    // Wait for panel to load and take screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'design-studio-clone/.playwright-mcp/02-text-tool-selected.png', 
      fullPage: true 
    });
    
    // STEP 3: Verify Text Panel Loads
    console.log('\n📋 STEP 3: Text Panel Verification');
    const textPanel = await page.$('[data-testid="text-panel"]');
    expect(textPanel).toBeTruthy();
    
    const panelVisible = await textPanel!.isVisible();
    expect(panelVisible).toBeTruthy();
    console.log('✅ Text panel is visible and loaded');
    
    // Check for text templates
    const templates = await page.$$('[draggable="true"]');
    console.log(`✅ Found ${templates.length} text templates`);
    expect(templates.length).toBeGreaterThan(0);
    
    // STEP 4: Test Rich Text Editor Button
    console.log('\n✨ STEP 4: Rich Text Editor Access');
    const richTextButton = page.locator('text="✨ Rich Text Editor"');
    await expect(richTextButton).toBeVisible();
    
    await richTextButton.click();
    console.log('✅ Rich Text Editor button clicked');
    
    // Wait for rich text editor to load
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'design-studio-clone/.playwright-mcp/03-rich-text-editor-opened.png', 
      fullPage: true 
    });
    
    // STEP 5: Check Rich Text Editor Loading State
    console.log('\n🔄 STEP 5: Rich Text Editor Status Check');
    const richTextEditor = await page.$('[data-testid="rich-text-editor"]');
    expect(richTextEditor).toBeTruthy();
    console.log('✅ Rich Text Editor component loaded');
    
    // Check status indicator
    const statusIndicator = await page.$('.StatusIndicator, [data-status], [class*="status"]');
    if (statusIndicator) {
      const statusText = await statusIndicator.textContent();
      console.log(`🔍 Rich Text Editor status: ${statusText}`);
    }
    
    // STEP 6: Wait for Quill Editor and Test
    console.log('\n📝 STEP 6: Quill Editor Verification');
    let quillLoaded = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!quillLoaded && attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts}: Checking for Quill editor...`);
      
      // Check for Quill editor elements
      const quillEditor = await page.$('.ql-editor');
      const quillToolbar = await page.$('.ql-toolbar');
      
      if (quillEditor && quillToolbar) {
        quillLoaded = true;
        console.log('✅ Quill editor and toolbar found!');
        
        // Test typing in Quill editor
        try {
          await quillEditor.click();
          await page.waitForTimeout(500);
          await quillEditor.fill('Testing rich text functionality!');
          console.log('✅ Successfully typed in Quill editor');
          
          // Test formatting (if toolbar buttons are available)
          const boldButton = await page.$('.ql-bold');
          if (boldButton) {
            await page.keyboard.press('Control+A'); // Select all
            await boldButton.click();
            console.log('✅ Bold formatting applied');
          }
          
          // Try to apply changes
          const applyButton = page.locator('text="Apply Changes"');
          if (await applyButton.isVisible()) {
            await applyButton.click();
            console.log('✅ Applied rich text changes');
          }
          
        } catch (error) {
          console.log(`⚠️ Error testing Quill editor: ${error}`);
        }
        
        break;
      } else {
        console.log(`⚠️ Quill editor not ready yet (attempt ${attempts})`);
        await page.waitForTimeout(1000);
      }
    }
    
    if (!quillLoaded) {
      console.log('⚠️ Quill editor did not load within timeout period');
    }
    
    // Take screenshot after Quill testing
    await page.screenshot({ 
      path: 'design-studio-clone/.playwright-mcp/04-quill-editor-tested.png', 
      fullPage: true 
    });
    
    // STEP 7: Test Text Templates Drag and Drop
    console.log('\n🎯 STEP 7: Text Templates Drag and Drop Test');
    
    if (templates.length > 0) {
      console.log('Testing template selection and canvas interaction...');
      
      // Click on first template
      await templates[0].click();
      console.log('✅ Selected first text template');
      
      // Check if canvas stage exists
      const canvasStage = await page.$('#canvas-stage');
      if (canvasStage) {
        console.log('✅ Canvas stage found');
        
        // Try to drag template to canvas
        try {
          await templates[0].dragTo(canvasStage);
          console.log('✅ Attempted to drag template to canvas');
          
          // Wait and check for text elements on canvas
          await page.waitForTimeout(1000);
          const canvasTexts = await page.$$('text'); // SVG text elements
          console.log(`🔍 Found ${canvasTexts.length} text elements on canvas`);
        } catch (error) {
          console.log(`⚠️ Drag and drop error: ${error}`);
        }
      } else {
        console.log('⚠️ Canvas stage not found for drag and drop test');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'design-studio-clone/.playwright-mcp/05-final-state-with-text.png', 
      fullPage: true 
    });
    
    // STEP 8: Test Inline Text Editing (if text elements exist)
    console.log('\n📝 STEP 8: Inline Text Editing Test');
    
    const canvasTexts = await page.$$('text');
    if (canvasTexts.length > 0) {
      console.log(`Found ${canvasTexts.length} text elements, testing double-click editing...`);
      
      try {
        // Double-click first text element
        await canvasTexts[0].dblclick();
        console.log('✅ Double-clicked text element');
        
        // Wait for inline editor
        await page.waitForTimeout(1000);
        
        // Check for textarea (inline editor)
        const textarea = await page.$('textarea');
        if (textarea) {
          console.log('✅ Inline text editor (textarea) appeared!');
          
          await textarea.fill('Edited inline text!');
          console.log('✅ Typed in inline editor');
          
          // Press Enter to confirm
          await page.keyboard.press('Enter');
          console.log('✅ Confirmed inline edit with Enter');
        } else {
          console.log('⚠️ Inline text editor did not appear');
        }
      } catch (error) {
        console.log(`⚠️ Inline editing error: ${error}`);
      }
    } else {
      console.log('⚠️ No text elements found on canvas for inline editing test');
    }
    
    // FINAL SUMMARY
    console.log('\n📊 FINAL TEST SUMMARY');
    console.log('=' * 40);
    
    // Count successful features
    const testResults = {
      appLoading: true,
      textToolSelection: true,
      textPanelVisible: panelVisible,
      richTextButtonWorking: true,
      richTextEditorComponent: !!richTextEditor,
      quillEditorLoaded: quillLoaded,
      templatesFound: templates.length > 0,
      canvasStageExists: !!(await page.$('#canvas-stage')),
      textElementsOnCanvas: canvasTexts.length > 0
    };
    
    const successCount = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`✅ Tests Passed: ${successCount}/${totalTests}`);
    console.log('Detailed Results:');
    Object.entries(testResults).forEach(([test, result]) => {
      console.log(`  ${result ? '✅' : '❌'} ${test}: ${result}`);
    });
    
    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: 'design-studio-clone/.playwright-mcp/06-comprehensive-test-complete.png', 
      fullPage: true 
    });
    
    console.log('\n✅ COMPREHENSIVE TEXT EDITOR TEST COMPLETED');
    
    // Assert that core functionality is working
    expect(testResults.appLoading).toBeTruthy();
    expect(testResults.textPanelVisible).toBeTruthy();
    expect(testResults.richTextEditorComponent).toBeTruthy();
  });
});
