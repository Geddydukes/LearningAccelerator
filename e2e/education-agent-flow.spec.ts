import { test, expect } from '@playwright/test';

test.describe('Education Agent Core Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('Complete Learning Session Flow', async ({ page }) => {
    // Test the complete Education Agent learning flow
    
    // 1. Navigate to workspace
    await page.click('text=Learning Workspace');
    await page.waitForURL('**/workspace');
    
    // 2. Check that Education Agent UI loads
    await expect(page.locator('text=Education Agent')).toBeVisible();
    await expect(page.locator('text=Guru')).toBeVisible();
    
    // 3. Start a learning session
    await page.click('button:has-text("Start Learning Session")');
    
    // 4. Wait for lecture phase
    await expect(page.locator('text=Lecture Phase')).toBeVisible();
    await expect(page.locator('text=Instructor')).toBeVisible();
    
    // 5. Complete lecture
    await page.click('button:has-text("Lecture Complete")');
    
    // 6. Wait for comprehension check
    await expect(page.locator('text=Comprehension Check')).toBeVisible();
    await expect(page.locator('text=Question')).toBeVisible();
    
    // 7. Answer comprehension questions
    const questions = page.locator('[data-testid="comprehension-question"]');
    const questionCount = await questions.count();
    
    for (let i = 0; i < questionCount; i++) {
      const question = questions.nth(i);
      const textarea = question.locator('textarea');
      await textarea.fill('This is a test answer for the comprehension check.');
    }
    
    // 8. Submit comprehension check
    await page.click('button:has-text("Submit Answers")');
    
    // 9. Wait for practice selection
    await expect(page.locator('text=Practice Selection')).toBeVisible();
    await expect(page.locator('text=Choose Practice Mode')).toBeVisible();
    
    // 10. Select TA practice
    await page.click('button:has-text("TA Practice")');
    
    // 11. Wait for practice phase
    await expect(page.locator('text=Practice Phase')).toBeVisible();
    await expect(page.locator('text=TA Agent')).toBeVisible();
    
    // 12. Complete practice
    await page.click('button:has-text("Practice Complete")');
    
    // 13. Wait for reflection phase
    await expect(page.locator('text=Daily Reflection')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="reflection"]')).toBeVisible();
    
    // 14. Complete reflection
    const reflectionTextarea = page.locator('textarea[placeholder*="reflection"]');
    await reflectionTextarea.fill('This was a great learning session. I learned a lot about data science fundamentals.');
    
    await page.click('button:has-text("Complete Reflection")');
    
    // 15. Verify session completion
    await expect(page.locator('text=Session Complete')).toBeVisible();
    await expect(page.locator('text=Well done')).toBeVisible();
  });

  test('Coding Workspace Integration', async ({ page }) => {
    // Test the coding workspace integration
    
    // 1. Navigate to workspace
    await page.click('text=Learning Workspace');
    await page.waitForURL('**/workspace');
    
    // 2. Start a coding-focused session
    await page.click('button:has-text("Start Learning Session")');
    
    // 3. Select coding practice
    await page.click('button:has-text("TA Practice")');
    
    // 4. Wait for coding workspace
    await expect(page.locator('text=Coding Workspace')).toBeVisible();
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // 5. Check file tree
    await expect(page.locator('[data-testid="file-tree"]')).toBeVisible();
    
    // 6. Write some code
    const editor = page.locator('.monaco-editor');
    await editor.click();
    await page.keyboard.type(`
# Hello Data Science
print("Welcome to data science!")
import pandas as pd
df = pd.DataFrame({'name': ['Alice', 'Bob'], 'age': [25, 30]})
print(df)
    `);
    
    // 7. Run tests
    await page.click('button:has-text("Run Tests")');
    
    // 8. Wait for test results
    await expect(page.locator('text=Test Results')).toBeVisible();
    
    // 9. Submit for Alex review
    await page.click('button:has-text("Submit for Review")');
    
    // 10. Wait for Alex feedback
    await expect(page.locator('text=Alex Review')).toBeVisible();
    await expect(page.locator('text=Score')).toBeVisible();
  });

  test('Session Timeline Visualization', async ({ page }) => {
    // Test the session timeline visualization
    
    // 1. Navigate to workspace
    await page.click('text=Learning Workspace');
    await page.waitForURL('**/workspace');
    
    // 2. Start a session to generate events
    await page.click('button:has-text("Start Learning Session")');
    await page.click('button:has-text("Lecture Complete")');
    await page.click('button:has-text("Submit Answers")');
    await page.click('button:has-text("TA Practice")');
    await page.click('button:has-text("Practice Complete")');
    
    // 3. Complete reflection
    const reflectionTextarea = page.locator('textarea[placeholder*="reflection"]');
    await reflectionTextarea.fill('Test reflection for timeline');
    await page.click('button:has-text("Complete Reflection")');
    
    // 4. Get correlation ID from the session
    const correlationId = await page.locator('[data-testid="correlation-id"]').textContent();
    expect(correlationId).toBeTruthy();
    
    // 5. Navigate to timeline
    await page.goto(`/dev/timeline/${correlationId}`);
    
    // 6. Check timeline loads
    await expect(page.locator('text=Session Timeline')).toBeVisible();
    await expect(page.locator('text=Correlation ID')).toBeVisible();
    
    // 7. Check summary stats
    await expect(page.locator('text=Total Events')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Total Tokens')).toBeVisible();
    await expect(page.locator('text=Total Cost')).toBeVisible();
    
    // 8. Check timeline visualization
    await expect(page.locator('text=Timeline Visualization')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-event"]')).toHaveCount.greaterThan(0);
    
    // 9. Check individual events
    const events = page.locator('[data-testid="timeline-event"]');
    const eventCount = await events.count();
    expect(eventCount).toBeGreaterThan(0);
    
    // 10. Verify event details
    const firstEvent = events.first();
    await expect(firstEvent.locator('text=CLO')).toBeVisible();
    await expect(firstEvent.locator('text=Instructor')).toBeVisible();
    await expect(firstEvent.locator('text=TA')).toBeVisible();
  });
});
