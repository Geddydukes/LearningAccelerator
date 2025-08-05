import React from 'react'
import { motion } from 'framer-motion'
import { Brain, User, Settings, Bell } from 'lucide-react'

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  badge?: number
}

interface FluidNavigationProps {
  items?: NavigationItem[]
  progress?: number
  user?: {
    name: string
    avatar?: string
  }
  variant?: 'solid' | 'glass' | 'overlay'
  className?: string
}

const defaultItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Brain, href: '/' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  { id: 'notifications', label: 'Notifications', icon: Bell, href: '/notifications', badge: 3 }
]

export function FluidNavigation({
  items = defaultItems,
  progress = 0,
  user,
  variant = 'glass',
  className = ''
}: FluidNavigationProps) {
  const variantClasses = {
    solid: 'bg-white dark:bg-slate-900 shadow-depth-2',
    glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-white/20 dark:border-white/10',
    overlay: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl'
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`
        sticky top-0 z-50 px-6 py-4
        ${variantClasses[variant]}
        ${className}
      `}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Brand */}
        <motion.div 
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-aqua-500 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            
            {/* Progress ring */}
            {progress > 0 && (
              <svg className="absolute -inset-1 w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-primary-200 dark:text-primary-800"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  className="text-primary-500"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    strokeDasharray: "125.6",
                    strokeDashoffset: 125.6 * (1 - progress / 100)
                  }}
                />
              </svg>
            )}
          </div>
          
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              Learning Accelerator
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ripple of Knowledge
            </p>
          </div>
        </motion.div>

        {/* Navigation Items */}
        <div className="hidden md:flex items-center space-x-1">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <motion.a
                key={item.id}
                href={item.href}
                className="relative flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                
                {/* Badge */}
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </motion.a>
            )
          })}
        </div>

        {/* User Profile */}
        {user && (
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Learning in progress
              </p>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-teal-400 flex items-center justify-center">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Progress bar */}
      {progress > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary-500 to-aqua-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}
    </motion.nav>
  )
}

export default FluidNavigation