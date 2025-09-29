import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Trophy, Zap } from 'lucide-react'
import { getUserProfile, getXPProgress, didLevelUp, UserProfile } from '../../lib/gamify/logStreak'
import { useAuth } from '../../contexts/AuthContext'

interface XPBadgeProps {
  className?: string
}

// Confetti component for level up animation
const Confetti: React.FC = () => {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ 
            scale: 0,
            y: 0,
            rotate: 0
          }}
          animate={{ 
            scale: [0, 1, 0],
            y: [-20, -100],
            rotate: [0, 360],
            x: [0, (Math.random() - 0.5) * 50]
          }}
          transition={{ 
            duration: 2,
            delay: Math.random() * 0.5,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )
}

export const XPBadge: React.FC<XPBadgeProps> = ({ className }) => {
  const { user } = useAuth()
  const [previousXP, setPreviousXP] = useState<number>(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [levelUp, setLevelUp] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch profile when user changes
  useEffect(() => {
    if (!user?.id) return

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const userProfile = await getUserProfile(user.id)
        setProfile(userProfile)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchProfile()
  }, [user?.id])

  useEffect(() => {
    if (profile && previousXP > 0) {
      const leveledUp = didLevelUp(previousXP, profile.xp)
      if (leveledUp) {
        setLevelUp(true)
        setShowConfetti(true)
        
        // Hide confetti after animation
        setTimeout(() => {
          setShowConfetti(false)
        }, 3000)
        
        // Reset level up state
        setTimeout(() => {
          setLevelUp(false)
        }, 1000)
      }
    }
    
    if (profile) {
      setPreviousXP(profile.xp)
    }
  }, [profile, previousXP])

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-gray-400 ${className}`}>
        <Star className="w-4 h-4" />
        <span className="text-sm">Error loading XP</span>
      </div>
    )
  }

  if (loading || !profile) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  const progress = getXPProgress(profile.xp)
  const nextLevelXP = (profile.level) * 100
  const currentLevelXP = (profile.level - 1) * 100
  const xpInLevel = profile.xp - currentLevelXP
  const xpNeededForNextLevel = nextLevelXP - profile.xp

  const getLevelColor = (level: number) => {
    if (level >= 20) return 'text-purple-500'
    if (level >= 15) return 'text-red-500'
    if (level >= 10) return 'text-orange-500'
    if (level >= 5) return 'text-yellow-500'
    return 'text-blue-500'
  }

  const getLevelIcon = (level: number) => {
    if (level >= 20) return Trophy
    if (level >= 10) return Star
    return Zap
  }

  const Icon = getLevelIcon(profile.level)
  const levelColor = getLevelColor(profile.level)

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      <motion.div
        className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={levelUp ? { 
            scale: [1, 1.3, 1],
            rotate: [0, 10, -10, 0]
          } : {}}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <Icon className={`w-6 h-6 ${levelColor}`} />
          
          {levelUp && (
            <motion.div
              className="absolute -top-1 -right-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Star className="w-3 h-3 text-yellow-400" />
            </motion.div>
          )}
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Level {profile.level}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {profile.xp} XP
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {xpInLevel}/{nextLevelXP - currentLevelXP} XP
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {xpNeededForNextLevel} to next level
            </span>
          </div>
        </div>

        {/* Level up indicator */}
        <AnimatePresence>
          {levelUp && (
            <motion.div
              className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              +1
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
} 