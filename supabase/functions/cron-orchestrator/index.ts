// Deno Edge Function - Cron Orchestrator
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get current time and determine which workflows to trigger
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hour = now.getHours();

    const workflowsToTrigger: Array<{ key: string; users: string[] }> = [];

    // Weekly seed workflow (Sunday 6 PM UTC)
    if (dayOfWeek === 0 && hour === 18) {
      const { data: activeUsers } = await supabase
        .from('learning_intents')
        .select('user_id')
        .eq('status', 'in_progress')
        .not('user_id', 'is', null);

      if (activeUsers?.length) {
        const userIds = [...new Set(activeUsers.map(u => u.user_id))];
        workflowsToTrigger.push({
          key: 'weekly_seed_v1',
          users: userIds
        });
      }
    }

    // Daily instructor workflow (7 AM UTC)
    if (hour === 7) {
      const { data: activeUsers } = await supabase
        .from('learning_intents')
        .select('user_id')
        .eq('status', 'in_progress')
        .not('user_id', 'is', null);

      if (activeUsers?.length) {
        const userIds = [...new Set(activeUsers.map(u => u.user_id))];
        workflowsToTrigger.push({
          key: 'daily_instructor_v1',
          users: userIds
        });
      }
    }

    // Trigger workflows for each user
    const results = [];
    for (const workflow of workflowsToTrigger) {
      for (const userId of workflow.users) {
        try {
          const response = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/orchestrator/dispatch`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                user_id: userId,
                workflow_key: workflow.key,
                trigger_event_id: `cron_${now.toISOString()}`,
                payload: {
                  triggered_by: 'cron',
                  timestamp: now.toISOString()
                }
              })
            }
          );

          const result = await response.json();
          results.push({
            workflow: workflow.key,
            user_id: userId,
            success: response.ok,
            result
          });

          console.log(`Triggered ${workflow.key} for user ${userId}:`, result);

        } catch (error) {
          console.error(`Error triggering ${workflow.key} for user ${userId}:`, error);
          results.push({
            workflow: workflow.key,
            user_id: userId,
            success: false,
            error: String(error)
          });
        }
      }
    }

    return new Response(JSON.stringify({
      timestamp: now.toISOString(),
      workflows_triggered: workflowsToTrigger.length,
      total_users: workflowsToTrigger.reduce((sum, w) => sum + w.users.length, 0),
      results
    }), {
      headers: { "content-type": "application/json" }
    });

  } catch (error) {
    console.error("Cron orchestrator error:", error);
    return new Response(JSON.stringify({
      error: "Internal cron error",
      details: String(error)
    }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}); 