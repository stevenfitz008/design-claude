import { test, expect } from '@playwright/test';

test.describe('Design Studio - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should load the application successfully', async ({ page }) => {
    // Check if the main components are present
    await expect(page).toHaveTitle(/Design Studio/i);
    
    // Wait for the main layout to be visible
    await expect(page.locator('[data-testid="app-layout"]')).toBeVisible({ timeout: 10000 });
    
    // Check for the three-panel layout
    await expect(page.locator('[data-testid="left-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-panel"]')).toBeVisible();
    
    // Check top navigation
    await expect(page.locator('[data-testid="top-navigation"]')).toBeVisible();
  });

  test('should have working toolbar navigation', async ({ page }) => {
    // Test toolbar tool switching
    const toolbar = page.locator('[data-testid="left-toolbar"]');
    
    // Click on different tools and verify active state
    await toolbar.locator('[data-testid="tool-templates"]').click();
    await expect(toolbar.locator('[data-testid="tool-templates"]')).toHaveClass(/active/);
    
    await toolbar.locator('[data-testid="tool-elements"]').click();
    await expect(toolbar.locator('[data-testid="tool-elements"]')).toHaveClass(/active/);
    
    await toolbar.locator('[data-testid="tool-photos"]').click();
    await expect(toolbar.locator('[data-testid="tool-photos"]')).toHaveClass(/active/);
  });

  test('should display project name and allow basic interactions', async ({ page }) => {
    const topNav = page.locator('[data-testid="top-navigation"]');
    
    // Check if project name is displayed
    await expect(topNav.locator('[data-testid="project-name"]')).toBeVisible();
    await expect(topNav.locator('[data-testid="project-name"]')).toContainText('Untitled Design');
    
    // Check if action buttons are present
    await expect(topNav.locator('[data-testid="save-button"]')).toBeVisible();
    await expect(topNav.locator('[data-testid="export-button"]')).toBeVisible();
    await expect(topNav.locator('[data-testid="share-button"]')).toBeVisible();
  });

  test('should handle toolbar interactions', async ({ page }) => {
    const leftToolbar = page.locator('[data-testid="left-toolbar"]');
    
    // Test clicking different tools
    const tools = ['templates', 'elements', 'photos', 'fonts', 'uploads'];
    
    for (const tool of tools) {
      await leftToolbar.locator(`[data-testid="tool-${tool}"]`).click();
      
      // Verify the right panel content changes based on the selected tool
      const rightPanel = page.locator('[data-testid="right-panel"]');
      await expect(rightPanel).toBeVisible();
      
      // Add a small delay to allow UI updates
      await page.waitForTimeout(500);
    }
  });

  test('should render canvas area', async ({ page }) => {
    const canvas = page.locator('[data-testid="main-canvas"]');
    
    await expect(canvas).toBeVisible();
    
    // Check if canvas has appropriate dimensions
    const canvasBounds = await canvas.boundingBox();
    expect(canvasBounds?.width).toBeGreaterThan(400);
    expect(canvasBounds?.height).toBeGreaterThan(300);
  });
});

test.describe('Design Studio - API Integration Tests', () => {
  test('should handle API responses for photos', async ({ page, request }) => {
    // First verify the API is responding
    const apiResponse = await request.get('http://localhost:3001/api/v1/photos/search?query=nature');
    expect(apiResponse.ok()).toBeTruthy();
    
    const data = await apiResponse.json();
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBeTruthy();
  });

  test('should handle API responses for fonts', async ({ page, request }) => {
    const apiResponse = await request.get('http://localhost:3001/api/v1/fonts');
    expect(apiResponse.ok()).toBeTruthy();
    
    const data = await apiResponse.json();
    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBeTruthy();
  });

  test('should handle API responses for templates', async ({ page, request }) => {
    const apiResponse = await request.get('http://localhost:3001/api/v1/templates');
    expect(apiResponse.ok()).toBeTruthy();
    
    const data = await apiResponse.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should handle API responses for projects', async ({ page, request }) => {
    const apiResponse = await request.get('http://localhost:3001/api/v1/projects');
    expect(apiResponse.ok()).toBeTruthy();
    
    const data = await apiResponse.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBeTruthy();
  });
});

test.describe('Design Studio - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Navigate to application
    await page.goto('/');
    
    // Block network requests to simulate network issues
    await page.route('**/api/**', route => route.abort());
    
    // Try to interact with features that require API calls
    await page.locator('[data-testid="tool-photos"]').click();
    
    // The application should not crash and should show appropriate error handling
    // (This will depend on how error states are implemented in the actual components)
    await expect(page.locator('[data-testid="app-layout"]')).toBeVisible();
  });
});

test.describe('Design Studio - Responsive Design', () => {
  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('[data-testid="app-layout"]')).toBeVisible();
    await expect(page.locator('[data-testid="left-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-canvas"]')).toBeVisible();
  });

  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('[data-testid="app-layout"]')).toBeVisible();
    
    // On mobile, some panels might be hidden or collapsed
    // This will depend on the responsive implementation
  });
});