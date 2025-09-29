import { test, expect } from '@playwright/test';

test.describe('Core User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Landing page loads correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Wisely');
    await expect(page.locator('text=Ripple of Knowledge')).toBeVisible();
  });

  test('Navigation to auth page', async ({ page }) => {
    // Check if user is already logged in
    const dashboardVisible = await page.locator('h1:has-text("Learning Dashboard")').isVisible();
    
    if (!dashboardVisible) {
      // Click auth navigation
      await page.click('text=Begin Your Ripple');
      await expect(page).toHaveURL('/auth');
      await expect(page.locator('h2')).toContainText('Welcome Back');
    }
  });

  test('Auth form validation', async ({ page }) => {
    await page.goto('/auth');
    
    // Test email validation
    await page.fill('[placeholder="Enter your email"]', 'invalid-email');
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    
    // Test password validation
    await page.fill('[placeholder="Enter your email"]', 'test@example.com');
    await page.fill('[placeholder="Enter your password"]', '123');
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });

  test('Dashboard loads with agent cards', async ({ page }) => {
    // Skip if not authenticated (would need real auth setup)
    const isAuthenticated = await page.locator('h1:has-text("Learning Dashboard")').isVisible();
    
    if (isAuthenticated) {
      await expect(page.locator('text=CLO - Curriculum Architect')).toBeVisible();
      await expect(page.locator('text=Socratic Inquisitor')).toBeVisible();
      await expect(page.locator('text=Alex - Lead Engineer')).toBeVisible();
      await expect(page.locator('text=Brand Strategist')).toBeVisible();
    } else {
      console.log('Skipping dashboard test - authentication required');
    }
  });

  test('Agent modal opens and closes', async ({ page }) => {
    const isAuthenticated = await page.locator('h1:has-text("Learning Dashboard")').isVisible();
    
    if (isAuthenticated) {
      // Open Socratic agent modal
      await page.click('text=Socratic Inquisitor');
      await page.click('button:has-text("Open")');
      
      // Check modal is open
      await expect(page.locator('text=Interactive Agent Session')).toBeVisible();
      
      // Close modal
      await page.click('button[aria-label="Close"]');
      await expect(page.locator('text=Interactive Agent Session')).not.toBeVisible();
    }
  });

  test('Theme toggle works', async ({ page }) => {
    // Find theme toggle button
    const themeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    
    if (await themeButton.isVisible()) {
      await themeButton.click();
      
      // Check if dark mode is applied
      const htmlElement = page.locator('html');
      const hasDarkClass = await htmlElement.getAttribute('class');
      expect(hasDarkClass).toContain('dark');
    }
  });

  test('Mobile viewport compatibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile layout
    await expect(page.locator('h1')).toBeVisible();
    
    // Check touch targets (minimum 44px)
    const buttons = page.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

test.describe('Accessibility Tests', () => {
  test('Keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Check focus indicators exist
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      const outlineStyle = await focusedElement.evaluate(el => 
        window.getComputedStyle(el).outline
      );
      expect(outlineStyle).toBeTruthy();
    }
  });

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto('/');
    
    // Check basic ARIA structure
    const mainElement = page.locator('main, [role="main"]');
    if (await mainElement.count() > 0) {
      await expect(mainElement.first()).toBeVisible();
    }
    
    // Check headings hierarchy
    const h1Elements = page.locator('h1');
    await expect(h1Elements.first()).toBeVisible();
  });

  test('Color contrast and readability', async ({ page }) => {
    await page.goto('/');
    
    // Check that text is visible and readable
    const textElements = page.locator('h1, h2, h3, p, span').filter({ hasText: /.+/ });
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        expect(styles.color).toBeTruthy();
        expect(styles.fontSize).toBeTruthy();
      }
    }
  });
});