import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Star } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';

export const SubscriptionBadge: React.FC = () => {
  const { subscription, isPro, isEnterprise, loading } = useSubscription();

  if (loading || !subscription) return null;

  const getBadgeConfig = () => {
    if (isEnterprise()) {
      return {
        icon: Crown,
        label: 'Enterprise',
        gradient: 'from-purple-500 to-indigo-600',
        textColor: 'text-purple-100'
      };
    } else if (isPro()) {
      return {
        icon: Zap,
        label: 'Pro',
        gradient: 'from-blue-500 to-emerald-500',
        textColor: 'text-blue-100'
      };
    } else {
      return {
        icon: Star,
        label: 'Free',
        gradient: 'from-gray-400 to-gray-500',
        textColor: 'text-gray-100'
      };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} shadow-lg`}
    >
      <Icon className={`w-4 h-4 ${config.textColor}`} />
      <span className={`text-sm font-semibold ${config.textColor}`}>
        {config.label}
      </span>
    </motion.div>
  );
};

// Feature gate component
interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  fallback,
  children
}) => {
  const { hasFeature, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-8" />;
  }

  if (!hasFeature(feature)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// Usage limit indicator
interface UsageLimitProps {
  limitType: string;
  currentUsage: number;
  label: string;
}

export const UsageLimit: React.FC<UsageLimitProps> = ({
  limitType,
  currentUsage,
  label
}) => {
  const { getLimit } = useSubscription();
  const limit = getLimit(limitType);
  const isUnlimited = limit === Infinity;
  const percentage = isUnlimited ? 0 : (currentUsage / limit) * 100;
  const isNearLimit = percentage > 80;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className={`font-medium ${isNearLimit ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
          {isUnlimited ? `${currentUsage} / Unlimited` : `${currentUsage} / ${limit}`}
        </span>
      </div>
      
      {!isUnlimited && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5 }}
            className={`h-2 rounded-full ${
              isNearLimit 
                ? 'bg-amber-500' 
                : percentage > 100 
                ? 'bg-red-500' 
                : 'bg-emerald-500'
            }`}
          />
        </div>
      )}
    </div>
  );
};