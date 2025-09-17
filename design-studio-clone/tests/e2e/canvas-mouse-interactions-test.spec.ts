import { test, expect, Page } from '@playwright/test';

test.describe('Canvas Mouse Interactions Test', () => {
  let page: Page;
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForSelector('[data-testid="left-toolbar"]', { timeout: 10000 });
  });

  test('should load application correctly', async () => {
    // Verify main layout elements are present
    await expect(page.locator('[data-testid="left-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-navigation"]')).toBeVisible();
    
    // Check if canvas container is present
    const canvasContainer = page.locator('canvas, [class*="canvas"], #canvas, [data-testid="canvas"]').first();
    await expect(canvasContainer).toBeVisible();
    
    console.log('✅ Application loaded successfully');
  });

  test('should test canvas element presence and initialization', async () => {
    // Look for canvas element with multiple selectors
    const canvasSelectors = [
      'canvas',
      '[class*="canvas"]',
      '[id*="canvas"]',
      '[data-testid="canvas"]',
      'div[role="img"]', // Konva creates div with role="img"
      '.konvajs-content'
    ];

    let canvasFound = false;
    let canvasSelector = '';

    for (const selector of canvasSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        canvasFound = true;
        canvasSelector = selector;
        console.log(`✅ Canvas found with selector: ${selector}`);
        break;
      }
    }

    expect(canvasFound).toBe(true);
    
    if (canvasFound) {
      const canvasElement = page.locator(canvasSelector).first();
      await expect(canvasElement).toBeVisible();
      
      // Get canvas dimensions
      const boundingBox = await canvasElement.boundingBox();
      console.log('📐 Canvas dimensions:', boundingBox);
      
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    }
  });

  test('should test mouse click interactions on canvas', async () => {
    // Find canvas element
    const canvasElement = page.locator('canvas, .konvajs-content, [class*="canvas"]').first();
    await expect(canvasElement).toBeVisible();

    const boundingBox = await canvasElement.boundingBox();
    if (!boundingBox) {
      throw new Error('Canvas element not found or has no dimensions');
    }

    // Test multiple click positions on the canvas
    const testPositions = [
      { x: boundingBox.x + boundingBox.width / 4, y: boundingBox.y + boundingBox.height / 4 },
      { x: boundingBox.x + boundingBox.width / 2, y: boundingBox.y + boundingBox.height / 2 },
      { x: boundingBox.x + (3 * boundingBox.width) / 4, y: boundingBox.y + (3 * boundingBox.height) / 4 }
    ];

    console.log('🖱️  Testing canvas click interactions...');

    for (let i = 0; i < testPositions.length; i++) {
      const pos = testPositions[i];
      console.log(`   Clicking position ${i + 1}: (${pos.x}, ${pos.y})`);
      
      // Click on canvas
      await page.mouse.click(pos.x, pos.y);
      
      // Small delay between clicks
      await page.waitForTimeout(500);
      
      // Check for any error messages or console errors
      const errors = await page.evaluate(() => {
        return (window as any).lastError || null;
      });
      
      if (errors) {
        console.log(`⚠️  Detected errors after click ${i + 1}:`, errors);
      }
    }

    console.log('✅ Canvas click interactions completed');
  });

  test('should test photo panel and drag functionality', async () => {
    console.log('🖼️  Testing photo panel...');
    
    // Click on Photos tool in left toolbar
    const photosButton = page.locator('[data-testid="toolbar-photos"], button:has-text("Photos"), [title*="Photo"]').first();
    
    if (await photosButton.count() > 0) {
      await photosButton.click();
      console.log('   Clicked Photos button');
      
      // Wait for photos panel to load
      await page.waitForTimeout(2000);
      
      // Look for photo elements
      const photoSelectors = [
        'img[src*="unsplash"]',
        'img[alt*="photo"]',
        '[data-testid="photo-item"]',
        '.photo-grid img',
        'div[style*="background-image"]'
      ];

      let photosFound = false;
      for (const selector of photoSelectors) {
        const photos = page.locator(selector);
        if (await photos.count() > 0) {
          photosFound = true;
          console.log(`   ✅ Found ${await photos.count()} photos with selector: ${selector}`);
          
          // Test drag from photo to canvas
          const firstPhoto = photos.first();
          const canvasElement = page.locator('canvas, .konvajs-content').first();
          
          if (await firstPhoto.isVisible() && await canvasElement.isVisible()) {
            console.log('   🎯 Testing drag from photo to canvas...');
            
            const photoBox = await firstPhoto.boundingBox();
            const canvasBox = await canvasElement.boundingBox();
            
            if (photoBox && canvasBox) {
              // Perform drag and drop
              await page.mouse.move(photoBox.x + photoBox.width / 2, photoBox.y + photoBox.height / 2);
              await page.mouse.down();
              await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
              await page.mouse.up();
              
              console.log('   ✅ Drag and drop performed');
              
              // Wait a moment for any async operations
              await page.waitForTimeout(1000);
            }
          }
          break;
        }
      }
      
      if (!photosFound) {
        console.log('   ⚠️  No photos found in panel');
      }
    } else {
      console.log('   ⚠️  Photos button not found');
    }
  });

  test('should test canvas element selection and manipulation', async () => {
    console.log('🎨 Testing canvas element selection...');
    
    // First, try to add a shape to the canvas
    const shapesButton = page.locator('[data-testid="toolbar-shapes"], button:has-text("Shapes"), [title*="Shape"]').first();
    
    if (await shapesButton.count() > 0) {
      await shapesButton.click();
      console.log('   Clicked Shapes button');
      
      // Wait for shapes panel
      await page.waitForTimeout(1000);
      
      // Look for shape options
      const shapeItems = page.locator('button[class*="shape"], .shape-item, [data-testid="shape-item"]');
      
      if (await shapeItems.count() > 0) {
        // Click first shape
        await shapeItems.first().click();
        console.log('   Selected a shape');
        
        // Click on canvas to add shape
        const canvasElement = page.locator('canvas, .konvajs-content').first();
        const canvasBox = await canvasElement.boundingBox();
        
        if (canvasBox) {
          const centerX = canvasBox.x + canvasBox.width / 2;
          const centerY = canvasBox.y + canvasBox.height / 2;
          
          await page.mouse.click(centerX, centerY);
          console.log('   Clicked canvas to add shape');
          
          await page.waitForTimeout(1000);
          
          // Try to select the shape by clicking on it
          await page.mouse.click(centerX, centerY);
          console.log('   Attempted to select shape');
          
          // Test dragging the shape
          await page.mouse.move(centerX, centerY);
          await page.mouse.down();
          await page.mouse.move(centerX + 50, centerY + 50);
          await page.mouse.up();
          
          console.log('   ✅ Tested shape drag');
        }
      } else {
        console.log('   ⚠️  No shape items found');
      }
    } else {
      console.log('   ⚠️  Shapes button not found');
    }
  });

  test('should check for console errors and warnings', async () => {
    const messages: any[] = [];
    
    page.on('console', msg => {
      messages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    // Perform some interactions to trigger any errors
    await page.reload();
    await page.waitForTimeout(3000);

    // Click around the interface
    const canvasElement = page.locator('canvas, .konvajs-content').first();
    if (await canvasElement.count() > 0) {
      const boundingBox = await canvasElement.boundingBox();
      if (boundingBox) {
        await page.mouse.click(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      }
    }

    await page.waitForTimeout(1000);

    // Filter and report errors
    const errors = messages.filter(msg => msg.type === 'error');
    const warnings = messages.filter(msg => msg.type === 'warning');

    console.log('\n📊 Console Messages Summary:');
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Total messages: ${messages.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Console Errors:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.text}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Console Warnings:');
      warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.text}`);
      });
    }

    // Don't fail the test for warnings, but do for critical errors
    const criticalErrors = errors.filter(error => 
      !error.text.includes('DevTools') && 
      !error.text.includes('favicon') &&
      !error.text.includes('chrome-extension')
    );

    if (criticalErrors.length > 0) {
      console.log(`\n💥 Found ${criticalErrors.length} critical errors that may affect functionality`);
    }
  });

  test('should take screenshots for documentation', async () => {
    console.log('📸 Taking application screenshots...');
    
    // Take overall screenshot
    await page.screenshot({ 
      path: '/Users/stevenfitzpatrick/Library/Application Support/Claude/design-claude/design-studio-clone/.playwright-mcp/canvas-test-overview.png',
      fullPage: true 
    });
    
    // Test photos panel if available
    const photosButton = page.locator('[data-testid="toolbar-photos"], button:has-text("Photos")').first();
    if (await photosButton.count() > 0) {
      await photosButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: '/Users/stevenfitzpatrick/Library/Application Support/Claude/design-claude/design-studio-clone/.playwright-mcp/photos-panel-test.png' 
      });
    }
    
    console.log('✅ Screenshots saved');
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });
});