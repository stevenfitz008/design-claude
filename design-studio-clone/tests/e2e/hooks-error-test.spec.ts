import { test, expect, Page } from '@playwright/test';

test.describe('React Hooks Error Investigation', () => {
  let page: Page;
  let reactErrors: string[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    reactErrors = [];
    
    // Capture React errors and warnings
    page.on('console', (msg) => {
      const message = msg.text();
      if (message.includes('hook') || 
          message.includes('render') || 
          message.includes('Rendered more hooks') ||
          message.includes('fewer hooks') ||
          message.includes('previous render')) {
        reactErrors.push(`[${msg.type()}] ${message}`);
      }
    });
    
    page.on('pageerror', (error) => {
      if (error.message.includes('hook') || 
          error.message.includes('render') || 
          error.message.includes('Rendered more hooks')) {
        reactErrors.push(`[Page Error] ${error.message}`);
      }
    });

    // Inject error tracking into page
    await page.addInitScript(() => {
      const originalError = console.error;
      const originalWarn = console.warn;
      
      (window as any).reactHookErrors = [];
      
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('hook') || 
            message.includes('render') || 
            message.includes('Rendered more hooks') ||
            message.includes('fewer hooks')) {
          (window as any).reactHookErrors.push(`ERROR: ${message}`);
        }
        originalError.apply(console, args);
      };
      
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('hook') || 
            message.includes('render') || 
            message.includes('Rendered more hooks') ||
            message.includes('fewer hooks')) {
          (window as any).reactHookErrors.push(`WARN: ${message}`);
        }
        originalWarn.apply(console, args);
      };
    });

    // Navigate to application
    await page.goto('http://localhost:3000');
    
    // Wait for application to load
    await page.waitForSelector('[data-testid="left-toolbar"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow React to fully initialize
  });

  test('should detect CanvasImageElement hooks error during drag-drop', async () => {
    console.log('🔍 Starting React hooks error investigation...');

    // Step 1: Open Photos panel
    console.log('📸 Opening Photos panel...');
    await page.locator('[data-testid="tool-photos"]').click();
    await page.waitForTimeout(3000); // Wait for photos to load
    
    // Check for initial errors
    let pageErrors = await page.evaluate(() => {
      return (window as any).reactHookErrors || [];
    });
    console.log('Initial errors after opening Photos panel:', pageErrors);

    // Step 2: Wait for photos to load
    const photoElements = page.locator('.photo-item');
    await photoElements.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Photos loaded successfully');

    // Step 3: Try to simulate the exact drag-drop action that causes the error
    console.log('🎯 Starting drag and drop simulation...');
    
    // Get the first photo and canvas
    const firstPhoto = photoElements.first();
    const canvas = page.locator('[data-testid="main-canvas"]');
    
    // Ensure both elements are visible
    await expect(firstPhoto).toBeVisible();
    await expect(canvas).toBeVisible();
    
    // Method 1: Try HTML5 drag and drop
    console.log('🔄 Method 1: HTML5 drag and drop');
    await page.evaluate(async () => {
      const photoElement = document.querySelector('.photo-item') as HTMLElement;
      const canvasElement = document.querySelector('[data-testid="main-canvas"]') as HTMLElement;
      
      if (photoElement && canvasElement) {
        console.log('🎪 Simulating drag events...');
        
        // Create realistic drag data
        const dragData = JSON.stringify({
          type: 'photo',
          src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
          alt: 'Test photo for hooks error',
          id: 'hooks-test-photo'
        });
        
        // Create and dispatch events
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('application/json', dragData);
        
        // Sequence of drag events
        photoElement.dispatchEvent(new DragEvent('dragstart', { 
          bubbles: true, 
          cancelable: true, 
          dataTransfer 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        canvasElement.dispatchEvent(new DragEvent('dragenter', { 
          bubbles: true, 
          cancelable: true, 
          dataTransfer 
        }));
        
        canvasElement.dispatchEvent(new DragEvent('dragover', { 
          bubbles: true, 
          cancelable: true, 
          dataTransfer 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // This is where the hooks error typically occurs
        console.log('🎯 Dispatching DROP event (this may trigger hooks error)...');
        canvasElement.dispatchEvent(new DragEvent('drop', { 
          bubbles: true, 
          cancelable: true, 
          dataTransfer 
        }));
        
        console.log('✅ Drop event dispatched');
      }
    });
    
    // Wait for React to process the drop
    await page.waitForTimeout(2000);
    
    // Check for errors after drag-drop
    pageErrors = await page.evaluate(() => {
      return (window as any).reactHookErrors || [];
    });
    console.log('Errors after drag-drop:', pageErrors);

    // Step 4: Check if CanvasImageElement was created
    const canvasImages = await page.evaluate(() => {
      // Look for image elements in the canvas
      const konvaImages = document.querySelectorAll('.konvajs-content image');
      return {
        konvaImageCount: konvaImages.length,
        hasCanvasElements: document.querySelector('[data-canvas-element-type="image"]') !== null
      };
    });
    console.log('Canvas state after drop:', canvasImages);

    // Step 5: Try to directly trigger CanvasImageElement creation
    console.log('🔧 Method 2: Direct element creation');
    await page.evaluate(() => {
      // Access canvas store directly
      const canvasStore = (window as any).__canvasStore;
      if (canvasStore && canvasStore.addElement) {
        console.log('📦 Adding image element directly...');
        
        try {
          canvasStore.addElement({
            id: 'hooks-test-direct-' + Date.now(),
            type: 'image',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            visible: true,
            locked: false,
            zIndex: 1,
            src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
            alt: 'Direct test image',
            originalWidth: 200,
            originalHeight: 200,
            fit: 'cover',
            filters: {
              brightness: 100,
              contrast: 100,
              saturation: 100,
              hue: 0,
              blur: 0,
              sepia: 0,
              grayscale: 0
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          console.log('✅ Image element added directly');
        } catch (error) {
          console.error('❌ Error adding element directly:', error);
          (window as any).reactHookErrors.push(`Direct add error: ${error.message}`);
        }
      } else {
        console.log('❌ Canvas store not found');
      }
    });
    
    // Wait for processing
    await page.waitForTimeout(3000);
    
    // Final error check
    pageErrors = await page.evaluate(() => {
      return (window as any).reactHookErrors || [];
    });
    console.log('Final errors after all tests:', pageErrors);
    
    // Take screenshot of final state
    await page.screenshot({ 
      path: '.playwright-mcp/hooks-error-investigation.png',
      fullPage: true
    });
    
    // Report findings
    console.log('\n🔍 INVESTIGATION RESULTS:');
    console.log('=========================');
    console.log(`Total React hook errors detected: ${pageErrors.length}`);
    console.log(`React errors from test listener: ${reactErrors.length}`);
    
    if (pageErrors.length > 0) {
      console.log('\n❌ HOOK ERRORS FOUND:');
      pageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (reactErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS FOUND:');
      reactErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // The test should pass even if we find errors - we're just investigating
    expect(true).toBeTruthy(); // Always pass, we're just collecting data
  });

  test('should analyze CanvasImageElement component structure', async () => {
    console.log('🔬 Analyzing CanvasImageElement component structure...');
    
    // Get information about the component
    const componentInfo = await page.evaluate(() => {
      // Look for React DevTools or component information
      const reactInfo = {
        hasReactDevTools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        reactVersion: '',
        componentCount: 0
      };
      
      try {
        // Try to get React version
        const react = (window as any).React;
        if (react && react.version) {
          reactInfo.reactVersion = react.version;
        }
        
        // Count React components in DOM
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          if (el.tagName && (el as any)._reactInternalFiber) {
            reactInfo.componentCount++;
          }
        });
        
      } catch (error) {
        console.log('Error analyzing React components:', error);
      }
      
      return reactInfo;
    });
    
    console.log('React component info:', componentInfo);
    
    // Check if we can find the CanvasEngine component
    const canvasEngineInfo = await page.evaluate(() => {
      const canvasEngine = document.querySelector('[data-testid="main-canvas"] .konvajs-content');
      return {
        exists: !!canvasEngine,
        parentClasses: canvasEngine?.parentElement?.className,
        siblingCount: canvasEngine?.parentElement?.children.length
      };
    });
    
    console.log('Canvas engine info:', canvasEngineInfo);
    
    // Take a detailed screenshot
    await page.screenshot({ 
      path: '.playwright-mcp/component-structure-analysis.png',
      fullPage: true
    });
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });
});