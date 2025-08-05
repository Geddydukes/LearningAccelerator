import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the entire supabase module
const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
}

vi.mock('../supabase', () => ({
  supabase: mockSupabaseClient
}))

const { DatabaseService } = await import('../database')

describe('DatabaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUser', () => {
    it('creates user with correct data', async () => {
      const mockAuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' }
      }

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        voice_preference: 'alloy',
        learning_preferences: {}
      }

      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      })

      const result = await DatabaseService.createUser(mockAuthUser)

      expect(mockInsert).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })
  })
})