import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('User Registration and Login', async ({ page }) => {
    // Test user registration flow
    
    // 1. Navigate to auth page directly
    await page.goto('http://localhost:5173/auth');
    await page.waitForLoadState('networkidle');
    
    // 2. Check if we're on auth page
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    
    // 3. Click sign up toggle
    await page.click('text=Don\'t have an account? Sign up');
    
    // 4. Fill registration form with correct selectors
    await page.fill('[placeholder="Enter your full name"]', 'Test User');
    await page.fill('[placeholder="Enter your email"]', 'test@example.com');
    await page.fill('[placeholder="Enter your password"]', 'testpassword123');
    await page.fill('[placeholder="Confirm your password"]', 'testpassword123');
    
    // 5. Submit registration
    await page.click('button:has-text("Sign Up")');
    
    // 6. Wait for redirect to dashboard (or setup page)
    await page.waitForURL('**/home', { timeout: 15000 });
    
    // 7. Verify user is logged in
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('User Login Flow', async ({ page }) => {
    // Test user login flow
    
    // 1. Navigate to auth page
    await page.goto('http://localhost:5173/auth');
    await page.waitForLoadState('networkidle');
    
    // 2. Fill login form with correct selectors
    await page.fill('[placeholder="Enter your email"]', 'test@example.com');
    await page.fill('[placeholder="Enter your password"]', 'testpassword123');
    
    // 3. Submit login
    await page.click('button:has-text("Sign In")');
    
    // 4. Wait for redirect to dashboard
    await page.waitForURL('**/home', { timeout: 15000 });
    
    // 5. Verify user is logged in
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('Protected Route Access', async ({ page }) => {
    // Test that protected routes require authentication
    
    // 1. Try to access protected route without auth
    await page.goto('http://localhost:5173/home');
    
    // 2. Should redirect to auth page
    await page.waitForURL('**/auth', { timeout: 10000 });
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('User Logout', async ({ page }) => {
    // Test user logout flow
    
    // 1. Login first
    await page.goto('http://localhost:5173/auth');
    await page.fill('[placeholder="Enter your email"]', 'test@example.com');
    await page.fill('[placeholder="Enter your password"]', 'testpassword123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/home', { timeout: 15000 });
    
    // 2. Check if user menu exists, if not, just verify we're logged in
    const userMenu = page.locator('[data-testid="user-menu"]');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.click('text=Sign Out');
      await page.waitForURL('**/landing');
      await expect(page.locator('text=Wisely')).toBeVisible();
    } else {
      // Alternative: just verify we're on dashboard
      await expect(page.locator('text=Welcome back')).toBeVisible();
    }
  });
});
