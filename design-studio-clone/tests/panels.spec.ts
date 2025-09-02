import { test, expect } from '@playwright/test';

test.describe('Panel System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should display right panel with default templates panel', async ({ page }) => {
    // Check if right panel is visible
    const rightPanel = page.locator('[data-testid="right-panel"]');
    await expect(rightPanel).toBeVisible();
    
    // Check if templates panel is active by default
    const panelTitle = page.locator('.panel-title');
    await expect(panelTitle).toHaveText('Templates');
    
    // Check for templates grid
    const templatesGrid = page.locator('[data-testid="templates-grid"]');
    await expect(templatesGrid).toBeVisible();
  });

  test('should be able to collapse and expand the panel', async ({ page }) => {
    const rightPanel = page.locator('[data-testid="right-panel"]');
    const collapseButton = page.locator('[title="Collapse Panel"]');
    const expandButton = page.locator('[title="Expand Panel"]');
    
    // Initially expanded
    await expect(rightPanel).toHaveCSS('width', '350px');
    
    // Collapse panel
    await collapseButton.click();
    await expect(rightPanel).toHaveCSS('width', '50px');
    
    // Expand panel
    await expandButton.click();
    await expect(rightPanel).toHaveCSS('width', '350px');
  });

  test('should search templates', async ({ page }) => {
    const searchInput = page.locator('[placeholder="Search templates..."]');
    const templatesGrid = page.locator('[data-testid="templates-grid"]');
    
    // Type in search
    await searchInput.fill('business');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Check if business template is visible
    const businessTemplate = page.locator('[data-testid="template-tmpl_1"]');
    await expect(businessTemplate).toBeVisible();
  });

  test('should filter templates by category', async ({ page }) => {
    const categoryButton = page.locator('button:has-text("All Categories")');
    await categoryButton.click();
    
    // Select business category
    const businessCategory = page.locator('text=Business Cards');
    await businessCategory.click();
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Check if only business templates are shown
    const businessTemplate = page.locator('[data-testid="template-tmpl_1"]');
    await expect(businessTemplate).toBeVisible();
  });

  test('should toggle premium filter', async ({ page }) => {
    const premiumButton = page.locator('button:has-text("Premium")');
    
    // Click premium filter
    await premiumButton.click();
    
    // Check if premium badge is visible on premium templates
    const premiumBadge = page.locator('.premium-badge');
    await expect(premiumBadge.first()).toBeVisible();
  });

  test('should add template to canvas when clicked', async ({ page }) => {
    const template = page.locator('[data-testid="template-tmpl_1"]').first();
    
    // Click on template
    await template.click();
    
    // Wait for element to be added to canvas
    await page.waitForTimeout(1000);
    
    // Check if element was added to canvas
    const canvasElement = page.locator('[data-testid="canvas-element"]');
    await expect(canvasElement).toBeVisible();
  });

  test('should switch to photos panel', async ({ page }) => {
    // Simulate clicking on photos tool in left toolbar (we'll need to add this)
    // For now, let's test direct panel switching via store
    await page.evaluate(() => {
      // @ts-ignore
      window.usePanelStore.getState().setActivePanel('photos');
    });
    
    // Check if photos panel is active
    const panelTitle = page.locator('.panel-title');
    await expect(panelTitle).toHaveText('Photos');
    
    // Check for photos grid
    const photosGrid = page.locator('[data-testid="photos-grid"]');
    await expect(photosGrid).toBeVisible();
  });

  test('should search photos', async ({ page }) => {
    // Switch to photos panel
    await page.evaluate(() => {
      // @ts-ignore
      window.usePanelStore.getState().setActivePanel('photos');
    });
    
    const searchInput = page.locator('[placeholder="Search photos..."]');
    const photosGrid = page.locator('[data-testid="photos-grid"]');
    
    // Type in search
    await searchInput.fill('landscape');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Check if landscape photo is visible
    const landscapePhoto = page.locator('[data-testid="photo-photo_1"]');
    await expect(landscapePhoto).toBeVisible();
  });

  test('should load more photos', async ({ page }) => {
    // Switch to photos panel
    await page.evaluate(() => {
      // @ts-ignore
      window.usePanelStore.getState().setActivePanel('photos');
    });
    
    // Wait for initial photos to load
    await page.waitForSelector('[data-testid="photo-photo_1"]');
    
    const loadMoreButton = page.locator('button:has-text("Load More Photos")');
    await expect(loadMoreButton).toBeVisible();
    
    // Click load more
    await loadMoreButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="loading-photos"]', { state: 'hidden' });
    
    // Check if more photos were loaded
    const photos = page.locator('[data-testid^="photo-"]');
    await expect(photos).toHaveCountGreaterThan(3);
  });

  test('should add photo to canvas when clicked', async ({ page }) => {
    // Switch to photos panel
    await page.evaluate(() => {
      // @ts-ignore
      window.usePanelStore.getState().setActivePanel('photos');
    });
    
    // Wait for photos to load
    await page.waitForSelector('[data-testid="photo-photo_1"]');
    
    const photo = page.locator('[data-testid="photo-photo_1"]').first();
    
    // Click on photo
    await photo.click();
    
    // Wait for element to be added to canvas
    await page.waitForTimeout(1000);
    
    // Check if image element was added to canvas
    const canvasElement = page.locator('[data-testid="canvas-element"][data-type="image"]');
    await expect(canvasElement).toBeVisible();
  });

  test('should switch to text tools panel', async ({ page }) => {
    // Switch to text tools panel
    await page.evaluate(() => {
      // @ts-ignore
      window.usePanelStore.getState().setActivePanel('text');
    });
    
    // Check if text tools panel is active
    const panelTitle = page.locator('.panel-title');
    await expect(panelTitle).toHaveText('Text Tools');
    
    // Check for text buttons
    const headingButton = page.locator('button:has-text("Add a heading")');
    await expect(headingButton).toBeVisible();
  });

  test('should add text elements from text tools panel', async ({ page }) => {
    // Switch to text tools panel
    await page.evaluate(() => {
      // @ts-ignore
      window.usePanelStore.getState().setActivePanel('text');
    });
    
    const headingButton = page.locator('button:has-text("Add a heading")');
    
    // Click on heading button
    await headingButton.click();
    
    // Wait for element to be added to canvas
    await page.waitForTimeout(1000);
    
    // Check if text element was added to canvas
    const canvasElement = page.locator('[data-testid="canvas-element"][data-type="text"]');
    await expect(canvasElement).toBeVisible();
  });

  test('should navigate back in panel history', async ({ page }) => {
    // Start with templates panel (default)
    let panelTitle = page.locator('.panel-title');
    await expect(panelTitle).toHaveText('Templates');
    
    // Switch to photos panel
    await page.evaluate(() => {
      // @ts-ignore
      window.usePanelStore.getState().setActivePanel('photos');
    });
    
    await expect(panelTitle).toHaveText('Photos');
    
    // Check if back button is visible
    const backButton = page.locator('[title="Go Back"]');
    await expect(backButton).toBeVisible();
    
    // Click back button
    await backButton.click();
    
    // Should be back to templates panel
    await expect(panelTitle).toHaveText('Templates');
  });

  test('should handle panel state persistence', async ({ page }) => {
    const searchInput = page.locator('[placeholder="Search templates..."]');
    
    // Search for something in templates
    await searchInput.fill('business');
    
    // Switch to photos panel
    await page.evaluate(() => {
      // @ts-ignore
      window.usePanelStore.getState().setActivePanel('photos');
    });
    
    // Switch back to templates
    await page.evaluate(() => {
      // @ts-ignore
      window.usePanelStore.getState().setActivePanel('templates');
    });
    
    // Search should be cleared (as per design)
    await expect(searchInput).toHaveValue('');
  });
});

test.describe('Panel Responsiveness', () => {
  test('should handle mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    const rightPanel = page.locator('[data-testid="right-panel"]');
    
    // Panel should still be visible on mobile
    await expect(rightPanel).toBeVisible();
    
    // But might be collapsed by default or have different width
    // This would depend on responsive implementation
  });
  
  test('should handle tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000');
    
    const rightPanel = page.locator('[data-testid="right-panel"]');
    await expect(rightPanel).toBeVisible();
    
    // Panel should have appropriate width for tablet
    const panelWidth = await rightPanel.evaluate(el => getComputedStyle(el).width);
    expect(parseInt(panelWidth)).toBeGreaterThan(300);
  });
});

test.describe('Panel Performance', () => {
  test('should load templates quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000');
    
    // Wait for templates to be visible
    await page.waitForSelector('[data-testid="templates-grid"]');
    
    const loadTime = Date.now() - startTime;
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle rapid panel switching', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Rapidly switch between panels
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        // @ts-ignore
        window.usePanelStore.getState().setActivePanel('photos');
      });
      
      await page.evaluate(() => {
        // @ts-ignore
        window.usePanelStore.getState().setActivePanel('templates');
      });
    }
    
    // Should still be responsive
    const panelTitle = page.locator('.panel-title');
    await expect(panelTitle).toHaveText('Templates');
  });
});

test.describe('Panel Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check panel has proper role
    const rightPanel = page.locator('[data-testid="right-panel"]');
    await expect(rightPanel).toHaveAttribute('role', 'complementary');
    
    // Check buttons have proper labels
    const collapseButton = page.locator('[title="Collapse Panel"]');
    await expect(collapseButton).toHaveAttribute('aria-label', 'Collapse Panel');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Focus first template
    const firstTemplate = page.locator('[data-testid="template-tmpl_1"]').first();
    await firstTemplate.focus();
    
    // Press Enter to select template
    await page.keyboard.press('Enter');
    
    // Should add template to canvas
    await page.waitForTimeout(1000);
    const canvasElement = page.locator('[data-testid="canvas-element"]');
    await expect(canvasElement).toBeVisible();
  });
});