import { test, expect } from '@playwright/test';

test.describe('Text Panel Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Click on the Text tool in the left toolbar to open the panel
    // Using a case-insensitive regex to find the button is more robust.
    await page.getByRole('button', { name: /text/i }).click();
    // Wait for a known element in the panel to be visible before proceeding.
    await expect(page.getByText('Create header')).toBeVisible();
  });

  test('should switch between "Text" and "My fonts" tabs correctly', async ({ page }) => {
    const textTab = page.getByRole('tab', { name: 'Text' });
    const myFontsTab = page.getByRole('tab', { name: 'My fonts' });

    // 1. Verify "Text" tab is active by default
    await expect(textTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Create header')).toBeVisible();

    // 2. Click on "My fonts" tab
    await myFontsTab.click();

    // 3. Verify "My fonts" tab is now active and its content is visible
    await expect(myFontsTab).toHaveAttribute('aria-selected', 'true');
    await expect(textTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByText('Your Custom Fonts')).toBeVisible();
    await expect(page.getByText('Create header')).not.toBeVisible();

    // 4. Click back to "Text" tab
    await textTab.click();

    // 5. Verify "Text" tab is active again and its content has returned
    await expect(textTab).toHaveAttribute('aria-selected', 'true');
    await expect(myFontsTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByText('Create header')).toBeVisible();
    await expect(page.getByText('Your Custom Fonts')).not.toBeVisible();
  });
});
