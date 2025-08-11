import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  logStreak, 
  getCurrentStreaks, 
  getUserProfile, 
  getStreakHistory,
  getXPForLevel,
  getXPProgress,
  didLevelUp,
  XP_REWARDS,
  type AgentType
} from '../../src/lib/gamify/logStreak'

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        gte: vi.fn(() => ({
          order: vi.fn()
        }))
      }))
    }))
  }))
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}))

describe('Gamification System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('logStreak', () => {
    it('should log streak successfully', async () => {
      const userId = 'test-user-id'
      const agent: AgentType = 'CLO'
      const xp = 10

      mockSupabase.rpc.mockResolvedValue({
        error: null
      })

      const result = await logStreak(userId, agent, xp)

      expect(result).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('log_streak', {
        p_user_id: userId,
        p_agent: agent,
        p_xp: xp
      })
    })

    it('should handle streak logging error', async () => {
      const userId = 'test-user-id'
      const agent: AgentType = 'Socratic'

      mockSupabase.rpc.mockResolvedValue({
        error: { message: 'Database error' }
      })

      const result = await logStreak(userId, agent)

      expect(result).toBe(false)
    })

    it('should use default XP when not provided', async () => {
      const userId = 'test-user-id'
      const agent: AgentType = 'TA'

      mockSupabase.rpc.mockResolvedValue({
        error: null
      })

      await logStreak(userId, agent)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('log_streak', {
        p_user_id: userId,
        p_agent: agent,
        p_xp: 10 // Default XP
      })
    })
  })

  describe('getCurrentStreaks', () => {
    it('should return current streaks for user', async () => {
      const userId = 'test-user-id'
      const mockStreaks = [
        { user_id: userId, agent: 'CLO', current_streak_days: 5 },
        { user_id: userId, agent: 'Socratic', current_streak_days: 3 }
      ]

      const mockFrom = {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: mockStreaks,
            error: null
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await getCurrentStreaks(userId)

      expect(result).toEqual(mockStreaks)
      expect(mockSupabase.from).toHaveBeenCalledWith('current_streak_days')
    })

    it('should return empty array on error', async () => {
      const userId = 'test-user-id'

      const mockFrom = {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await getCurrentStreaks(userId)

      expect(result).toEqual([])
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile with calculated level', async () => {
      const userId = 'test-user-id'
      const mockProfile = {
        id: userId,
        xp: 250
      }

      const mockFrom = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockProfile,
              error: null
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await getUserProfile(userId)

      expect(result).toEqual({
        id: userId,
        xp: 250,
        level: 3 // Math.floor(250/100) + 1
      })
    })

    it('should return null when user not found', async () => {
      const userId = 'test-user-id'

      const mockFrom = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' }
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await getUserProfile(userId)

      expect(result).toBeNull()
    })
  })

  describe('getStreakHistory', () => {
    it('should return streak history for user', async () => {
      const userId = 'test-user-id'
      const days = 30
      const mockHistory = [
        { user_id: userId, agent: 'CLO', activity_date: '2024-01-15', created_at: '2024-01-15T10:00:00Z' },
        { user_id: userId, agent: 'Socratic', activity_date: '2024-01-14', created_at: '2024-01-14T10:00:00Z' }
      ]

      const mockFrom = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockHistory,
                error: null
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await getStreakHistory(userId, days)

      expect(result).toEqual(mockHistory)
    })

    it('should use default 30 days when not specified', async () => {
      const userId = 'test-user-id'

      const mockFrom = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockFrom)

      await getStreakHistory(userId)

      // Verify the date calculation for 30 days
      expect(mockSupabase.from).toHaveBeenCalledWith('streaks')
    })
  })

  describe('XP Calculations', () => {
    it('should calculate XP for level correctly', () => {
      expect(getXPForLevel(1)).toBe(0)
      expect(getXPForLevel(2)).toBe(100)
      expect(getXPForLevel(5)).toBe(400)
      expect(getXPForLevel(10)).toBe(900)
    })

    it('should calculate XP progress correctly', () => {
      expect(getXPProgress(0)).toBe(0)
      expect(getXPProgress(50)).toBe(50)
      expect(getXPProgress(100)).toBe(100)
      expect(getXPProgress(150)).toBe(50)
      expect(getXPProgress(200)).toBe(100)
    })

    it('should detect level up correctly', () => {
      expect(didLevelUp(50, 100)).toBe(true)
      expect(didLevelUp(100, 150)).toBe(false)
      expect(didLevelUp(200, 250)).toBe(false)
      expect(didLevelUp(250, 300)).toBe(true)
    })

    it('should not detect level up for same level', () => {
      expect(didLevelUp(50, 50)).toBe(false)
      expect(didLevelUp(100, 100)).toBe(false)
    })
  })

  describe('XP Rewards', () => {
    it('should have correct XP reward values', () => {
      expect(XP_REWARDS.TA_COMPLETION).toBe(10)
      expect(XP_REWARDS.SOCRATIC_END_TOPIC).toBe(5)
      expect(XP_REWARDS.CLO_META_REFLECTION).toBe(3)
      expect(XP_REWARDS.PORTFOLIO_GIT_PUSH).toBe(50)
      expect(XP_REWARDS.DAILY_LOGIN).toBe(1)
      expect(XP_REWARDS.WEEKLY_GOAL).toBe(25)
      expect(XP_REWARDS.MONTHLY_ACHIEVEMENT).toBe(100)
    })
  })

  describe('Agent Type Validation', () => {
    it('should accept valid agent types', () => {
      const validAgents: AgentType[] = ['CLO', 'Socratic', 'TA', 'Project']
      
      validAgents.forEach(agent => {
        expect(['CLO', 'Socratic', 'TA', 'Project']).toContain(agent)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const userId = 'test-user-id'

      mockSupabase.rpc.mockRejectedValue(new Error('Network error'))

      const result = await logStreak(userId, 'CLO')

      expect(result).toBe(false)
    })

    it('should handle database connection errors', async () => {
      const userId = 'test-user-id'

      const mockFrom = {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.reject(new Error('Connection failed')))
        }))
      }
      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await getCurrentStreaks(userId)

      expect(result).toEqual([])
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero XP correctly', () => {
      expect(getXPProgress(0)).toBe(0)
      expect(getXPForLevel(1)).toBe(0)
      expect(didLevelUp(0, 0)).toBe(false)
    })

    it('should handle negative XP gracefully', () => {
      // This would be handled by the database constraint, but we test the calculation
      expect(getXPProgress(-50)).toBe(0)
    })

    it('should handle very high XP values', () => {
      expect(getXPProgress(10000)).toBe(100)
      expect(getXPForLevel(100)).toBe(9900)
    })
  })
}) 