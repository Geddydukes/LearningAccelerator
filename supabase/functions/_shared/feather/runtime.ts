import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  FeatherArtifact,
  FeatherPhase,
  FeatherRuntimeConfig,
  FeatherRunRequest,
  FeatherRunResult,
  FeatherTaskContext,
} from './types.ts';

const DEFAULT_CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function nowIso() {
  return new Date().toISOString();
}

function buildSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

interface HandleRequestOptions {
  onComplete?: (result: FeatherRunResult) => Promise<void> | void;
}

export function createFeatherRuntime(config: FeatherRuntimeConfig) {
  const corsHeaders = { ...DEFAULT_CORS, ...(config.corsHeaders ?? {}) };

  const executeRun = async (
    payload: FeatherRunRequest,
    options: HandleRequestOptions = {},
  ): Promise<{ ok: boolean; result: FeatherRunResult; error?: Error }> => {
    if (!payload?.userId || !payload?.action) {
      throw new Error('userId and action are required');
    }

    const runId = crypto.randomUUID();
    const supabase = config.getSupabaseClient ? config.getSupabaseClient() : buildSupabaseClient();
    const startedAt = nowIso();

    const phases: FeatherPhase[] = config.tasks.map((task) => ({
      id: task.phaseId,
      label: task.label ?? task.phaseId,
      status: 'pending',
      artifacts: [],
    }));

    const state: Record<string, unknown> = {};

    const log = (message: string, meta: Record<string, unknown> = {}) => {
      console.log(`[feather:${config.agentId}] ${message}`, meta);
    };

    const getPhaseById = (phaseId: FeatherPhase['id']) => {
      const phase = phases.find((p) => p.id === phaseId);
      if (!phase) {
        throw new Error(`Unknown phase ${phaseId}`);
      }
      return phase;
    };

    try {
      for (const task of config.tasks) {
        const phase = getPhaseById(task.phaseId);
        phase.status = 'running';
        phase.startedAt = nowIso();

        const context: FeatherTaskContext = {
          request: payload,
          phase,
          supabase,
          state,
          log,
          emitArtifact: (artifact: FeatherArtifact) => {
            phase.artifacts.push({ ...artifact, createdAt: artifact.createdAt ?? nowIso() });
          },
          setPhaseMeta: (meta: Record<string, unknown>) => {
            phase.meta = { ...(phase.meta ?? {}), ...meta };
          },
          setPhaseSummary: (summary: string) => {
            phase.summary = summary;
          },
        };

        await task.run(context);

        phase.status = 'completed';
        phase.completedAt = nowIso();
      }

      const result: FeatherRunResult = {
        runId,
        agentId: config.agentId,
        status: 'completed',
        startedAt,
        completedAt: nowIso(),
        action: payload.action,
        phases,
        state,
        instructorModifications: payload.instructorModifications,
      };

      await options.onComplete?.(result);

      return { ok: true, result };
    } catch (error) {
      const failedResult: FeatherRunResult = {
        runId,
        agentId: config.agentId,
        status: 'failed',
        startedAt,
        action: payload.action,
        phases,
        state,
        instructorModifications: payload.instructorModifications,
      };

      return { ok: false, result: failedResult, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  async function handleRequest(req: Request, options: HandleRequestOptions = {}) {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    let payload: FeatherRunRequest;

    try {
      payload = await req.json();
    } catch (error) {
      console.error(`[feather:${config.agentId}] Failed to parse request`, error);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      );
    }

    try {
      const { ok, result, error } = await executeRun(payload, options);

      if (!ok) {
        console.error(`[feather:${config.agentId}] runtime failure`, error);
        return new Response(
          JSON.stringify({ success: false, error: error?.message ?? 'Runtime failure', data: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } catch (error) {
      console.error(`[feather:${config.agentId}] unhandled runtime failure`, error);
      return new Response(
        JSON.stringify({ success: false, error: error.message ?? 'Runtime error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
      );
    }
  }

  return {
    handleRequest,
    execute: executeRun,
    corsHeaders,
  };
}
