import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'red';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  showLabel = true,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-600',
    red: 'bg-red-600'
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-2 rounded-full ${colorClasses[color]}`}
        />
      </div>
    </div>
  );
};