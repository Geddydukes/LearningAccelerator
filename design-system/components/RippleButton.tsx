import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  rippleColor?: string
  className?: string
}

export function RippleButton({
  children,
  variant = 'primary',
  size = 'md',
  rippleColor,
  className = '',
  onClick,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-ripple-md',
    secondary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-ripple-md',
    ghost: 'bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    glass: 'bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white backdrop-blur-md border border-white/20'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      const newRipple = {
        id: Date.now(),
        x,
        y
      }
      
      setRipples(prev => [...prev, newRipple])
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
      }, 600)
    }
    
    onClick?.(event)
  }

  const defaultRippleColor = rippleColor || (
    variant === 'primary' || variant === 'secondary' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(59, 130, 246, 0.6)'
  )

  return (
    <motion.button
      ref={buttonRef}
      className={`
        relative overflow-hidden rounded-2xl font-medium transition-all duration-150 ease-out-sine
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: defaultRippleColor,
          }}
          initial={{
            width: 0,
            height: 0,
            x: '-50%',
            y: '-50%',
            opacity: 0.6
          }}
          animate={{
            width: 200,
            height: 200,
            opacity: 0
          }}
          transition={{
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1]
          }}
        />
      ))}
      
      {/* Button content */}
      <span className="relative z-10">
        {children}
      </span>
    </motion.button>
  )
}

export default RippleButton