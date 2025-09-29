import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('User Registration and Login', async ({ page }) => {
    // Test user registration flow
    
    // 1. Navigate to landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 2. Click sign up
    await page.click('text=Sign Up');
    await page.waitForURL('**/auth');
    
    // 3. Fill registration form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.fill('input[name="fullName"]', 'Test User');
    
    // 4. Submit registration
    await page.click('button:has-text("Sign Up")');
    
    // 5. Wait for redirect to dashboard
    await page.waitForURL('**/home');
    
    // 6. Verify user is logged in
    await expect(page.locator('text=Test User')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('User Login Flow', async ({ page }) => {
    // Test user login flow
    
    // 1. Navigate to auth page
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // 2. Switch to login tab
    await page.click('text=Sign In');
    
    // 3. Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    // 4. Submit login
    await page.click('button:has-text("Sign In")');
    
    // 5. Wait for redirect to dashboard
    await page.waitForURL('**/home');
    
    // 6. Verify user is logged in
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('Protected Route Access', async ({ page }) => {
    // Test that protected routes require authentication
    
    // 1. Try to access protected route without auth
    await page.goto('/home/workspace');
    
    // 2. Should redirect to auth page
    await page.waitForURL('**/auth');
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('User Logout', async ({ page }) => {
    // Test user logout flow
    
    // 1. Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/home');
    
    // 2. Click user menu
    await page.click('[data-testid="user-menu"]');
    
    // 3. Click sign out
    await page.click('text=Sign Out');
    
    // 4. Should redirect to landing page
    await page.waitForURL('**/landing');
    await expect(page.locator('text=Wisely')).toBeVisible();
  });
});
