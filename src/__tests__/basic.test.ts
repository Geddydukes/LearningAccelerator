import { describe, it, expect } from 'vitest'

describe('Basic Tests', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should test environment variables', () => {
    expect(import.meta.env.VITE_GEMINI_API_KEY).toBe('test-api-key')
  })
})