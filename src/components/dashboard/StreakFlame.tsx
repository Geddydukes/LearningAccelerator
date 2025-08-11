import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Zap } from 'lucide-react'
import { getCurrentStreaks, CurrentStreak } from '../../lib/gamify/logStreak'
import { useAuth } from '../../contexts/AuthContext'

interface StreakFlameProps {
  className?: string
}

export const StreakFlame: React.FC<StreakFlameProps> = ({ className }) => {
  const { user } = useAuth()
  const [streaks, setStreaks] = useState<CurrentStreak[]>([])
  const [loading, setLoading] = useState(true)
  const [totalStreakDays, setTotalStreakDays] = useState(0)

  useEffect(() => {
    if (user?.id) {
      fetchStreaks()
    }
  }, [user])

  const fetchStreaks = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const currentStreaks = await getCurrentStreaks(user.id)
      setStreaks(currentStreaks)
      
      // Calculate total streak days across all agents
      const total = currentStreaks.reduce((sum, streak) => sum + streak.current_streak_days, 0)
      setTotalStreakDays(total)
    } catch (error) {
      console.error('Error fetching streaks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFlameIntensity = (days: number) => {
    if (days >= 7) return 'high'
    if (days >= 3) return 'medium'
    return 'low'
  }

  const getFlameColor = (intensity: string) => {
    switch (intensity) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-orange-500'
      default:
        return 'text-yellow-500'
    }
  }

  const getFlameSize = (intensity: string) => {
    switch (intensity) {
      case 'high':
        return 'w-6 h-6'
      case 'medium':
        return 'w-5 h-5'
      default:
        return 'w-4 h-4'
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  if (totalStreakDays === 0) {
    return (
      <div className={`flex items-center space-x-2 text-gray-400 ${className}`}>
        <Flame className="w-4 h-4" />
        <span className="text-sm">No streak</span>
      </div>
    )
  }

  const intensity = getFlameIntensity(totalStreakDays)
  const flameColor = getFlameColor(intensity)
  const flameSize = getFlameSize(intensity)

  return (
    <motion.div 
      className={`flex items-center space-x-2 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        <motion.div
          key={totalStreakDays}
          initial={{ scale: 1.2, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0.8, rotate: 10 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <Flame className={`${flameSize} ${flameColor}`} />
          
          {/* Sparkle effect for high intensity */}
          {intensity === 'high' && (
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Zap className="w-3 h-3 text-yellow-400" />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {totalStreakDays} day{totalStreakDays !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          streak
        </span>
      </div>

      {/* Agent breakdown */}
      {streaks.length > 0 && (
        <div className="ml-2 flex space-x-1">
          {streaks.map((streak) => (
            <motion.div
              key={streak.agent}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {streak.agent}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {streak.current_streak_days}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
} 