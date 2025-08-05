import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Target, Award, Users } from 'lucide-react';

interface KPIMetric {
  name: string;
  current: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  unit: string;
  category?: 'learning' | 'engagement' | 'achievement';
}

interface KPITrendProps {
  metric: KPIMetric;
  variant?: 'default' | 'compact' | 'detailed';
  showSparkline?: boolean;
  className?: string;
}

export const KPITrend: React.FC<KPITrendProps> = ({
  metric,
  variant = 'default',
  showSparkline = false,
  className = ''
}) => {
  const { name, current, target, trend, change, unit, category } = metric;
  
  const progress = Math.min((current / target) * 100, 100);
  const isOnTarget = current >= target;

  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-gray-600 dark:text-gray-400'
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus
  };

  const categoryIcons = {
    learning: Target,
    engagement: Users,
    achievement: Award
  };

  const TrendIcon = trendIcons[trend];
  const CategoryIcon = category ? categoryIcons[category] : Target;

  const formatValue = (value: number) => {
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'K') return `${(value / 1000).toFixed(1)}K`;
    if (unit === 'pts') return `${value} pts`;
    return `${value}${unit}`;
  };

  const formatChange = (value: number) => {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${formatValue(value)}`;
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <CategoryIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {name}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatValue(current)}
          </span>
          <div className={`flex items-center space-x-1 ${trendColors[trend]}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-xs font-medium">
              {formatChange(change)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <CategoryIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Target: {formatValue(target)}
                </p>
              </div>
            </div>
            <div className={`flex items-center space-x-1 ${trendColors[trend]}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {formatChange(change)}
              </span>
            </div>
          </div>

          {/* Current Value */}
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatValue(current)}
              </span>
              {isOnTarget && (
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Target reached!
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-2 rounded-full ${
                  isOnTarget 
                    ? 'bg-emerald-500' 
                    : progress > 75 
                    ? 'bg-primary-500' 
                    : 'bg-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Sparkline */}
          {showSparkline && (
            <div className="h-16 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
              <Sparkline trend={trend} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <CategoryIcon className="w-4 h-4 text-gray-500" />
          <h4 className="font-medium text-gray-900 dark:text-white">
            {name}
          </h4>
        </div>
        <div className={`flex items-center space-x-1 ${trendColors[trend]}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {formatChange(change)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatValue(current)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            / {formatValue(target)}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-1.5 rounded-full ${
              isOnTarget 
                ? 'bg-emerald-500' 
                : progress > 75 
                ? 'bg-primary-500' 
                : 'bg-amber-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

// Sparkline component for trend visualization
interface SparklineProps {
  trend: 'up' | 'down' | 'stable';
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({ trend, className = '' }) => {
  // Generate sample data points based on trend
  const generateData = () => {
    const points = 20;
    const data = [];
    let value = 50;

    for (let i = 0; i < points; i++) {
      if (trend === 'up') {
        value += Math.random() * 4 - 1; // Mostly upward
      } else if (trend === 'down') {
        value += Math.random() * 4 - 3; // Mostly downward
      } else {
        value += Math.random() * 2 - 1; // Stable with small variations
      }
      data.push(Math.max(0, Math.min(100, value)));
    }
    return data;
  };

  const data = generateData();
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pathData = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const color = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';

  return (
    <svg
      viewBox="0 0 100 100"
      className={`w-full h-full ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

// KPI Grid component for displaying multiple metrics
interface KPIGridProps {
  metrics: KPIMetric[];
  variant?: 'default' | 'compact' | 'detailed';
  showSparklines?: boolean;
  className?: string;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  metrics,
  variant = 'default',
  showSparklines = false,
  className = ''
}) => {
  const gridClasses = {
    default: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    compact: 'space-y-2',
    detailed: 'grid grid-cols-1 lg:grid-cols-2 gap-6'
  };

  return (
    <div className={`${gridClasses[variant]} ${className}`}>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <KPITrend
            metric={metric}
            variant={variant}
            showSparkline={showSparklines}
          />
        </motion.div>
      ))}
    </div>
  );
};