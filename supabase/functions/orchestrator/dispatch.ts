// Deno Edge Function - Orchestrator Dispatch
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DispatchRequest {
  user_id: string;
  intent_id?: string;
  workflow_key: string;
  trigger_event_id?: string;
  payload?: any;
}

interface WorkflowStep {
  id: string;
  call: string;
  method?: string;
  body?: any;
  body_from?: string;
  headers?: Record<string, string>;
  timeout_ms?: number;
  retry?: {
    max_attempts: number;
    backoff: string;
    base_ms: number;
  };
  fanout_of?: string | null;
  depends_on?: string[];
}

interface WorkflowSpec {
  key: string;
  trigger: {
    type: string;
    event_types?: string[];
    cron?: string;
  };
  steps: WorkflowStep[];
}

serve(async (req) => {
  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { 
        status: 405,
        headers: { "content-type": "application/json" } 
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: DispatchRequest = await req.json();
    
    // Validate required fields
    if (!body.user_id || !body.workflow_key) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: user_id, workflow_key" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" } 
      });
    }

    // Load workflow specification from Storage
    const workflowSpec = await loadWorkflowSpec(supabase, body.workflow_key);
    if (!workflowSpec) {
      return new Response(JSON.stringify({ 
        error: `Workflow not found: ${body.workflow_key}` 
      }), { 
        status: 404,
        headers: { "content-type": "application/json" } 
      });
    }

    // Create workflow run
    const { data: workflowRun, error: runError } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_key: body.workflow_key,
        user_id: body.user_id,
        intent_id: body.intent_id,
        trigger_event_id: body.trigger_event_id,
        status: 'running'
      })
      .select()
      .single();

    if (runError) {
      console.error("Error creating workflow run:", runError);
      return new Response(JSON.stringify({ 
        error: "Failed to create workflow run" 
      }), { 
        status: 500,
        headers: { "content-type": "application/json" } 
      });
    }

    // Enqueue initial steps
    const initialSteps = workflowSpec.steps.filter(step => 
      !step.depends_on || step.depends_on.length === 0
    );

    const jobInserts = initialSteps.map(step => ({
      workflow_run_id: workflowRun.workflow_run_id,
      step_id: step.id,
      user_id: body.user_id,
      intent_id: body.intent_id,
      payload: {
        call_path: step.call,
        method: step.method || 'POST',
        body: step.body || body.payload,
        headers: step.headers,
        timeout_ms: step.timeout_ms,
        retry: step.retry,
        depends_on: step.depends_on
      },
      status: 'queued',
      priority: 100,
      attempts: 0,
      max_attempts: step.retry?.max_attempts || 5
    }));

    const { error: jobError } = await supabase
      .from('job_queue')
      .insert(jobInserts);

    if (jobError) {
      console.error("Error enqueueing jobs:", jobError);
      // Clean up the workflow run
      await supabase
        .from('workflow_runs')
        .delete()
        .eq('workflow_run_id', workflowRun.workflow_run_id);
      
      return new Response(JSON.stringify({ 
        error: "Failed to enqueue jobs" 
      }), { 
        status: 500,
        headers: { "content-type": "application/json" } 
      });
    }

    // Log the dispatch event
    await supabase
      .from('intent_events')
      .insert({
        user_id: body.user_id,
        intent_id: body.intent_id,
        type: `workflow_dispatched:${body.workflow_key}`,
        payload: {
          workflow_run_id: workflowRun.workflow_run_id,
          steps_count: initialSteps.length,
          workflow_spec: workflowSpec.key
        }
      });

    console.log(`Workflow ${body.workflow_key} dispatched for user ${body.user_id}, run ${workflowRun.workflow_run_id}`);

    return new Response(JSON.stringify({
      workflow_run_id: workflowRun.workflow_run_id,
      status: 'dispatched',
      steps_enqueued: initialSteps.length,
      workflow_key: body.workflow_key
    }), { 
      headers: { "content-type": "application/json" } 
    });

  } catch (error) {
    console.error("Dispatch error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal dispatch error", 
      details: String(error) 
    }), { 
      status: 500,
      headers: { "content-type": "application/json" } 
    });
  }
});

async function loadWorkflowSpec(supabase: any, workflowKey: string): Promise<WorkflowSpec | null> {
  try {
    // Try to load from Storage first
    const { data: storageData, error: storageError } = await supabase.storage
      .from('workflows')
      .download(`${workflowKey}.yml`);

    if (storageData && !storageError) {
      const yamlText = await storageData.text();
      return parseWorkflowYaml(yamlText);
    }

    // Fallback to hardcoded workflows
    return getHardcodedWorkflow(workflowKey);

  } catch (error) {
    console.error(`Error loading workflow ${workflowKey}:`, error);
    return getHardcodedWorkflow(workflowKey);
  }
}

function getHardcodedWorkflow(workflowKey: string): WorkflowSpec | null {
  const workflows: Record<string, WorkflowSpec> = {
    'daily_instructor_v1': {
      key: 'daily_instructor_v1',
      trigger: {
        type: 'cron_or_event',
        event_types: ['streak_ping', 'user_start_day'],
        cron: '0 7 * * *'
      },
      steps: [
        {
          id: 'gather_signals',
          call: '/functions/v1/agent-proxy/snapshot',
          method: 'GET',
          timeout_ms: 8000,
          retry: {
            max_attempts: 3,
            backoff: 'exp',
            base_ms: 1500
          }
        },
        {
          id: 'create_plan',
          call: '/functions/v1/agent-proxy/instructor/daily',
          method: 'POST',
          body_from: 'gather_signals',
          headers: {
            'X-Idempotency-Key': '${workflow_run_id}-create_plan'
          },
          timeout_ms: 15000,
          depends_on: ['gather_signals']
        },
        {
          id: 'notify',
          call: '/functions/v1/agent-proxy/notify',
          method: 'POST',
          body: {
            channel: 'inbox',
            message: 'Your plan is ready'
          },
          depends_on: ['create_plan']
        }
      ]
    },
    'weekly_seed_v1': {
      key: 'weekly_seed_v1',
      trigger: {
        type: 'cron',
        cron: '0 18 * * SUN'
      },
      steps: [
        {
          id: 'clo_begin_week',
          call: '/functions/v1/agent-proxy/clo/begin-week',
          method: 'POST'
        },
        {
          id: 'ta_generate_week',
          call: '/functions/v1/agent-proxy/ta/generate-week',
          method: 'POST',
          depends_on: ['clo_begin_week']
        },
        {
          id: 'socratic_seed',
          call: '/functions/v1/agent-proxy/socratic/seed',
          method: 'POST',
          depends_on: ['clo_begin_week']
        },
        {
          id: 'brand_ingest',
          call: '/functions/v1/agent-proxy/brand/update-briefing',
          method: 'POST',
          depends_on: ['ta_generate_week', 'socratic_seed']
        }
      ]
    }
  };

  return workflows[workflowKey] || null;
}

function parseWorkflowYaml(yamlText: string): WorkflowSpec | null {
  try {
    // Simple YAML parsing for basic workflow specs
    // In production, you might want to use a proper YAML parser
    const lines = yamlText.split('\n');
    const spec: Partial<WorkflowSpec> = {};
    
    // Basic parsing logic (simplified)
    // This is a placeholder - you'd want proper YAML parsing
    return spec as WorkflowSpec;
  } catch (error) {
    console.error("Error parsing YAML:", error);
    return null;
  }
} 