import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { heroSequence, motionConfig } from './MotionConfig';

interface HeroSequenceProps {
  onRippleComplete: () => void;
  children: React.ReactNode;
}

export const HeroSequence: React.FC<HeroSequenceProps> = ({ 
  onRippleComplete, 
  children 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const headlineControls = useAnimation();
  const cameraControls = useAnimation();
  const rippleTimeRef = useRef(0);

  const handleWaterClick = async (event: React.MouseEvent) => {
    if (isAnimating || motionConfig.reducedMotion) {
      onRippleComplete();
      return;
    }

    setIsAnimating(true);
    
    // Get click position for ripple
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Start ripple animation (handled by Three.js)
    rippleTimeRef.current = 0;
    const startTime = Date.now();
    
    const animateRipple = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      rippleTimeRef.current = elapsed;
      
      if (elapsed < motionConfig.duration.ripple) {
        requestAnimationFrame(animateRipple);
      }
    };
    animateRipple();

    // Concurrent animations
    const headlinePromise = headlineControls.start(heroSequence.headline.fadeOut);
    const cameraPromise = cameraControls.start(heroSequence.camera.dolly);
    
    // Wait for animations to complete
    await Promise.all([headlinePromise, cameraPromise]);
    
    // Auto-scroll to dashboard
    setTimeout(() => {
      onRippleComplete();
    }, 100);
  };

  return (
    <div 
      className="relative w-full h-screen cursor-pointer overflow-hidden"
      onClick={handleWaterClick}
      role="button"
      tabIndex={0}
      aria-label="Click to begin your learning journey"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleWaterClick(e as any);
        }
      }}
    >
      {/* Water background - Three.js canvas goes here */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-blue-800" />
      
      {/* Hero content */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-10"
        animate={headlineControls}
        initial={heroSequence.headline.initial}
      >
        {children}
      </motion.div>
      
      {/* Ripple click indicator */}
      {!motionConfig.reducedMotion && (
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ 
            y: [0, -10, 0],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-12 h-12 border-2 border-white/60 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white/80 rounded-full" />
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Three.js uniform animation helper
export const animateRippleUniforms = (
  uniforms: any,
  clickPosition: [number, number],
  onComplete: () => void
) => {
  if (motionConfig.reducedMotion) {
    onComplete();
    return;
  }

  const startTime = Date.now();
  const duration = motionConfig.duration.ripple * 1000; // Convert to ms
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Update Three.js uniforms
    uniforms.rippleCenter.value.set(clickPosition[0], clickPosition[1]);
    uniforms.rippleStrength.value = 3.0 * (1 - progress); // Amplitude 3x, fade out
    uniforms.rippleTime.value = progress * motionConfig.duration.ripple;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      onComplete();
    }
  };
  
  animate();
};