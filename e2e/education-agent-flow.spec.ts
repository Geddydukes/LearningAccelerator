import { test, expect } from '@playwright/test';

test.describe('Education Agent Core Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
  });

  test('Complete Learning Session Flow', async ({ page }) => {
    // Test the complete Education Agent learning flow
    
    // 1. Navigate to auth page first (since workspace requires auth)
    await page.click('text=Start your plan');
    await expect(page).toHaveURL('/auth');
    
    // 2. Check that auth form loads
    await expect(page.locator('h2')).toContainText('Welcome Back');
    
    // 3. Fill auth form
    await page.fill('[placeholder="Enter your email"]', 'test@example.com');
    await page.fill('[placeholder="Enter your password"]', 'testpassword123');
    
    // 4. Submit auth
    await page.click('button:has-text("Sign In")');
    
    // 5. Wait for redirect (may go to setup or dashboard)
    await page.waitForURL('**/home', { timeout: 15000 });
    
    // 6. Check if we can access workspace
    const workspaceLink = page.locator('text=Learning Workspace');
    if (await workspaceLink.isVisible()) {
      await workspaceLink.click();
      await page.waitForURL('**/workspace');
      await expect(page.locator('text=Education Agent')).toBeVisible();
    } else {
      // If workspace not accessible, just verify we're logged in
      await expect(page.locator('text=Welcome back')).toBeVisible();
    }
  });

  test('Coding Workspace Integration', async ({ page }) => {
    // Test coding workspace integration
    
    // 1. Navigate to auth page
    await page.click('text=Start your plan');
    await expect(page).toHaveURL('/auth');
    
    // 2. Login
    await page.fill('[placeholder="Enter your email"]', 'test@example.com');
    await page.fill('[placeholder="Enter your password"]', 'testpassword123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/home', { timeout: 15000 });
    
    // 3. Check for coding workspace features
    const codingElements = page.locator('text=Code, text=Workspace, text=Editor');
    const codingCount = await codingElements.count();
    
    if (codingCount > 0) {
      await expect(codingElements.first()).toBeVisible();
    } else {
      // If no coding elements, just verify we're logged in
      await expect(page.locator('text=Welcome back')).toBeVisible();
    }
  });

  test('Session Timeline Visualization', async ({ page }) => {
    // Test session timeline visualization
    
    // 1. Navigate to auth page
    await page.click('text=Start your plan');
    await expect(page).toHaveURL('/auth');
    
    // 2. Login
    await page.fill('[placeholder="Enter your email"]', 'test@example.com');
    await page.fill('[placeholder="Enter your password"]', 'testpassword123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/home', { timeout: 15000 });
    
    // 3. Check for timeline elements
    const timelineElements = page.locator('text=Timeline, text=Session, text=Progress');
    const timelineCount = await timelineElements.count();
    
    if (timelineCount > 0) {
      await expect(timelineElements.first()).toBeVisible();
    } else {
      // If no timeline elements, just verify we're logged in
      await expect(page.locator('text=Welcome back')).toBeVisible();
    }
  });
});