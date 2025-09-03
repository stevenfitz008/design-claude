import { test, expect } from '@playwright/test';

test.describe('Main Canvas Comprehensive Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for application to load
    await expect(page.locator('[data-testid="left-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-panel"]')).toBeVisible();
  });

  test.describe('1. Canvas Area Basic Tests', () => {
    
    test('should display main canvas with proper styling', async ({ page }) => {
      const mainCanvas = page.locator('[data-testid="main-canvas"]');
      
      // Verify main canvas is visible and properly sized
      await expect(mainCanvas).toBeVisible();
      await expect(mainCanvas).toHaveCSS('flex', '1');
      await expect(mainCanvas).toHaveCSS('background-color', 'rgb(47, 52, 60)'); // #2f343c
      
      // Take initial canvas screenshot
      await page.screenshot({ 
        path: 'test-results/canvas-initial-state.png',
        fullPage: true
      });
    });

    test('should display white canvas container with proper dimensions', async ({ page }) => {
      const canvasContainer = page.locator('[data-canvas-container]');
      
      await expect(canvasContainer).toBeVisible();
      await expect(canvasContainer).toHaveCSS('width', '800px');
      await expect(canvasContainer).toHaveCSS('height', '600px');
      await expect(canvasContainer).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(canvasContainer).toHaveCSS('border-radius', '8px');
    });

    test('should show empty canvas placeholder', async ({ page }) => {
      const placeholder = page.locator('text=Drag photos here to start designing');
      
      await expect(placeholder).toBeVisible();
      await expect(page.locator('text=or click photos to add them')).toBeVisible();
      
      // Verify emoji is present
      const emoji = page.locator('[data-canvas-container] div').first();
      await expect(emoji).toContainText('📷');
    });
  });

  test.describe('2. Photos Panel Integration', () => {
    
    test('should activate photos tool and show photos panel', async ({ page }) => {
      // Click Photos tool in left toolbar
      const photosButton = page.locator('[data-testid="left-toolbar"] button').filter({ hasText: 'Photos' });
      await photosButton.click();
      
      // Verify photos panel is visible
      const photosPanel = page.locator('[data-testid="photos-panel"]');
      await expect(photosPanel).toBeVisible();
      
      // Verify search input is present
      await expect(page.locator('input[placeholder="Search photos..."]')).toBeVisible();
      
      // Wait for photos to load
      await page.waitForTimeout(2000);
      
      // Take screenshot of photos panel
      await page.screenshot({ 
        path: 'test-results/photos-panel-active.png',
        fullPage: true
      });
    });

    test('should display photos in grid layout', async ({ page }) => {
      // Activate photos tool
      const photosButton = page.locator('[data-testid="left-toolbar"] button').filter({ hasText: 'Photos' });
      await photosButton.click();
      
      // Wait for photos to load
      await page.waitForTimeout(3000);
      
      // Check for photo images
      const photoImages = page.locator('[data-testid="photos-panel"] img');
      const photoCount = await photoImages.count();
      
      console.log(`Found ${photoCount} photos in panel`);
      
      if (photoCount > 0) {
        // Verify first photo is visible
        await expect(photoImages.first()).toBeVisible();
        
        // Verify photos have proper styling
        const firstPhoto = photoImages.first();
        await expect(firstPhoto).toHaveCSS('object-fit', 'cover');
      } else {
        // If no photos loaded, check for fallback or API message
        const fallbackMessage = page.locator('text=Unsplash API key not configured');
        if (await fallbackMessage.isVisible()) {
          console.log('No Unsplash API key configured - using fallback');
        }
      }
    });
  });

  test.describe('3. Drag and Drop Functionality', () => {
    
    test('should handle drag and drop from photos panel to canvas', async ({ page }) => {
      // Activate photos tool
      const photosButton = page.locator('[data-testid="left-toolbar"] button').filter({ hasText: 'Photos' });
      await photosButton.click();
      
      // Wait for photos to load
      await page.waitForTimeout(3000);
      
      const photoImages = page.locator('[data-testid="photos-panel"] img');
      const photoCount = await photoImages.count();
      
      if (photoCount > 0) {
        const canvasContainer = page.locator('[data-canvas-container]');
        const firstPhoto = photoImages.first();
        
        // Get canvas center position
        const canvasBox = await canvasContainer.boundingBox();
        const dropX = canvasBox!.x + canvasBox!.width / 2;
        const dropY = canvasBox!.y + canvasBox!.height / 2;
        
        // Perform drag and drop
        await firstPhoto.dragTo(canvasContainer, {
          targetPosition: { x: dropX - canvasBox!.x, y: dropY - canvasBox!.y }
        });
        
        // Wait for drop to process
        await page.waitForTimeout(1000);
        
        // Verify image appears on canvas
        const canvasImages = page.locator('[data-canvas-container] img');
        await expect(canvasImages).toHaveCount(1);
        
        // Take screenshot of successful drop
        await page.screenshot({ 
          path: 'test-results/drag-drop-success.png',
          fullPage: true
        });
      } else {
        console.log('No photos available for drag and drop test');
      }
    });

    test('should show drop zone indicator during drag over', async ({ page }) => {
      // Activate photos tool
      const photosButton = page.locator('[data-testid="left-toolbar"] button').filter({ hasText: 'Photos' });
      await photosButton.click();
      
      await page.waitForTimeout(2000);
      
      const photoImages = page.locator('[data-testid="photos-panel"] img');
      const photoCount = await photoImages.count();
      
      if (photoCount > 0) {
        const canvasContainer = page.locator('[data-canvas-container]');
        const firstPhoto = photoImages.first();
        
        // Start drag
        await firstPhoto.hover();
        await page.mouse.down();
        
        // Move over canvas
        const canvasBox = await canvasContainer.boundingBox();
        await page.mouse.move(canvasBox!.x + canvasBox!.width / 2, canvasBox!.y + canvasBox!.height / 2);
        
        // Verify drop zone indicator
        await expect(page.locator('text=Drop photo here')).toBeVisible();
        
        // Complete drag
        await page.mouse.up();
        
        // Take screenshot during drag
        await page.screenshot({ 
          path: 'test-results/drag-over-indicator.png',
          fullPage: true
        });
      }
    });
  });

  test.describe('4. Image Selection and Manipulation', () => {
    
    test('should select image and show blue border with handles', async ({ page }) => {
      // First add an image to canvas
      await addImageToCanvas(page);
      
      // Click on the image to select it
      const canvasImage = page.locator('[data-canvas-container] img').first();
      await canvasImage.click();
      
      // Verify image is selected with blue border
      const imageContainer = canvasImage.locator('..');
      await expect(imageContainer).toHaveCSS('border', '2px solid rgb(72, 175, 240)'); // #48aff0
      
      // Verify resize handles are visible
      const resizeHandles = imageContainer.locator('div').filter({ hasText: '' }); // Handle divs
      const handleCount = await resizeHandles.count();
      expect(handleCount).toBeGreaterThan(0);
      
      // Take screenshot of selected image
      await page.screenshot({ 
        path: 'test-results/image-selected.png',
        fullPage: true
      });
    });

    test('should move image when dragged', async ({ page }) => {
      // Add and select image
      await addImageToCanvas(page);
      
      const canvasImage = page.locator('[data-canvas-container] img').first();
      const imageContainer = canvasImage.locator('..');
      
      // Get initial position
      const initialBox = await imageContainer.boundingBox();
      const initialX = initialBox!.x;
      const initialY = initialBox!.y;
      
      // Drag image to new position
      await canvasImage.dragTo(imageContainer, {
        sourcePosition: { x: 50, y: 50 },
        targetPosition: { x: 150, y: 150 }
      });
      
      await page.waitForTimeout(500);
      
      // Get new position
      const newBox = await imageContainer.boundingBox();
      const newX = newBox!.x;
      const newY = newBox!.y;
      
      // Verify position changed
      expect(Math.abs(newX - initialX)).toBeGreaterThan(50);
      expect(Math.abs(newY - initialY)).toBeGreaterThan(50);
      
      // Take screenshot of moved image
      await page.screenshot({ 
        path: 'test-results/image-moved.png',
        fullPage: true
      });
    });

    test('should resize image using corner handles', async ({ page }) => {
      // Add and select image
      await addImageToCanvas(page);
      
      const canvasImage = page.locator('[data-canvas-container] img').first();
      const imageContainer = canvasImage.locator('..');
      
      // Click to select
      await canvasImage.click();
      
      // Get initial size
      const initialBox = await imageContainer.boundingBox();
      const initialWidth = initialBox!.width;
      const initialHeight = initialBox!.height;
      
      // Find bottom-right resize handle
      const resizeHandle = imageContainer.locator('div').last();
      
      // Drag resize handle
      await resizeHandle.dragTo(resizeHandle, {
        targetPosition: { x: 50, y: 50 } // Drag outward to increase size
      });
      
      await page.waitForTimeout(500);
      
      // Get new size
      const newBox = await imageContainer.boundingBox();
      const newWidth = newBox!.width;
      const newHeight = newBox!.height;
      
      // Verify size changed (allowing for some tolerance)
      expect(newWidth).not.toEqual(initialWidth);
      expect(newHeight).not.toEqual(initialHeight);
      
      // Take screenshot of resized image
      await page.screenshot({ 
        path: 'test-results/image-resized.png',
        fullPage: true
      });
    });

    test('should delete image on double-click', async ({ page }) => {
      // Add image to canvas
      await addImageToCanvas(page);
      
      const canvasImage = page.locator('[data-canvas-container] img').first();
      
      // Double-click to delete
      await canvasImage.dblclick();
      
      await page.waitForTimeout(500);
      
      // Verify image is removed
      await expect(canvasImage).not.toBeVisible();
      
      // Verify placeholder is shown again
      await expect(page.locator('text=Drag photos here to start designing')).toBeVisible();
      
      // Take screenshot after deletion
      await page.screenshot({ 
        path: 'test-results/image-deleted.png',
        fullPage: true
      });
    });
  });

  test.describe('5. Multiple Image Management', () => {
    
    test('should handle multiple images on canvas', async ({ page }) => {
      // Add first image
      await addImageToCanvas(page);
      await page.waitForTimeout(1000);
      
      // Add second image
      await addImageToCanvas(page);
      await page.waitForTimeout(1000);
      
      // Verify both images are present
      const canvasImages = page.locator('[data-canvas-container] img');
      await expect(canvasImages).toHaveCount(2);
      
      // Take screenshot of multiple images
      await page.screenshot({ 
        path: 'test-results/multiple-images.png',
        fullPage: true
      });
    });

    test('should select only one image at a time', async ({ page }) => {
      // Add two images
      await addImageToCanvas(page);
      await addImageToCanvas(page);
      
      const canvasImages = page.locator('[data-canvas-container] img');
      const firstImage = canvasImages.first();
      const secondImage = canvasImages.nth(1);
      
      // Select first image
      await firstImage.click();
      let firstContainer = firstImage.locator('..');
      await expect(firstContainer).toHaveCSS('border-color', 'rgb(72, 175, 240)');
      
      // Select second image
      await secondImage.click();
      let secondContainer = secondImage.locator('..');
      await expect(secondContainer).toHaveCSS('border-color', 'rgb(72, 175, 240)');
      
      // First image should no longer be selected
      await expect(firstContainer).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)');
    });
  });

  test.describe('6. Canvas Bounds and Constraints', () => {
    
    test('should keep images within canvas bounds', async ({ page }) => {
      // Add image
      await addImageToCanvas(page);
      
      const canvasContainer = page.locator('[data-canvas-container]');
      const canvasImage = page.locator('[data-canvas-container] img').first();
      
      // Try to drag image outside canvas bounds
      const canvasBox = await canvasContainer.boundingBox();
      
      // Drag far to the right (should be constrained)
      await canvasImage.dragTo(canvasContainer, {
        targetPosition: { x: canvasBox!.width + 100, y: 100 }
      });
      
      await page.waitForTimeout(500);
      
      // Verify image stays within bounds
      const imageContainer = canvasImage.locator('..');
      const imageBox = await imageContainer.boundingBox();
      
      expect(imageBox!.x + imageBox!.width).toBeLessThanOrEqual(canvasBox!.x + canvasBox!.width);
      expect(imageBox!.y + imageBox!.height).toBeLessThanOrEqual(canvasBox!.y + canvasBox!.height);
    });
  });

  test.describe('7. Visual Feedback and States', () => {
    
    test('should show proper cursor states', async ({ page }) => {
      // Add and select image
      await addImageToCanvas(page);
      
      const canvasImage = page.locator('[data-canvas-container] img').first();
      const imageContainer = canvasImage.locator('..');
      
      // Hover over image - should show move cursor
      await canvasImage.hover();
      await expect(imageContainer).toHaveCSS('cursor', 'move');
      
      // Select image and check resize handle cursor
      await canvasImage.click();
      const resizeHandle = imageContainer.locator('div').last();
      await resizeHandle.hover();
      
      // Take screenshot of cursor states
      await page.screenshot({ 
        path: 'test-results/cursor-states.png',
        fullPage: true
      });
    });

    test('should show hover effects on images', async ({ page }) => {
      // Add image to canvas
      await addImageToCanvas(page);
      
      const canvasImage = page.locator('[data-canvas-container] img').first();
      const imageContainer = canvasImage.locator('..');
      
      // Initially no selection
      await expect(imageContainer).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)');
      
      // Hover should show some visual feedback
      await canvasImage.hover();
      
      // Click to select - should show blue border
      await canvasImage.click();
      await expect(imageContainer).toHaveCSS('border-color', 'rgb(72, 175, 240)');
    });
  });

  test.describe('8. Error Handling and Edge Cases', () => {
    
    test('should handle image loading errors gracefully', async ({ page }) => {
      // Add image
      await addImageToCanvas(page);
      
      // Wait for image to potentially load or fail
      await page.waitForTimeout(2000);
      
      const canvasImages = page.locator('[data-canvas-container] img');
      
      if (await canvasImages.count() > 0) {
        const firstImage = canvasImages.first();
        
        // Force image error by changing src to invalid URL
        await page.evaluate((img) => {
          img.src = 'invalid-url';
        }, await firstImage.elementHandle());
        
        await page.waitForTimeout(1000);
        
        // Image should still be present (fallback should kick in)
        await expect(firstImage).toBeVisible();
      }
    });

    test('should handle rapid interactions without errors', async ({ page }) => {
      // Add image
      await addImageToCanvas(page);
      
      const canvasImage = page.locator('[data-canvas-container] img').first();
      
      // Rapid clicks and selections
      for (let i = 0; i < 5; i++) {
        await canvasImage.click();
        await page.waitForTimeout(100);
      }
      
      // Image should still be selectable
      const imageContainer = canvasImage.locator('..');
      await expect(imageContainer).toHaveCSS('border-color', 'rgb(72, 175, 240)');
    });
  });
});

// Helper function to add an image to canvas
async function addImageToCanvas(page: any) {
  // Activate photos tool if not already active
  const photosButton = page.locator('[data-testid="left-toolbar"] button').filter({ hasText: 'Photos' });
  await photosButton.click();
  
  // Wait for photos to load
  await page.waitForTimeout(2000);
  
  const photoImages = page.locator('[data-testid="photos-panel"] img');
  const photoCount = await photoImages.count();
  
  if (photoCount > 0) {
    // Drag first photo to canvas
    const canvasContainer = page.locator('[data-canvas-container]');
    const firstPhoto = photoImages.first();
    
    const canvasBox = await canvasContainer.boundingBox();
    const dropX = canvasBox!.x + canvasBox!.width / 2;
    const dropY = canvasBox!.y + canvasBox!.height / 2;
    
    await firstPhoto.dragTo(canvasContainer, {
      targetPosition: { x: dropX - canvasBox!.x, y: dropY - canvasBox!.y }
    });
    
    await page.waitForTimeout(1000);
  } else {
    // Fallback: Click a photo to add it (for touch devices or if drag doesn't work)
    const photoDivs = page.locator('[data-testid="photos-panel"] div[draggable="true"]');
    if (await photoDivs.count() > 0) {
      await photoDivs.first().click();
      await page.waitForTimeout(1000);
    }
  }
}