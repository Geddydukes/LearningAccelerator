import { supabase } from '../supabase'

export type AgentType = 'CLO' | 'Socratic' | 'TA' | 'Project'

export interface StreakData {
  user_id: string
  agent: AgentType
  activity_date: string
  created_at: string
}

export interface CurrentStreak {
  user_id: string
  agent: AgentType
  current_streak_days: number
}

export interface UserProfile {
  id: string
  xp: number
  level: number
}

/**
 * Logs a streak activity and increments XP for a user
 * @param userId - The user's ID
 * @param agent - The agent type (CLO, Socratic, TA, Project)
 * @param xp - XP to award (default: 10)
 * @returns Promise<boolean> - Success status
 */
export async function logStreak(
  userId: string, 
  agent: AgentType, 
  xp: number = 10
): Promise<boolean> {
  try {
    // Call the log_streak function
    const { error } = await supabase.rpc('log_streak', {
      p_user_id: userId,
      p_agent: agent,
      p_xp: xp
    })

    if (error) {
      console.error('Error logging streak:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in logStreak:', error)
    return false
  }
}

/**
 * Gets current streak data for a user
 * @param userId - The user's ID
 * @returns Promise<CurrentStreak[]> - Array of current streaks
 */
export async function getCurrentStreaks(userId: string): Promise<CurrentStreak[]> {
  try {
    const { data, error } = await supabase
      .from('current_streak_days')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      // If the view doesn't exist, return empty array
      if (error.code === '42P01') {
        console.warn('Current streak days view not found, returning empty streaks')
        return []
      }
      console.error('Error fetching current streaks:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getCurrentStreaks:', error)
    return []
  }
}

/**
 * Gets user profile with XP and level
 * @param userId - The user's ID
 * @returns Promise<UserProfile | null> - User profile data
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // First try to get user with XP column
    const { data, error } = await supabase
      .from('users')
      .select('id, xp')
      .eq('id', userId)
      .single()

    if (error) {
      // If XP column doesn't exist, try without it
      if (error.code === '42703' || error.code === '400') {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single()

        if (userError) {
          console.error('Error fetching user profile:', userError)
          return null
        }

        if (!userData) return null

        // Return default XP values if column doesn't exist
        return {
          id: userData.id,
          xp: 0,
          level: 1
        }
      }
      
      console.error('Error fetching user profile:', error)
      return null
    }

    if (!data) return null

    // Calculate level based on XP (every 100 XP = 1 level)
    const level = Math.floor((data.xp || 0) / 100) + 1

    return {
      id: data.id,
      xp: data.xp || 0,
      level
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

/**
 * Gets streak history for a user
 * @param userId - The user's ID
 * @param days - Number of days to fetch (default: 30)
 * @returns Promise<StreakData[]> - Array of streak data
 */
export async function getStreakHistory(
  userId: string, 
  days: number = 30
): Promise<StreakData[]> {
  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('activity_date', { ascending: false })

    if (error) {
      console.error('Error fetching streak history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getStreakHistory:', error)
    return []
  }
}

/**
 * Calculates total XP needed for a given level
 * @param level - The level to calculate XP for
 * @returns number - Total XP needed for that level
 */
export function getXPForLevel(level: number): number {
  return (level - 1) * 100
}

/**
 * Calculates XP progress within current level
 * @param xp - Current XP
 * @returns number - XP progress (0-100)
 */
export function getXPProgress(xp: number): number {
  // Handle negative XP
  if (xp < 0) return 0
  
  // Calculate which level this XP belongs to
  // XP 0-99 = level 1, XP 100-199 = level 2, etc.
  // But for progress calculation, we need to handle exact boundaries
  let level, levelStartXP, levelEndXP
  
  if (xp === 0) {
    level = 1
    levelStartXP = 0
    levelEndXP = 100
  } else {
    level = Math.floor((xp - 1) / 100) + 1
    levelStartXP = (level - 1) * 100
    levelEndXP = level * 100
  }
  
  // Calculate progress within the current level
  const progressInLevel = xp - levelStartXP
  const levelXPNeeded = levelEndXP - levelStartXP
  
  // Handle edge case where levelXPNeeded is 0
  if (levelXPNeeded === 0) return 100
  
  // Calculate progress percentage
  const progress = (progressInLevel / levelXPNeeded) * 100
  
  return Math.min(100, Math.max(0, progress))
}

/**
 * Checks if user leveled up
 * @param oldXP - Previous XP value
 * @param newXP - Current XP value
 * @returns boolean - True if leveled up
 */
export function didLevelUp(oldXP: number, newXP: number): boolean {
  const oldLevel = Math.floor(oldXP / 100) + 1
  const newLevel = Math.floor(newXP / 100) + 1
  return newLevel > oldLevel
}

// XP constants for different activities
export const XP_REWARDS = {
  TA_COMPLETION: 10,
  SOCRATIC_END_TOPIC: 5,
  CLO_META_REFLECTION: 3,
  PORTFOLIO_GIT_PUSH: 50,
  DAILY_LOGIN: 1,
  WEEKLY_GOAL: 25,
  MONTHLY_ACHIEVEMENT: 100
} as const 