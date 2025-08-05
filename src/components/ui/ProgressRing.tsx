import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg'; // 40px, 60px, 80px
  strokeWidth?: number; // 2-8
  color?: 'primary' | 'emerald' | 'amber' | 'teal';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 'md',
  strokeWidth = 3,
  color = 'primary',
  showLabel = true,
  animated = true,
  className = '',
  children
}) => {
  const sizes = {
    sm: { width: 40, height: 40, radius: 16 },
    md: { width: 60, height: 60, radius: 24 },
    lg: { width: 80, height: 80, radius: 32 }
  };

  const colors = {
    primary: {
      stroke: '#3b82f6',
      background: '#e5e7eb'
    },
    emerald: {
      stroke: '#10b981',
      background: '#e5e7eb'
    },
    amber: {
      stroke: '#f59e0b',
      background: '#e5e7eb'
    },
    teal: {
      stroke: '#14b8a6',
      background: '#e5e7eb'
    }
  };

  const { width, height, radius } = sizes[size];
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width, height }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${Math.round(progress)}% complete`}
    >
      <svg
        width={width}
        height={height}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke={colors[color].background}
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-20"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke={colors[color].stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset: animated ? strokeDashoffset : circumference - (progress / 100) * circumference 
          }}
          transition={{ 
            duration: animated ? 1 : 0, 
            ease: "easeOut" 
          }}
          className="drop-shadow-sm"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showLabel && (
          <span 
            className={`font-semibold text-gray-700 dark:text-gray-300 ${
              size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
            }`}
          >
            {Math.round(progress)}%
          </span>
        ))}
      </div>
    </div>
  );
};