// Deno Edge Function - Orchestrator Worker
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_LEASE = 30_000; // 30s
const BATCH = 10;

interface JobQueue {
  job_id: string;
  workflow_run_id: string;
  step_id: string;
  user_id: string;
  intent_id?: string;
  payload: any;
  status: string;
  priority: number;
  lease_until: string;
  attempts: number;
  max_attempts: number;
  next_run_at: string;
  created_at: string;
  updated_at: string;
}

interface JobAttempt {
  attempt_id: string;
  job_id: string;
  started_at: string;
  finished_at?: string;
  success?: boolean;
  status_code?: number;
  error_text?: string;
  logs: any[];
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lease jobs
    const { data: jobs, error: leaseError } = await supabase.rpc("lease_jobs", { 
      p_now: new Date().toISOString(), 
      p_limit: BATCH 
    });

    if (leaseError) {
      console.error("Error leasing jobs:", leaseError);
      return new Response(JSON.stringify({ error: "Failed to lease jobs" }), { 
        status: 500,
        headers: { "content-type": "application/json" } 
      });
    }

    if (!jobs?.length) {
      return new Response(JSON.stringify({ leased: 0, message: "No jobs available" }), { 
        headers: { "content-type": "application/json" } 
      });
    }

    const results = [];
    for (const job of jobs as JobQueue[]) {
      const attemptStart = new Date().toISOString();
      
      try {
        // Parse the call path and method from payload
        const { call_path, method = "POST", body } = job.payload;
        
        if (!call_path) {
          throw new Error("Missing call_path in job payload");
        }

        // Call the target endpoint
        const targetUrl = new URL(call_path, Deno.env.get("EDGE_BASE_URL") || "http://localhost:54321").toString();
        
        const resp = await fetch(targetUrl, {
          method: method,
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${Deno.env.get("EDGE_SERVICE_JWT")}`,
            "x-idempotency-key": `${job.workflow_run_id}-${job.step_id}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const ok = resp.ok;
        const status = resp.status;
        const responseBody = await safeJson(resp);

        // Log the attempt
        await supabase.rpc("finish_job_attempt", {
          p_job_id: job.job_id,
          p_success: ok,
          p_status_code: status,
          p_error: ok ? null : JSON.stringify(responseBody),
          p_attempt_started: attemptStart
        });

        results.push({ 
          job_id: job.job_id, 
          step_id: job.step_id,
          ok, 
          status,
          response: responseBody 
        });

        console.log(`Job ${job.job_id} (${job.step_id}) completed with status ${status}`);

      } catch (e) {
        console.error(`Error processing job ${job.job_id}:`, e);
        
        await supabase.rpc("finish_job_attempt", {
          p_job_id: job.job_id,
          p_success: false,
          p_status_code: 599,
          p_error: String(e),
          p_attempt_started: attemptStart
        });
        
        results.push({ 
          job_id: job.job_id, 
          step_id: job.step_id,
          ok: false, 
          status: 599, 
          error: String(e) 
        });
      }
    }

    return new Response(JSON.stringify({ 
      leased: jobs.length, 
      results,
      timestamp: new Date().toISOString()
    }), { 
      headers: { "content-type": "application/json" } 
    });

  } catch (error) {
    console.error("Worker error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal worker error", 
      details: String(error) 
    }), { 
      status: 500,
      headers: { "content-type": "application/json" } 
    });
  }
});

async function safeJson(resp: Response) {
  try { 
    return await resp.json(); 
  } catch { 
    return { text: await resp.text().catch(() => "") }; 
  }
} 