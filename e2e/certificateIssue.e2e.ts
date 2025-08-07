import { test, expect } from '@playwright/test'

test.describe('Certificate System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard')
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
  })

  test('should display certificate card for employable user', async ({ page }) => {
    // Mock the certificate data for an employable user
    await page.addInitScript(() => {
      // Mock Supabase client
      window.mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  cert_id: 'test-cert-123',
                  track: 'Software Engineering',
                  issued_at: '2024-01-15T10:30:00Z',
                  url: 'https://example.com/certificate.pdf'
                },
                error: null
              })
            })
          })
        })
      }
    })

    // Check that certificate card is visible
    await expect(page.locator('[data-testid="certificate-card"]')).toBeVisible()
    
    // Verify certificate details are displayed
    await expect(page.locator('text=Employment-Ready Certificate')).toBeVisible()
    await expect(page.locator('text=Software Engineering')).toBeVisible()
    await expect(page.locator('text=Verified')).toBeVisible()
    
    // Check action buttons are present
    await expect(page.locator('button:has-text("Download")')).toBeVisible()
    await expect(page.locator('button:has-text("Share")')).toBeVisible()
  })

  test('should show generate certificate option for non-employable user', async ({ page }) => {
    // Mock no certificate exists
    await page.addInitScript(() => {
      window.mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
      }
    })

    // Check that generate certificate option is shown
    await expect(page.locator('text=Ready to Earn Your Certificate?')).toBeVisible()
    await expect(page.locator('button:has-text("Generate Certificate")')).toBeVisible()
  })

  test('should generate certificate successfully', async ({ page }) => {
    // Mock certificate generation
    await page.route('/api/functions/v1/certificate/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          cert_id: 'new-cert-456',
          url: 'https://example.com/new-certificate.pdf',
          message: 'Certificate generated successfully'
        })
      })
    })

    // Click generate certificate button
    await page.click('button:has-text("Generate Certificate")')
    
    // Wait for success message
    await expect(page.locator('text=Certificate generated successfully!')).toBeVisible()
    
    // Verify certificate card updates
    await expect(page.locator('text=Employment-Ready Certificate')).toBeVisible()
    await expect(page.locator('text=Verified')).toBeVisible()
  })

  test('should handle certificate generation failure', async ({ page }) => {
    // Mock certificate generation failure
    await page.route('/api/functions/v1/certificate/generate', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'User does not meet employment criteria'
        })
      })
    })

    // Click generate certificate button
    await page.click('button:has-text("Generate Certificate")')
    
    // Wait for error message
    await expect(page.locator('text=User does not meet employment criteria')).toBeVisible()
  })

  test('should download certificate', async ({ page }) => {
    // Mock certificate exists
    await page.addInitScript(() => {
      window.mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  cert_id: 'test-cert-123',
                  track: 'Software Engineering',
                  issued_at: '2024-01-15T10:30:00Z',
                  url: 'https://example.com/certificate.pdf'
                },
                error: null
              })
            })
          })
        })
      }
    })

    // Mock PDF download
    await page.route('https://example.com/certificate.pdf', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('fake-pdf-content')
      })
    })

    // Click download button
    await page.click('button:has-text("Download")')
    
    // Verify download success message
    await expect(page.locator('text=Certificate downloaded!')).toBeVisible()
  })

  test('should share certificate', async ({ page }) => {
    // Mock certificate exists
    await page.addInitScript(() => {
      window.mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  cert_id: 'test-cert-123',
                  track: 'Software Engineering',
                  issued_at: '2024-01-15T10:30:00Z',
                  url: 'https://example.com/certificate.pdf'
                },
                error: null
              })
            })
          })
        })
      }
    })

    // Mock navigator.share
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        value: () => Promise.resolve(),
        writable: true
      })
    })

    // Click share button
    await page.click('button:has-text("Share")')
    
    // Verify share success message
    await expect(page.locator('text=Certificate shared!')).toBeVisible()
  })

  test('should open verification page', async ({ page }) => {
    // Mock certificate exists
    await page.addInitScript(() => {
      window.mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  cert_id: 'test-cert-123',
                  track: 'Software Engineering',
                  issued_at: '2024-01-15T10:30:00Z',
                  url: 'https://example.com/certificate.pdf'
                },
                error: null
              })
            })
          })
        })
      }
    })

    // Mock verification API
    await page.route('/api/verify/test-cert-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          certificate: {
            cert_id: 'test-cert-123',
            track: 'Software Engineering',
            issued_at: '2024-01-15T10:30:00Z',
            user_name: 'Test User',
            url: 'https://example.com/certificate.pdf'
          },
          verification: {
            signature: 'test-signature',
            verification_hash: 'test-hash',
            verified_at: '2024-01-15T10:30:00Z'
          }
        })
      })
    })

    // Click verification button (external link icon)
    await page.click('button[aria-label="Open verification"]')
    
    // Verify new tab opens with verification page
    const newPage = await page.waitForEvent('popup')
    await expect(newPage.locator('text=Certificate Verification')).toBeVisible()
  })

  test('should display certificate in dashboard layout', async ({ page }) => {
    // Mock certificate exists
    await page.addInitScript(() => {
      window.mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  cert_id: 'test-cert-123',
                  track: 'Software Engineering',
                  issued_at: '2024-01-15T10:30:00Z',
                  url: 'https://example.com/certificate.pdf'
                },
                error: null
              })
            })
          })
        })
      }
    })

    // Verify certificate card is in the correct position in dashboard
    const certificateSection = page.locator('[data-testid="certificate-section"]')
    await expect(certificateSection).toBeVisible()
    
    // Verify it appears before quick actions
    const quickActionsSection = page.locator('text=Quick Actions')
    await expect(quickActionsSection).toBeVisible()
    
    // Check that certificate card is above quick actions
    const certificateCard = page.locator('[data-testid="certificate-card"]')
    const certificateRect = await certificateCard.boundingBox()
    const quickActionsRect = await quickActionsSection.boundingBox()
    
    expect(certificateRect?.y).toBeLessThan(quickActionsRect?.y || 0)
  })
}) 