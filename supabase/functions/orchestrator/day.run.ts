// Orchestrator v1.1 - Day Run
// POST /functions/v1/orchestrator/day.run
// Executes daily learning plans with agent signal aggregation

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { agentClient } from "../_shared/agentClients.ts";

interface DayRunRequest {
  week?: number;
  day?: number;
  force_refresh?: boolean;
}

interface DayRunResponse {
  session_id: string;
  plan_md: string;
  plan_json_summary: any;
  degraded_mode: boolean;
  cache_hits: number;
  cache_misses: number;
  signal_quality: Record<string, any>;
}

serve(async (req) => {
  try {
    // Only allow POST
    if (req.method !== "POST") {
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

    const body: DayRunRequest = await req.json();
    const week = body.week || 1;
    const day = body.day || 1;
    const forceRefresh = body.force_refresh || false;

    // Get active intent for user
    const { data: activeIntent, error: intentError } = await supabase.rpc(
      'get_active_intent',
      { p_user_id: userId }
    );

    if (intentError || !activeIntent) {
      return new Response(JSON.stringify({ 
        error: "No active learning intent found. Please run Clarifier first.",
        code: "NO_ACTIVE_INTENT"
      }), { 
        status: 409,
        headers: { "content-type": "application/json" } 
      });
    }

    // Get cached signals if not forcing refresh
    let cachedSignals = null;
    if (!forceRefresh) {
      const { data: cacheEntry } = await supabase
        .from('agent_signals_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('week', week)
        .eq('day', day)
        .eq('topic', activeIntent.topic)
        .single();

      if (cacheEntry) {
        cachedSignals = cacheEntry;
      }
    }

    // Get fresh signals from all agents in parallel
    const startTime = Date.now();
    const signalResult = await agentClient.getAllSignals(
      userId,
      activeIntent.topic,
      week,
      day,
      cachedSignals
    );

    // Update cache with new signals
    const { error: cacheError } = await supabase
      .from('agent_signals_cache')
      .upsert({
        user_id: userId,
        week,
        day,
        topic: activeIntent.topic,
        clo: signalResult.signals.clo,
        alex: signalResult.signals.alex,
        ta: signalResult.signals.ta,
        socratic: signalResult.signals.socratic,
        freshness: signalResult.freshness,
        etag: signalResult.etags
      });

    if (cacheError) {
      console.error("Cache update error:", cacheError);
    }

    // Determine signal quality and degraded mode
    const signalQuality = {
      clo: { available: !!signalResult.signals.clo, fresh: !signalResult.freshness.clo?.is_stale },
      alex: { available: !!signalResult.signals.alex, fresh: !signalResult.freshness.alex?.is_stale },
      ta: { available: !!signalResult.signals.ta, fresh: !signalResult.freshness.ta?.is_stale },
      socratic: { available: !!signalResult.signals.socratic, fresh: !signalResult.freshness.socratic?.is_stale }
    };

    const degradedMode = Object.values(signalQuality).some(agent => !agent.available);

    // Prepare InstructorAgent payload
    const instructorPayload = {
      USER_ID: userId,
      USER_TZ: activeIntent.user_tz,
      TOPIC: activeIntent.topic,
      DEPTH: activeIntent.depth,
      END_GOAL: activeIntent.end_goal,
      TIME_PER_DAY_MIN: activeIntent.time_per_day_min,
      WEEK: week,
      DAY: day,
      CLARIFIER_TOPIC_SPEC: activeIntent.meta,
      JWT: authHeader.replace('Bearer ', ''),
      SIGNALS: {
        CLO: signalResult.signals.clo,
        ALEX: signalResult.signals.alex,
        TA: signalResult.signals.ta,
        SOCRATIC: signalResult.signals.socratic
      },
      SIGNAL_QUALITY: signalQuality,
      CACHE_STATS: {
        hits: signalResult.cache_hits,
        misses: signalResult.cache_misses
      }
    };

    // Call InstructorAgent with timeout
    const instructorStartTime = Date.now();
    let instructorResponse;
    let researchSummary = null;

    try {
      const instructorResult = await fetch(
        `${Deno.env.get('EDGE_BASE_URL')}/functions/v1/agent-proxy/instructor/daily`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('EDGE_SERVICE_JWT')}`,
            'X-Idempotency-Key': `${userId}-${week}-${day}-${Date.now()}`
          },
          body: JSON.stringify(instructorPayload),
          signal: AbortSignal.timeout(30000) // 30s timeout
        }
      );

      if (instructorResult.ok) {
        instructorResponse = await instructorResult.json();
        researchSummary = instructorResponse.research_summary;
      } else {
        throw new Error(`InstructorAgent failed: ${instructorResult.status}`);
      }
    } catch (error) {
      console.error("InstructorAgent error:", error);
      
      // Fallback to degraded mode
      instructorResponse = {
        plan_md: `# Fallback Learning Plan\n\nDue to technical difficulties, we're using cached information.\n\n**Topic:** ${activeIntent.topic}\n**Goal:** ${activeIntent.end_goal}\n\nPlease try again later for a full plan.`,
        plan_json: {
          title: "Fallback Plan",
          description: "Using cached information due to technical difficulties",
          steps: ["Review previous materials", "Continue with last known progress", "Try again later for fresh plan"]
        }
      };
    }

    const instructorTime = Date.now() - instructorStartTime;
    const totalTime = Date.now() - startTime;

    // Persist instructor session
    const { data: session, error: sessionError } = await supabase
      .from('instructor_sessions')
      .insert({
        user_id: userId,
        intent_id: activeIntent.id,
        week,
        day,
        plan_json: instructorResponse.plan_json,
        plan_md: instructorResponse.plan_md,
        signal_quality: signalQuality,
        research_summary: researchSummary,
        degraded_mode: degradedMode
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return new Response(JSON.stringify({ 
        error: "Failed to create instructor session" 
      }), { 
        status: 500,
        headers: { "content-type": "application/json" } 
      });
    }

    // Log events
    await supabase
      .from('events')
      .insert({
        user_id: userId,
        type: 'instructor_plan_created',
        payload: {
          session_id: session.id,
          intent_id: activeIntent.id,
          week,
          day,
          topic: activeIntent.topic,
          degraded_mode: degradedMode,
          execution_time_ms: totalTime,
          instructor_time_ms: instructorTime,
          cache_hits: signalResult.cache_hits,
          cache_misses: signalResult.cache_misses
        }
      });

    // Emit realtime notification
    await supabase.channel('wisely.events').send({
      type: 'broadcast',
      event: 'instructor_plan_created',
      payload: {
        user_id: userId,
        session_id: session.id,
        topic: activeIntent.topic,
        week,
        day,
        degraded_mode: degradedMode
      }
    });

    const response: DayRunResponse = {
      session_id: session.id,
      plan_md: instructorResponse.plan_md,
      plan_json_summary: instructorResponse.plan_json,
      degraded_mode: degradedMode,
      cache_hits: signalResult.cache_hits,
      cache_misses: signalResult.cache_misses,
      signal_quality
    };

    console.log(`Day run completed for user ${userId}: week ${week}, day ${day} in ${totalTime}ms`);

    return new Response(JSON.stringify(response), { 
      headers: { "content-type": "application/json" } 
    });

  } catch (error) {
    console.error("Day run error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: String(error) 
    }), { 
      status: 500,
      headers: { "content-type": "application/json" } 
    });
  }
}); 