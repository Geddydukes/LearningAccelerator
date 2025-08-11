import { test, expect } from '@playwright/test'

test.describe('Gamification System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard')
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
  })

  test('should display streak flame and XP badge', async ({ page }) => {
    // Mock gamification data
    await page.addInitScript(() => {
      // Mock Supabase client for streaks
      window.mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'test-user', xp: 150 },
                error: null
              })
            })
          })
        }),
        rpc: () => Promise.resolve({ error: null })
      }
    })

    // Check that gamification components are visible
    await expect(page.locator('[data-testid="streak-flame"]')).toBeVisible()
    await expect(page.locator('[data-testid="xp-badge"]')).toBeVisible()
  })

  test('should show streak count and level information', async ({ page }) => {
    // Mock streak data
    await page.addInitScript(() => {
      window.mockStreakData = [
        { user_id: 'test-user', agent: 'CLO', current_streak_days: 5 },
        { user_id: 'test-user', agent: 'Socratic', current_streak_days: 3 }
      ]
    })

    // Verify streak information is displayed
    await expect(page.locator('text=5 days')).toBeVisible()
    await expect(page.locator('text=streak')).toBeVisible()
    
    // Verify level information
    await expect(page.locator('text=Level 2')).toBeVisible()
    await expect(page.locator('text=150 XP')).toBeVisible()
  })

  test('should complete TA mini-module and award XP', async ({ page }) => {
    // Mock TA completion
    await page.route('/api/functions/v1/agent-proxy', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            type: 'TA_COMPLETION',
            message: 'Mini-module completed successfully'
          }
        })
      })
    })

    // Mock streak logging
    await page.route('/api/functions/v1/log-streak', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Streak logged successfully'
        })
      })
    })

    // Complete a TA mini-module
    await page.click('button:has-text("Start")')
    
    // Wait for completion
    await page.waitForSelector('text=completed successfully', { timeout: 10000 })
    
    // Verify XP was awarded
    await expect(page.locator('text=160 XP')).toBeVisible() // 150 + 10
  })

  test('should show confetti animation on level up', async ({ page }) => {
    // Mock level up scenario
    await page.addInitScript(() => {
      window.mockLevelUp = true
      window.mockXP = 200 // This should trigger level 3
    })

    // Trigger a level up by completing an activity
    await page.click('button:has-text("Start")')
    
    // Wait for confetti animation
    await expect(page.locator('[data-testid="confetti"]')).toBeVisible()
    
    // Verify level up indicator
    await expect(page.locator('text=+1')).toBeVisible()
    
    // Verify new level is displayed
    await expect(page.locator('text=Level 3')).toBeVisible()
  })

  test('should display flame intensity based on streak length', async ({ page }) => {
    // Test low intensity (1-2 days)
    await page.addInitScript(() => {
      window.mockStreakData = [
        { user_id: 'test-user', agent: 'CLO', current_streak_days: 1 }
      ]
    })

    await page.reload()
    
    // Should show yellow flame for low intensity
    await expect(page.locator('.text-yellow-500')).toBeVisible()

    // Test medium intensity (3-6 days)
    await page.addInitScript(() => {
      window.mockStreakData = [
        { user_id: 'test-user', agent: 'CLO', current_streak_days: 5 }
      ]
    })

    await page.reload()
    
    // Should show orange flame for medium intensity
    await expect(page.locator('.text-orange-500')).toBeVisible()

    // Test high intensity (7+ days)
    await page.addInitScript(() => {
      window.mockStreakData = [
        { user_id: 'test-user', agent: 'CLO', current_streak_days: 10 }
      ]
    })

    await page.reload()
    
    // Should show red flame for high intensity
    await expect(page.locator('.text-red-500')).toBeVisible()
    
    // Should show sparkle effect for high intensity
    await expect(page.locator('[data-testid="sparkle"]')).toBeVisible()
  })

  test('should show agent breakdown in streak display', async ({ page }) => {
    // Mock multiple agent streaks
    await page.addInitScript(() => {
      window.mockStreakData = [
        { user_id: 'test-user', agent: 'CLO', current_streak_days: 5 },
        { user_id: 'test-user', agent: 'Socratic', current_streak_days: 3 },
        { user_id: 'test-user', agent: 'TA', current_streak_days: 2 }
      ]
    })

    await page.reload()
    
    // Verify agent breakdown is displayed
    await expect(page.locator('text=CLO')).toBeVisible()
    await expect(page.locator('text=Socratic')).toBeVisible()
    await expect(page.locator('text=TA')).toBeVisible()
    
    // Verify individual streak counts
    await expect(page.locator('text=5')).toBeVisible()
    await expect(page.locator('text=3')).toBeVisible()
    await expect(page.locator('text=2')).toBeVisible()
  })

  test('should handle streak logging errors gracefully', async ({ page }) => {
    // Mock streak logging error
    await page.route('/api/functions/v1/log-streak', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Database connection failed'
        })
      })
    })

    // Try to complete an activity
    await page.click('button:has-text("Start")')
    
    // Should not crash and should show error handling
    await expect(page.locator('text=Error logging streak')).toBeVisible()
  })

  test('should auto-refresh gamification data every 10 seconds', async ({ page }) => {
    // Mock initial data
    await page.addInitScript(() => {
      window.mockXP = 150
      window.mockStreakData = [
        { user_id: 'test-user', agent: 'CLO', current_streak_days: 1 }
      ]
    })

    await page.reload()
    
    // Verify initial data
    await expect(page.locator('text=150 XP')).toBeVisible()
    
    // Mock updated data
    await page.addInitScript(() => {
      window.mockXP = 160
      window.mockStreakData = [
        { user_id: 'test-user', agent: 'CLO', current_streak_days: 2 }
      ]
    })

    // Wait for auto-refresh (10 seconds)
    await page.waitForTimeout(11000)
    
    // Verify updated data is displayed
    await expect(page.locator('text=160 XP')).toBeVisible()
    await expect(page.locator('text=2 days')).toBeVisible()
  })

  test('should display progress bar in XP badge', async ({ page }) => {
    // Mock XP data with progress
    await page.addInitScript(() => {
      window.mockXP = 75 // 75% progress in level 1
    })

    await page.reload()
    
    // Verify progress bar is visible
    await expect(page.locator('[data-testid="xp-progress-bar"]')).toBeVisible()
    
    // Verify progress percentage
    await expect(page.locator('text=75/100 XP')).toBeVisible()
    await expect(page.locator('text=25 to next level')).toBeVisible()
  })

  test('should show different level icons based on level', async ({ page }) => {
    // Test level 1-4 (Zap icon)
    await page.addInitScript(() => {
      window.mockXP = 50
    })

    await page.reload()
    await expect(page.locator('[data-testid="zap-icon"]')).toBeVisible()

    // Test level 5-9 (Star icon)
    await page.addInitScript(() => {
      window.mockXP = 500
    })

    await page.reload()
    await expect(page.locator('[data-testid="star-icon"]')).toBeVisible()

    // Test level 10+ (Trophy icon)
    await page.addInitScript(() => {
      window.mockXP = 2000
    })

    await page.reload()
    await expect(page.locator('[data-testid="trophy-icon"]')).toBeVisible()
  })

  test('should handle empty streak data', async ({ page }) => {
    // Mock no streak data
    await page.addInitScript(() => {
      window.mockStreakData = []
    })

    await page.reload()
    
    // Should show "No streak" message
    await expect(page.locator('text=No streak')).toBeVisible()
    await expect(page.locator('.text-gray-400')).toBeVisible()
  })

  test('should display gamification components in dashboard layout', async ({ page }) => {
    // Verify gamification section is in the correct position
    const gamificationSection = page.locator('[data-testid="gamification-section"]')
    await expect(gamificationSection).toBeVisible()
    
    // Verify it appears before certificate section
    const certificateSection = page.locator('[data-testid="certificate-section"]')
    await expect(certificateSection).toBeVisible()
    
    // Check that gamification is above certificate
    const gamificationRect = await gamificationSection.boundingBox()
    const certificateRect = await certificateSection.boundingBox()
    
    expect(gamificationRect?.y).toBeLessThan(certificateRect?.y || 0)
  })
}) 