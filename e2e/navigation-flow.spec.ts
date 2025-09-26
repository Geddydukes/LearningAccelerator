import { test, expect } from '@playwright/test';

test.describe('Navigation and UI Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page for each test
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
  });

  test('Main Navigation Works', async ({ page }) => {
    // Test main navigation on landing page
    
    // 1. Check navigation elements are visible
    await expect(page.locator('text=How it works')).toBeVisible();
    await expect(page.locator('text=Pricing')).toBeVisible();
    await expect(page.locator('text=Start your plan')).toBeVisible();
    
    // 2. Test navigation links
    await page.click('text=How it works');
    await expect(page.locator('text=Six principles that work')).toBeVisible();
    
    await page.click('text=Pricing');
    await expect(page.locator('text=Choose your path')).toBeVisible();
  });

  test('Mobile Navigation', async ({ page }) => {
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile navigation elements are visible
    await expect(page.locator('text=Start your plan')).toBeVisible();
    
    // Test mobile-specific interactions
    await page.click('text=Start your plan');
    await expect(page).toHaveURL('/auth');
  });

  test('Sidebar Collapse/Expand', async ({ page }) => {
    // Test sidebar functionality (if exists)
    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
      // Check if sidebar collapsed
      const sidebar = page.locator('[data-testid="sidebar"]');
      await expect(sidebar).toHaveClass(/collapsed/);
      
      await sidebarToggle.click();
      // Check if sidebar expanded
      await expect(sidebar).not.toHaveClass(/collapsed/);
    } else {
      // If no sidebar, just verify page loaded
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('Theme Toggle', async ({ page }) => {
    // Test theme toggle functionality (if exists)
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // Check if theme changed
      const htmlElement = page.locator('html');
      const hasDarkClass = await htmlElement.getAttribute('class');
      expect(hasDarkClass).toContain('dark');
    } else {
      // If no theme toggle, just verify page loaded
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('Error Boundary Handling', async ({ page }) => {
    // Test error boundary (if implemented)
    // Navigate to a potentially problematic route
    await page.goto('http://localhost:5173/nonexistent-route');
    
    // Check if error boundary is shown or if redirected
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/auth|\/landing|\/404/);
  });

  test('Loading States', async ({ page }) => {
    // Test loading states
    await page.goto('http://localhost:5173/');
    
    // Check that page loads without infinite loading
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Accessibility Features', async ({ page }) => {
    // Test accessibility features
    
    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});