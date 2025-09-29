// Orchestrator v1.1 - Status
// GET /functions/v1/orchestrator/status
// Returns latest session summary, signal freshness, and next scheduled run

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface StatusResponse {
  user_id: string;
  active_intent: {
    id: string;
    topic: string;
    depth: string;
    end_goal: string;
    time_per_day_min: number;
    user_tz: string;
    created_at: string;
  } | null;
  latest_session: {
    id: string;
    week: number;
    day: number;
    topic: string;
    plan_title: string;
    degraded_mode: boolean;
    created_at: string;
    completion?: {
      completion_time_min: number;
      confidence: number;
      notes: string;
      completed_at: string;
    };
  } | null;
  signal_freshness: {
    clo: { available: boolean; fresh: boolean; last_updated?: string };
    alex: { available: boolean; fresh: boolean; last_updated?: string };
    ta: { available: boolean; fresh: boolean; last_updated?: string };
    socratic: { available: boolean; fresh: boolean; last_updated?: string };
  };
  next_scheduled_run: {
    week: number;
    day: number;
    estimated_time: string;
    timezone: string;
  };
  learning_stats: {
    total_sessions: number;
    completed_sessions: number;
    total_time_min: number;
    average_confidence: number;
    current_streak_days: number;
  };
}

serve(async (req) => {
  try {
    // Only allow GET
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ 
        error: "Method not allowed" 
      }), { 
        status: 405,
        headers: { "content-type": "application/json" } 
      });
    }

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: "Missing or invalid authorization header" 
      }), { 
        status: 401,
        headers: { "content-type": "application/json" } 
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract user_id from JWT
    const userId = req.headers.get('X-User-ID') || 'demo-user-id';
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: "User ID required" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" } 
      });
    }

    // Get active intent
    const { data: activeIntent } = await supabase.rpc(
      'get_active_intent',
      { p_user_id: userId }
    );

    if (!activeIntent) {
      return new Response(JSON.stringify({
        user_id: userId,
        active_intent: null,
        latest_session: null,
        signal_freshness: {
          clo: { available: false, fresh: false },
          alex: { available: false, fresh: false },
          ta: { available: false, fresh: false },
          socratic: { available: false, fresh: false }
        },
        next_scheduled_run: null,
        learning_stats: {
          total_sessions: 0,
          completed_sessions: 0,
          total_time_min: 0,
          average_confidence: 0,
          current_streak_days: 0
        }
      }), { 
        headers: { "content-type": "application/json" } 
      });
    }

    // Get latest session
    const { data: latestSession } = await supabase
      .from('instructor_sessions')
      .select(`
        id,
        week,
        day,
        plan_json,
        degraded_mode,
        created_at,
        completion
      `)
      .eq('user_id', userId)
      .eq('intent_id', activeIntent.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get signal freshness from cache
    const { data: latestCache } = await supabase
      .from('agent_signals_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('topic', activeIntent.topic)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const signalFreshness = {
      clo: { 
        available: !!latestCache?.clo, 
        fresh: !latestCache?.freshness?.clo?.is_stale,
        last_updated: latestCache?.freshness?.clo?.last_updated
      },
      alex: { 
        available: !!latestCache?.alex, 
        fresh: !latestCache?.freshness?.alex?.is_stale,
        last_updated: latestCache?.freshness?.alex?.last_updated
      },
      ta: { 
        available: !!latestCache?.ta, 
        fresh: !latestCache?.freshness?.ta?.is_stale,
        last_updated: latestCache?.freshness?.ta?.last_updated
      },
      socratic: { 
        available: !!latestCache?.socratic, 
        fresh: !latestCache?.freshness?.socratic?.is_stale,
        last_updated: latestCache?.freshness?.socratic?.last_updated
      }
    };

    // Calculate next scheduled run
    let nextWeek = 1;
    let nextDay = 1;
    
    if (latestSession) {
      if (latestSession.day < 5) {
        nextWeek = latestSession.week;
        nextDay = latestSession.day + 1;
      } else {
        nextWeek = latestSession.week + 1;
        nextDay = 1;
      }
    }

    // Get user's timezone
    const userTz = activeIntent.user_tz || 'UTC';
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: userTz }));
    
    // Estimate next run time (next day at 7 AM user time)
    const nextRunDate = new Date(userTime);
    nextRunDate.setDate(nextRunDate.getDate() + 1);
    nextRunDate.setHours(7, 0, 0, 0);

    const nextScheduledRun = {
      week: nextWeek,
      day: nextDay,
      estimated_time: nextRunDate.toISOString(),
      timezone: userTz
    };

    // Get learning statistics
    const { data: sessions } = await supabase
      .from('instructor_sessions')
      .select('completion')
      .eq('user_id', userId)
      .eq('intent_id', activeIntent.id)
      .not('completion', 'is', null);

    const totalSessions = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.completion?.status === 'completed').length || 0;
    const totalTimeMin = sessions?.reduce((sum, s) => sum + (s.completion?.completion_time_min || 0), 0) || 0;
    const averageConfidence = sessions?.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.completion?.confidence || 5), 0) / sessions.length 
      : 0;

    // Calculate current streak (simplified - in production you'd want more sophisticated logic)
    let currentStreakDays = 0;
    if (sessions && sessions.length > 0) {
      const sortedSessions = sessions
        .filter(s => s.completion?.status === 'completed')
        .sort((a, b) => new Date(b.completion.completed_at).getTime() - new Date(a.completion.completed_at).getTime());
      
      if (sortedSessions.length > 0) {
        const lastCompletion = new Date(sortedSessions[0].completion.completed_at);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
          currentStreakDays = 1;
          // Could add logic to count consecutive days
        }
      }
    }

    const learningStats = {
      total_sessions: totalSessions,
      completed_sessions: completedSessions,
      total_time_min: totalTimeMin,
      average_confidence: Math.round(averageConfidence * 10) / 10,
      current_streak_days: currentStreakDays
    };

    const response: StatusResponse = {
      user_id: userId,
      active_intent: {
        id: activeIntent.id,
        topic: activeIntent.topic,
        depth: activeIntent.depth,
        end_goal: activeIntent.end_goal,
        time_per_day_min: activeIntent.time_per_day_min,
        user_tz: activeIntent.user_tz,
        created_at: activeIntent.created_at
      },
      latest_session: latestSession ? {
        id: latestSession.id,
        week: latestSession.week,
        day: latestSession.day,
        topic: activeIntent.topic,
        plan_title: latestSession.plan_json?.title || 'Daily Learning Plan',
        degraded_mode: latestSession.degraded_mode,
        created_at: latestSession.created_at,
        completion: latestSession.completion
      } : null,
      signal_freshness: signalFreshness,
      next_scheduled_run: nextScheduledRun,
      learning_stats: learningStats
    };

    return new Response(JSON.stringify(response), { 
      headers: { "content-type": "application/json" } 
    });

  } catch (error) {
    console.error("Status error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: String(error) 
    }), { 
      status: 500,
      headers: { "content-type": "application/json" } 
    });
  }
}); 