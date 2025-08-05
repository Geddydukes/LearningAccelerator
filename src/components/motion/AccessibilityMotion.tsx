import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Accessibility-aware motion wrapper
interface AccessibleMotionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const AccessibleMotion: React.FC<AccessibleMotionProps> = ({
  children,
  fallback,
  className = ''
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (reducedMotion && fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return <div className={className}>{children}</div>;
};

// Live region for dynamic updates
interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite'
}) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// Focus management for animated elements
interface FocusableMotionProps {
  children: React.ReactNode;
  onAnimationComplete?: () => void;
  focusOnComplete?: boolean;
}

export const FocusableMotion: React.FC<FocusableMotionProps> = ({
  children,
  onAnimationComplete,
  focusOnComplete = false
}) => {
  const handleAnimationComplete = () => {
    if (focusOnComplete) {
      // Focus the first focusable element
      const focusable = document.querySelector('[tabindex="0"], button, input, select, textarea, a[href]') as HTMLElement;
      focusable?.focus();
    }
    onAnimationComplete?.();
  };

  return (
    <motion.div
      onAnimationComplete={handleAnimationComplete}
      className="focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 rounded-lg"
    >
      {children}
    </motion.div>
  );
};

// Contrast-aware animations
export const contrastAwareStyles = `
  @media (prefers-contrast: high) {
    .motion-element {
      --motion-shadow: none;
      --motion-blur: none;
      border: 2px solid currentColor;
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .motion-element {
      animation: none !important;
      transition: none !important;
    }
    
    .motion-element:focus {
      outline: 3px solid #2563eb;
      outline-offset: 2px;
    }
  }
`;

// Performance monitoring
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.includes('animation')) {
            console.log(`Animation ${entry.name}: ${entry.duration}ms`);
            
            // Warn if animation is too long
            if (entry.duration > 16.67) { // 60fps threshold
              console.warn(`Animation ${entry.name} exceeded 16.67ms budget`);
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
      
      return () => observer.disconnect();
    }
  }, []);
};