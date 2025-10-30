import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getCurrentStreaks,
  getStreakHistory,
  getUserProfile,
  getXPProgress,
  XP_REWARDS,
  type CurrentStreak,
  type StreakData,
} from '../lib/gamify/logStreak';
import { DatabaseService } from '../lib/database';

interface GamificationSnapshot {
  xp: number;
  level: number;
  xpProgress: number;
  streaks: CurrentStreak[];
  streakHistory: StreakData[];
  recentActivities: number;
  agentActivity: Record<string, number>;
}

export const useGamificationMetrics = () => {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<GamificationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSnapshot(null);
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [profile, streaks, history, recentStreaks] = await Promise.all([
          getUserProfile(user.id),
          getCurrentStreaks(user.id),
          getStreakHistory(user.id, 30),
          DatabaseService.getStreakActivity(user.id, 7),
        ]);

        if (!active) return;

        const xp = profile?.xp ?? 0;
        const level = profile?.level ?? 1;
        const xpProgress = getXPProgress(xp);

        const recentActivities = recentStreaks.length;
        const agentActivity = recentStreaks.reduce<Record<string, number>>((acc, entry) => {
          acc[entry.agent] = (acc[entry.agent] ?? 0) + 1;
          return acc;
        }, {});

        setSnapshot({
          xp,
          level,
          xpProgress,
          streaks,
          streakHistory: history,
          recentActivities,
          agentActivity,
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [user]);

  const achievements = useMemo(() => {
    if (!snapshot) return [] as string[];

    const badges: string[] = [];
    if (snapshot.streaks.some(streak => streak.current_streak_days >= 7)) {
      badges.push('Momentum Keeper');
    }
    if ((snapshot.agentActivity['TA'] ?? 0) >= 3) {
      badges.push('TA Collaborator');
    }
    if ((snapshot.agentActivity['Project'] ?? 0) >= 2) {
      badges.push('Hybrid Builder');
    }
    return badges;
  }, [snapshot]);

  return {
    snapshot,
    achievements,
    loading,
    xpRewardTable: XP_REWARDS,
  };
};
