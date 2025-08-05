import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'subtle'
  blur?: 'sm' | 'md' | 'lg'
  className?: string
  hover?: boolean
}

export function GlassCard({ 
  children, 
  variant = 'default',
  blur = 'md',
  className = '',
  hover = true,
  ...props 
}: GlassCardProps) {
  const baseClasses = 'rounded-2xl border border-white/20 dark:border-white/10'
  
  const variantClasses = {
    default: 'bg-white/80 dark:bg-slate-800/80 shadow-glass',
    elevated: 'bg-white/90 dark:bg-slate-800/90 shadow-depth-2',
    subtle: 'bg-white/60 dark:bg-slate-800/60 shadow-ripple-sm'
  }
  
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg'
  }

  const hoverAnimation = hover ? {
    whileHover: { 
      y: -2,
      boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15), 0 4px 6px rgba(59, 130, 246, 0.1)'
    },
    transition: { 
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  } : {}

  return (
    <motion.div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${blurClasses[blur]}
        ${className}
      `}
      {...hoverAnimation}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default GlassCard