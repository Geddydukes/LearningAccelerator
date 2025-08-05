import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { microInteractions, motionConfig } from './MotionConfig';

// Animated Progress Ring
interface AnimatedProgressRingProps {
  progress: number;
  isComplete?: boolean;
  children: React.ReactNode;
}

export const AnimatedProgressRing: React.FC<AnimatedProgressRingProps> = ({
  progress,
  isComplete,
  children
}) => {
  return (
    <motion.div
      animate={isComplete ? microInteractions.progressRing.pulse : {}}
      className="relative"
    >
      {children}
    </motion.div>
  );
};

// Animated Button with Ripple Effect
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!motionConfig.reducedMotion) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = { id: Date.now(), x, y };
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }
    
    props.onClick?.(event);
  };

  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      whileHover={microInteractions.button.hover}
      whileTap={microInteractions.button.tap}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ width: 0, height: 0, opacity: 0.6 }}
            animate={{ width: 200, height: 200, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
      
      {children}
    </motion.button>
  );
};

// Animated Chat Bubble with Typing Indicator
interface AnimatedChatBubbleProps {
  isTyping?: boolean;
  children: React.ReactNode;
}

export const AnimatedChatBubble: React.FC<AnimatedChatBubbleProps> = ({
  isTyping,
  children
}) => {
  return (
    <motion.div
      variants={microInteractions.chatBubble}
      initial="initial"
      animate="enter"
      className="relative"
    >
      {children}
      
      {/* Typing indicator */}
      {isTyping && (
        <div className="flex space-x-1 mt-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Animated Audio Play/Pause Icon
interface AnimatedPlayIconProps {
  isPlaying: boolean;
  onClick: () => void;
}

export const AnimatedPlayIcon: React.FC<AnimatedPlayIconProps> = ({
  isPlaying,
  onClick
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white"
      aria-label={isPlaying ? "Pause audio" : "Play audio"}
    >
      <motion.svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.g
              key="pause"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <rect x="3" y="2" width="3" height="12" />
              <rect x="10" y="2" width="3" height="12" />
            </motion.g>
          ) : (
            <motion.path
              key="play"
              d="M4 2l10 6-10 6V2z"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            />
          )}
        </AnimatePresence>
      </motion.svg>
    </motion.button>
  );
};

// Animated KPI Trend Arrow
interface AnimatedKPITrendProps {
  trend: 'up' | 'down' | 'stable';
  value: number;
  isNew?: boolean;
}

export const AnimatedKPITrend: React.FC<AnimatedKPITrendProps> = ({
  trend,
  value,
  isNew
}) => {
  const trendColors = {
    up: 'text-emerald-500',
    down: 'text-red-500',
    stable: 'text-gray-500'
  };

  return (
    <motion.div
      className="flex items-center space-x-1"
      animate={isNew ? microInteractions.kpiTrend.pop : {}}
    >
      <motion.svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className={trendColors[trend]}
        initial={{ rotate: trend === 'down' ? 0 : trend === 'up' ? 180 : 90 }}
        animate={{ rotate: trend === 'down' ? 0 : trend === 'up' ? 180 : 90 }}
        transition={{ duration: 0.3 }}
      >
        <path d="M8 2l6 6H2l6-6z" fill="currentColor" />
      </motion.svg>
      <span className="font-medium">{value}</span>
    </motion.div>
  );
};

// Gesture Support Hook
export const useGestureSupport = () => {
  const handleSwipeRight = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10]);
    }
    // Open side nav logic here
  };

  const handleSwipeDown = () => {
    // Cancel ripple and scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { handleSwipeRight, handleSwipeDown };
};