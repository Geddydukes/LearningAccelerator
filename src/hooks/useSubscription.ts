import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Plan {
  id: string;
  name: 'Free' | 'Pro' | 'Enterprise';
  display_name: string;
  description: string;
  price_monthly: number;
  price_annual?: number;
  features: Record<string, any>;
  limits: Record<string, any>;
}

interface Subscription {
  id: string;
  plan: Plan;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false;
    return subscription.plan.features[feature] === true;
  };

  const getLimit = (limitType: string): number => {
    if (!subscription) {
      // Free tier limits
      const freeLimits: Record<string, number> = {
        weekly_sessions: 2,
        socratic_messages: 50,
        code_reviews: 1,
        voice_synthesis: 0,
        storage_gb: 0.1,
        api_calls: 0
      };
      return freeLimits[limitType] || 0;
    }
    
    const limit = subscription.plan.limits[limitType];
    return limit === -1 ? Infinity : limit || 0;
  };

  const isPro = (): boolean => {
    return subscription?.plan.name === 'Pro' && subscription.status === 'active';
  };

  const isEnterprise = (): boolean => {
    return subscription?.plan.name === 'Enterprise' && subscription.status === 'active';
  };

  const isPaid = (): boolean => {
    return isPro() || isEnterprise();
  };

  return {
    subscription,
    loading,
    error,
    hasFeature,
    getLimit,
    isPro,
    isEnterprise,
    isPaid,
    refreshSubscription: fetchSubscription
  };
};