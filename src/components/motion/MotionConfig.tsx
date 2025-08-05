import React from 'react';
import { MotionConfig as FramerMotionConfig } from 'framer-motion';

// Global motion configuration
export const motionConfig = {
  // Reduced motion detection
  reducedMotion: typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false,
    
  // Easing functions
  easing: {
    easeOutSine: [0.39, 0.575, 0.565, 1],
    easeOutBack: [0.34, 1.56, 0.64, 1],
    spring: { stiffness: 250, damping: 18 }
  },
  
  // Duration presets
  duration: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.6,
    hero: 1.2,
    ripple: 0.6
  }
};

// Page transition variants
export const pageTransition = {
  initial: { 
    opacity: 0, 
    y: motionConfig.reducedMotion ? 0 : 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: motionConfig.duration.fast,
      ease: motionConfig.easing.easeOutSine
    }
  },
  exit: { 
    opacity: 0, 
    y: motionConfig.reducedMotion ? 0 : -20,
    transition: {
      duration: motionConfig.duration.fast,
      ease: motionConfig.easing.easeOutSine
    }
  }
};

// Hero sequence variants
export const heroSequence = {
  headline: {
    initial: { opacity: 1 },
    fadeOut: { 
      opacity: 0,
      transition: {
        duration: motionConfig.duration.hero,
        ease: motionConfig.easing.easeOutSine
      }
    }
  },
  camera: {
    initial: { z: 0 },
    dolly: { 
      z: -4,
      transition: {
        duration: motionConfig.duration.hero,
        ease: motionConfig.easing.easeOutSine
      }
    }
  }
};

// Component micro-interactions
export const microInteractions = {
  progressRing: {
    pulse: {
      scale: motionConfig.reducedMotion ? 1 : [1, 1.05, 1],
      transition: {
        duration: motionConfig.duration.slow,
        ease: motionConfig.easing.easeOutSine
      }
    }
  },
  
  button: {
    hover: {
      scale: motionConfig.reducedMotion ? 1 : 1.04,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      transition: {
        duration: motionConfig.duration.fast,
        ease: motionConfig.easing.easeOutSine
      }
    },
    tap: {
      scale: motionConfig.reducedMotion ? 1 : 0.96
    }
  },
  
  kpiTrend: {
    pop: {
      scale: motionConfig.reducedMotion ? 1 : [1, 1.2, 1],
      transition: motionConfig.easing.spring
    }
  },
  
  chatBubble: {
    enter: {
      opacity: [0, 1],
      y: motionConfig.reducedMotion ? 0 : [20, 0],
      scale: motionConfig.reducedMotion ? 1 : [0.95, 1],
      transition: {
        duration: motionConfig.duration.normal,
        ease: motionConfig.easing.easeOutSine
      }
    }
  }
};

// Global motion provider
interface MotionProviderProps {
  children: React.ReactNode;
}

export const MotionProvider: React.FC<MotionProviderProps> = ({ children }) => {
  return (
    <FramerMotionConfig
      reducedMotion={motionConfig.reducedMotion ? "always" : "never"}
      transition={{
        duration: motionConfig.duration.normal,
        ease: motionConfig.easing.easeOutSine
      }}
    >
      {children}
    </FramerMotionConfig>
  );
};