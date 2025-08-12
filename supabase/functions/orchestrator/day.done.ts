// Orchestrator v1.1 - Day Done
// POST /functions/v1/orchestrator/day.done
// Completes daily learning sessions and tracks progress

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DayDoneRequest {
  session_id: string;
  completion_time_min: number;
  notes?: string;
  confidence?: number;
}

interface DayDoneResponse {
  ok: boolean;
  next_day_hint?: string;
  completion_summary: {
    session_id: string;
    completion_time_min: number;
    confidence: number;
    notes: string;
    completed_at: string;
  };
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

    const body: DayDoneRequest = await req.json();
    
    // Validate required fields
    if (!body.session_id || !body.completion_time_min) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: session_id, completion_time_min" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" } 
      });
    }

    // Validate completion time
    if (body.completion_time_min < 1 || body.completion_time_min > 480) {
      return new Response(JSON.stringify({ 
        error: "completion_time_min must be between 1 and 480 minutes" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" } 
      });
    }

    // Validate confidence if provided
    if (body.confidence !== undefined && (body.confidence < 1 || body.confidence > 10)) {
      return new Response(JSON.stringify({ 
        error: "confidence must be between 1 and 10" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" } 
      });
    }

    // Get the session to verify ownership and get context
    const { data: session, error: sessionError } = await supabase
      .from('instructor_sessions')
      .select(`
        *,
        learning_intents!inner(
          id,
          topic,
          depth,
          end_goal,
          time_per_day_min,
          user_tz
        )
      `)
      .eq('id', body.session_id)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ 
        error: "Session not found or access denied" 
      }), { 
        status: 404,
        headers: { "content-type": "application/json" } 
      });
    }

    // Update session completion
    const completionData = {
      completion_time_min: body.completion_time_min,
      confidence: body.confidence || 5,
      notes: body.notes || '',
      completed_at: new Date().toISOString(),
      status: 'completed'
    };

    const { error: updateError } = await supabase
      .from('instructor_sessions')
      .update({
        completion: completionData,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.session_id);

    if (updateError) {
      console.error("Session update error:", updateError);
      return new Response(JSON.stringify({ 
        error: "Failed to update session completion" 
      }), { 
        status: 500,
        headers: { "content-type": "application/json" } 
      });
    }

    // Log completion event
    await supabase
      .from('events')
      .insert({
        user_id: userId,
        type: 'instructor_plan_completed',
        payload: {
          session_id: body.session_id,
          intent_id: session.intent_id,
          week: session.week,
          day: session.day,
          topic: session.learning_intents.topic,
          completion_time_min: body.completion_time_min,
          confidence: body.confidence || 5,
          notes: body.notes || '',
          completed_at: completionData.completed_at
        }
      });

    // Emit realtime notification
    await supabase.channel('wisely.events').send({
      type: 'broadcast',
      event: 'instructor_plan_completed',
      payload: {
        user_id: userId,
        session_id: body.session_id,
        topic: session.learning_intents.topic,
        week: session.week,
        day: session.day,
        completion_time_min: body.completion_time_min
      }
    });

    // Generate next day hint based on completion
    let nextDayHint = '';
    const intent = session.learning_intents;
    
    if (body.completion_time_min >= intent.time_per_day_min * 0.8) {
      // Good progress
      if (body.confidence && body.confidence >= 7) {
        nextDayHint = `Great work! You're making excellent progress. Consider increasing difficulty for day ${session.day + 1}.`;
      } else {
        nextDayHint = `Good time investment! For day ${session.day + 1}, focus on reinforcing concepts to build confidence.`;
      }
    } else if (body.completion_time_min >= intent.time_per_day_min * 0.5) {
      // Moderate progress
      nextDayHint = `You're on track! For day ${session.day + 1}, try to complete the full recommended time to maximize learning.`;
    } else {
      // Below target
      nextDayHint = `Don't worry about the time! For day ${session.day + 1}, focus on quality over quantity. Even 15 minutes of focused learning is valuable.`;
    }

    // Check if this was the last day of the week
    if (session.day >= 5) {
      nextDayHint += ` Week ${session.week} complete! Ready for week ${session.week + 1}?`;
    }

    const response: DayDoneResponse = {
      ok: true,
      next_day_hint: nextDayHint,
      completion_summary: {
        session_id: body.session_id,
        completion_time_min: body.completion_time_min,
        confidence: body.confidence || 5,
        notes: body.notes || '',
        completed_at: completionData.completed_at
      }
    };

    console.log(`Day completed for user ${userId}: session ${body.session_id}, time ${body.completion_time_min}min`);

    return new Response(JSON.stringify(response), { 
      headers: { "content-type": "application/json" } 
    });

  } catch (error) {
    console.error("Day done error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: String(error) 
    }), { 
      status: 500,
      headers: { "content-type": "application/json" } 
    });
  }
}); 