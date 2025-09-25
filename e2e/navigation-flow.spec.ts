import { test, expect } from '@playwright/test';

test.describe('Navigation and UI Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/home');
  });

  test('Main Navigation Works', async ({ page }) => {
    // Test main navigation between different sections
    
    // 1. Dashboard
    await page.click('text=Dashboard');
    await page.waitForURL('**/home');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // 2. Learning Workspace
    await page.click('text=Learning Workspace');
    await page.waitForURL('**/workspace');
    await expect(page.locator('text=Education Agent')).toBeVisible();
    
    // 3. Past Learning Tracks
    await page.click('text=Past Learning Tracks');
    await page.waitForURL('**/past-tracks');
    await expect(page.locator('text=Past Learning Tracks')).toBeVisible();
    
    // 4. Settings
    await page.click('text=Settings');
    await page.waitForURL('**/settings');
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('Mobile Navigation', async ({ page }) => {
    // Test mobile navigation menu
    
    // 1. Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 2. Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    
    // 3. Check menu is visible
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // 4. Navigate to workspace
    await page.click('text=Learning Workspace');
    await page.waitForURL('**/workspace');
    
    // 5. Menu should close
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
  });

  test('Sidebar Collapse/Expand', async ({ page }) => {
    // Test sidebar collapse functionality on desktop
    
    // 1. Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // 2. Check sidebar is visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // 3. Collapse sidebar
    await page.click('[data-testid="sidebar-collapse"]');
    
    // 4. Check sidebar is collapsed
    await expect(page.locator('[data-testid="sidebar-collapsed"]')).toBeVisible();
    
    // 5. Expand sidebar
    await page.click('[data-testid="sidebar-expand"]');
    
    // 6. Check sidebar is expanded
    await expect(page.locator('[data-testid="sidebar-expanded"]')).toBeVisible();
  });

  test('Theme Toggle', async ({ page }) => {
    // Test theme toggle functionality
    
    // 1. Check initial theme
    const body = page.locator('body');
    const initialTheme = await body.getAttribute('data-theme');
    
    // 2. Toggle theme
    await page.click('[data-testid="theme-toggle"]');
    
    // 3. Check theme changed
    const newTheme = await body.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
    
    // 4. Toggle back
    await page.click('[data-testid="theme-toggle"]');
    
    // 5. Check theme reverted
    const revertedTheme = await body.getAttribute('data-theme');
    expect(revertedTheme).toBe(initialTheme);
  });

  test('Error Boundary Handling', async ({ page }) => {
    // Test error boundary functionality
    
    // 1. Navigate to a page that might have errors
    await page.goto('/home/workspace');
    
    // 2. Trigger an error (if there's a way to do so)
    // This would depend on your error boundary implementation
    
    // 3. Check error boundary is shown
    // await expect(page.locator('text=Something went wrong')).toBeVisible();
    
    // 4. Check retry button works
    // await page.click('button:has-text("Try Again")');
  });

  test('Loading States', async ({ page }) => {
    // Test loading states throughout the app
    
    // 1. Navigate to workspace
    await page.click('text=Learning Workspace');
    
    // 2. Start a learning session
    await page.click('button:has-text("Start Learning Session")');
    
    // 3. Check loading state is shown
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // 4. Wait for loading to complete
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
    
    // 5. Check content is loaded
    await expect(page.locator('text=Lecture Phase')).toBeVisible();
  });

  test('Accessibility Features', async ({ page }) => {
    // Test accessibility features
    
    // 1. Check keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // 2. Check focus indicators
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // 3. Check ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      // At least some buttons should have aria labels
      if (i === 0) {
        expect(ariaLabel).toBeTruthy();
      }
    }
  });
});
