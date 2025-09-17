import { test, expect, Page } from '@playwright/test';

test.describe('Manual Text Editor Test', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('pageerror', error => console.error(`PAGE ERROR: ${error.message}`));
    
    // Navigate to the Design Studio application
    await page.goto('http://localhost:3000');
    
    // Wait longer for the application to load
    await page.waitForTimeout(5000);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Should load application and take screenshots', async () => {
    console.log('🔍 Manual verification of text editor functionality');
    
    // Take initial screenshot
    await page.screenshot({ path: 'design-studio-clone/.playwright-mcp/app-loaded.png', fullPage: true });
    console.log('✅ Initial screenshot taken');
    
    // Check if basic elements are loaded
    const bodyContent = await page.textContent('body');
    console.log('Body content length:', bodyContent?.length || 0);
    
    // Try to find any visible elements
    const allElements = await page.$$('*');
    console.log('Total elements found:', allElements.length);
    
    // Check for left toolbar specifically
    const toolbar = await page.$('[data-testid="left-toolbar"]');
    if (toolbar) {
      console.log('✅ Left toolbar found');
      const toolbarVisible = await toolbar.isVisible();
      console.log('Toolbar visible:', toolbarVisible);
      
      if (toolbarVisible) {
        // Try clicking the text tool
        const textTool = await page.$('[data-testid="tool-text"]');
        if (textTool) {
          console.log('✅ Text tool found');
          await textTool.click();
          await page.waitForTimeout(2000);
          
          // Take screenshot after clicking text tool
          await page.screenshot({ path: 'design-studio-clone/.playwright-mcp/text-tool-clicked.png', fullPage: true });
          console.log('✅ Screenshot taken after clicking text tool');
          
          // Check for text panel
          const textPanel = await page.$('[data-testid="text-panel"]');
          if (textPanel) {
            console.log('✅ Text panel found!');
            const panelVisible = await textPanel.isVisible();
            console.log('Text panel visible:', panelVisible);
            
            if (panelVisible) {
              // Look for Rich Text Editor button
              const richTextButton = await page.$('text="✨ Rich Text Editor"');
              if (richTextButton) {
                console.log('✅ Rich Text Editor button found');
                await richTextButton.click();
                await page.waitForTimeout(3000);
                
                // Take screenshot of rich text editor
                await page.screenshot({ path: 'design-studio-clone/.playwright-mcp/rich-text-editor-opened.png', fullPage: true });
                console.log('✅ Rich Text Editor screenshot taken');
                
                // Check for Quill editor
                const quillEditor = await page.$('.ql-editor');
                if (quillEditor) {
                  console.log('✅ Quill editor found!');
                  
                  // Try typing in the editor
                  await quillEditor.click();
                  await quillEditor.fill('Test rich text content!');
                  console.log('✅ Text typed in rich editor');
                  
                  // Final screenshot
                  await page.screenshot({ path: 'design-studio-clone/.playwright-mcp/rich-text-with-content.png', fullPage: true });
                } else {
                  console.log('⚠️ Quill editor not found');
                }
              } else {
                console.log('⚠️ Rich Text Editor button not found');
              }
            }
          } else {
            console.log('⚠️ Text panel not found');
          }
        } else {
          console.log('⚠️ Text tool not found');
        }
      }
    } else {
      console.log('⚠️ Left toolbar not found');
    }
    
    // Log all data-testid elements
    const testIdElements = await page.$$('[data-testid]');
    console.log('\nFound elements with data-testid:');
    for (const element of testIdElements) {
      const testId = await element.getAttribute('data-testid');
      const tagName = await element.evaluate(el => el.tagName);
      const visible = await element.isVisible();
      console.log(`- ${testId} (${tagName}) - Visible: ${visible}`);
    }
  });
});
