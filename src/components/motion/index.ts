// Motion system exports
export { MotionProvider, motionConfig, pageTransition, heroSequence, microInteractions } from './MotionConfig';
export { HeroSequence, animateRippleUniforms } from './HeroSequence';
export { 
  AnimatedProgressRing,
  AnimatedButton,
  AnimatedChatBubble,
  AnimatedPlayIcon,
  AnimatedKPITrend,
  useGestureSupport
} from './AnimatedComponents';
export {
  AccessibleMotion,
  LiveRegion,
  FocusableMotion,
  contrastAwareStyles,
  usePerformanceMonitoring
} from './AccessibilityMotion';

// CSS keyframes for typing indicator
export const typingIndicatorCSS = `
  @keyframes typingDot {
    0%, 60%, 100% {
      transform: scale(1);
      opacity: 0.5;
    }
    30% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
  
  .typing-dot {
    animation: typingDot 500ms ease-in-out infinite;
  }
  
  .typing-dot:nth-child(2) {
    animation-delay: 100ms;
  }
  
  .typing-dot:nth-child(3) {
    animation-delay: 200ms;
  }
`;

// Time-of-day water tint utility
export const getWaterTint = () => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    return { r: 0.4, g: 0.7, b: 1.0 }; // Morning blue
  } else if (hour >= 12 && hour < 18) {
    return { r: 0.3, g: 0.6, b: 0.9 }; // Afternoon blue
  } else if (hour >= 18 && hour < 21) {
    return { r: 0.5, g: 0.4, b: 0.8 }; // Evening purple
  } else {
    return { r: 0.2, g: 0.3, b: 0.6 }; // Night dark blue
  }
};

// Performance utilities
export const animationFrameBudget = 16.67; // 60fps in milliseconds

export const throttleAnimation = (fn: Function, budget: number = animationFrameBudget) => {
  let lastTime = 0;
  
  return (...args: any[]) => {
    const now = performance.now();
    if (now - lastTime >= budget) {
      lastTime = now;
      fn(...args);
    }
  };
};