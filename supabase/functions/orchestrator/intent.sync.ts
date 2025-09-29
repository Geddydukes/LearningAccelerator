// Orchestrator v1.1 - Intent Sync
// POST /functions/v1/orchestrator/intent.sync
// Manages learning intents for users

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface IntentSyncRequest {
  track_label?: string;
  topic: string;
  depth: 'surface' | 'informed' | 'expert';
  end_goal: string;
  time_per_day_min: number;
  user_tz?: string;
  meta?: Record<string, any>;
}

interface IntentSyncResponse {
  intent_id: string;
  active: boolean;
  topic: string;
  depth: string;
  end_goal: string;
  time_per_day_min: number;
  user_tz: string;
  created_at: string;
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

    // Extract user_id from JWT (in production, you'd verify the JWT)
    // For now, we'll use a header or extract from the JWT payload
    const userId = req.headers.get('X-User-ID') || 'demo-user-id';
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: "User ID required" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" } 
      });
    }

    const body: IntentSyncRequest = await req.json();
    
    // Validate required fields
    if (!body.topic || !body.depth || !body.end_goal || !body.time_per_day_min) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: topic, depth, end_goal, time_per_day_min" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" } 
      });
    }

    // Validate depth enum
    if (!['surface', 'informed', 'expert'].includes(body.depth)) {
      return new Response(JSON.stringify({ 
        error: "Invalid depth. Must be 'surface', 'informed', or 'expert'" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" } 
      });
    }

    // Validate time_per_day_min range
    if (body.time_per_day_min < 20 || body.time_per_day_min > 180) {
      return new Response(JSON.stringify({ 
        error: "time_per_day_min must be between 20 and 180 minutes" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" } 
      });
    }

    // Deactivate previous active intents for this user
    await supabase.rpc('deactivate_previous_intents', {
      p_user_id: userId,
      p_new_intent_id: '00000000-0000-0000-0000-000000000000' // Placeholder
    });

    // Create new intent
    const { data: newIntent, error: insertError } = await supabase
      .from('learning_intents')
      .insert({
        user_id: userId,
        track_label: body.track_label || null,
        topic: body.topic,
        depth: body.depth,
        end_goal: body.end_goal,
        time_per_day_min: body.time_per_day_min,
        user_tz: body.user_tz || 'UTC',
        meta: body.meta || {},
        active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating intent:", insertError);
      return new Response(JSON.stringify({ 
        error: "Failed to create learning intent" 
      }), { 
        status: 500,
        headers: { "content-type": "application/json" } 
      });
    }

    // Log the intent creation event
    await supabase
      .from('events')
      .insert({
        user_id: userId,
        type: 'intent_created',
        payload: {
          intent_id: newIntent.id,
          topic: newIntent.topic,
          depth: newIntent.depth,
          end_goal: newIntent.end_goal,
          time_per_day_min: newIntent.time_per_day_min
        }
      });

    // Emit realtime notification
    await supabase.channel('wisely.events').send({
      type: 'broadcast',
      event: 'intent_created',
      payload: {
        user_id: userId,
        intent_id: newIntent.id,
        topic: newIntent.topic,
        depth: newIntent.depth
      }
    });

    const response: IntentSyncResponse = {
      intent_id: newIntent.id,
      active: newIntent.active,
      topic: newIntent.topic,
      depth: newIntent.depth,
      end_goal: newIntent.end_goal,
      time_per_day_min: newIntent.time_per_day_min,
      user_tz: newIntent.user_tz,
      created_at: newIntent.created_at
    };

    console.log(`Intent created for user ${userId}: ${newIntent.topic} (${newIntent.depth})`);

    return new Response(JSON.stringify(response), { 
      headers: { "content-type": "application/json" } 
    });

  } catch (error) {
    console.error("Intent sync error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: String(error) 
    }), { 
      status: 500,
      headers: { "content-type": "application/json" } 
    });
  }
}); 