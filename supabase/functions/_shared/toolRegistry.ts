import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type ToolCallArgs = {
  userId: string;
  week?: number;
  day?: number;
  payload?: Record<string, unknown>;
  correlationId?: string;
  etagIfNoneMatch?: string;
};

export type ToolResult<TData = any> = {
  ok: boolean;
  data?: TData;
  error?: string;
  etag?: string;
  degraded?: boolean;
};

export interface Tool<TIn = any, TOut = any> {
  name: string;
  version: string;
  rateLimitPerMin: number;
  call: (args: ToolCallArgs & TIn) => Promise<ToolResult<TOut>>;
}

// Helper to call Edge Functions with proper error handling and ETag support
async function callEdgeTool(
  fnPath: string,
  body: Record<string, unknown>,
  etagIfNoneMatch?: string,
  correlationId?: string
): Promise<ToolResult<any>> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, error: 'Missing Supabase configuration' };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    };

    if (etagIfNoneMatch) {
      headers['If-None-Match'] = etagIfNoneMatch;
    }

    if (correlationId) {
      headers['x-correlation-id'] = correlationId;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/${fnPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 304) {
      return { ok: true, etag: etagIfNoneMatch };
    }

    const result = await response.json();
    const etag = response.headers.get('etag');

    if (!response.ok) {
      return { 
        ok: false, 
        error: result.error || `HTTP ${response.status}`,
        degraded: response.status >= 500
      };
    }

    return { 
      ok: true, 
      data: result.data || result,
      etag: etag || undefined
    };
  } catch (error) {
    return { 
      ok: false, 
      error: error.message,
      degraded: true
    };
  }
}

// Tool Registry - wraps existing agents as typed tools
export const toolRegistry = {
  // CLO Tools
  clo: {
    name: 'CLO',
    version: '3.1',
    rateLimitPerMin: 4,
    call: async (args: ToolCallArgs & {
      action: 'PROGRAM_PLAN_CREATE' | 'PROGRAM_PLAN_ACCEPT' | 'WEEKLY_PLAN_CREATE';
      intentObject?: any;
      programDurationWeeks?: number;
      programPlanId?: string;
      programVersion?: string;
      weekNumber?: number;
      priorPerformanceSummary?: any;
    }) => {
      const { action, intentObject, programDurationWeeks, programPlanId, programVersion, weekNumber, priorPerformanceSummary, ...baseArgs } = args;
      
      const payload = {
        action,
        ...(intentObject && { intentObject }),
        ...(programDurationWeeks && { programDurationWeeks }),
        ...(programPlanId && { programPlanId }),
        ...(programVersion && { programVersion }),
        ...(weekNumber && { weekNumber }),
        ...(priorPerformanceSummary && { priorPerformanceSummary }),
      };

      return callEdgeTool('clo-agent', {
        action,
        payload,
        userId: baseArgs.userId,
      }, baseArgs.etagIfNoneMatch, baseArgs.correlationId);
    }
  } as Tool,

  // Instructor Tools
  instructor: {
    name: 'Instructor',
    version: '2.2',
    rateLimitPerMin: 4,
    call: async (args: ToolCallArgs & {
      mode: 'DELIVER_LECTURE' | 'CHECK_COMPREHENSION' | 'MODIFY_PRACTICE_PROMPTS' | 'DAILY_REFLECTION';
      weeklyPlanSnapshot?: any;
      learnerProfile?: any;
      checkResults?: any;
      todayTelemetry?: any;
    }) => {
      const { mode, weeklyPlanSnapshot, learnerProfile, checkResults, todayTelemetry, ...baseArgs } = args;
      
      const payload = {
        mode,
        ...(weeklyPlanSnapshot && { weeklyPlanSnapshot }),
        ...(learnerProfile && { learnerProfile }),
        ...(checkResults && { checkResults }),
        ...(todayTelemetry && { todayTelemetry }),
      };

      return callEdgeTool('instructor-agent', {
        action: mode,
        payload,
        userId: baseArgs.userId,
      }, baseArgs.etagIfNoneMatch, baseArgs.correlationId);
    }
  } as Tool,

  // TA Tools
  ta: {
    name: 'TA',
    version: '1.5',
    rateLimitPerMin: 6,
    call: async (args: ToolCallArgs & {
      mode: 'PREP_EXERCISES' | 'PROVIDE_HINT' | 'EVALUATE_PRACTICE' | 'FORWARD_BLOCKERS';
      taBasePrompt?: any;
      instructorMods?: any;
      exerciseContext?: any;
      submission?: any;
      rubricLight?: any;
      blockers?: string[];
    }) => {
      const { mode, taBasePrompt, instructorMods, exerciseContext, submission, rubricLight, blockers, ...baseArgs } = args;
      
      const payload = {
        mode,
        ...(taBasePrompt && { taBasePrompt }),
        ...(instructorMods && { instructorMods }),
        ...(exerciseContext && { exerciseContext }),
        ...(submission && { submission }),
        ...(rubricLight && { rubricLight }),
        ...(blockers && { blockers }),
      };

      return callEdgeTool('ta-agent', {
        action: mode,
        payload,
        userId: baseArgs.userId,
      }, baseArgs.etagIfNoneMatch, baseArgs.correlationId);
    }
  } as Tool,

  // Socratic Tools
  socratic: {
    name: 'Socratic',
    version: '3.1',
    rateLimitPerMin: 8,
    call: async (args: ToolCallArgs & {
      mode: 'START_DIALOG' | 'CONTINUE_DIALOG' | 'SUMMARIZE_GAPS';
      socraticBasePrompt?: any;
      instructorMods?: any;
      dialogContext?: any;
      learnerMessage?: string;
      dialogTranscript?: any[];
    }) => {
      const { mode, socraticBasePrompt, instructorMods, dialogContext, learnerMessage, dialogTranscript, ...baseArgs } = args;
      
      const payload = {
        mode,
        ...(socraticBasePrompt && { socraticBasePrompt }),
        ...(instructorMods && { instructorMods }),
        ...(dialogContext && { dialogContext }),
        ...(learnerMessage && { learnerMessage }),
        ...(dialogTranscript && { dialogTranscript }),
      };

      return callEdgeTool('socratic-agent', {
        action: mode,
        payload,
        userId: baseArgs.userId,
      }, baseArgs.etagIfNoneMatch, baseArgs.correlationId);
    }
  } as Tool,

  // Alex Tools
  alex: {
    name: 'Alex',
    version: '3.1',
    rateLimitPerMin: 3,
    call: async (args: ToolCallArgs & {
      mode: 'PRECHECK' | 'FINAL_GRADE';
      submission?: any;
      rubric?: any;
      weekRef?: any;
    }) => {
      const { mode, submission, rubric, weekRef, ...baseArgs } = args;
      
      const payload = {
        mode,
        ...(submission && { submission }),
        ...(rubric && { rubric }),
        ...(weekRef && { weekRef }),
      };

      return callEdgeTool('alex-agent', {
        action: mode,
        payload,
        userId: baseArgs.userId,
      }, baseArgs.etagIfNoneMatch, baseArgs.correlationId);
    }
  } as Tool,

  // Coding Workspace Tools
  codingWorkspace: {
    name: 'CodingWorkspace',
    version: '1.0',
    rateLimitPerMin: 10,
    call: async (args: ToolCallArgs & {
      action: 'START' | 'RUN' | 'ALEX_FINAL';
      language?: string;
      focusAreas?: string[];
      fs?: any[];
      tests?: boolean;
      rubric?: any;
    }) => {
      const { action, language, focusAreas, fs, tests, rubric, ...baseArgs } = args;
      
      const payload = {
        ...(language && { language }),
        ...(focusAreas && { focusAreas }),
        ...(fs && { fs }),
        ...(tests !== undefined && { tests }),
        ...(rubric && { rubric }),
      };

      return callEdgeTool(`coding-workspace/${action.toLowerCase()}`, {
        payload,
        userId: baseArgs.userId,
      }, baseArgs.etagIfNoneMatch, baseArgs.correlationId);
    }
  } as Tool,
};

// Helper to validate tool call results and extract structured data
export function parseToolResult<T>(result: ToolResult, expectedFields: string[]): T | null {
  if (!result.ok || !result.data) {
    return null;
  }

  const data = result.data;
  
  // Check if all expected fields are present
  const missingFields = expectedFields.filter(field => !(field in data));
  if (missingFields.length > 0) {
    console.warn(`Missing expected fields: ${missingFields.join(', ')}`);
    return null;
  }

  return data as T;
}

// Helper to extract telemetry from tool results
export function extractTelemetry(result: ToolResult): Record<string, any> {
  if (!result.ok || !result.data) {
    return {};
  }

  const data = result.data;
  const telemetry: Record<string, any> = {};

  // Extract common telemetry patterns
  if (data.telemetry) {
    Object.assign(telemetry, data.telemetry);
  }

  if (data.blockers) {
    telemetry.blockers = data.blockers;
  }

  if (data.mastery_estimate) {
    telemetry.mastery_estimate = data.mastery_estimate;
  }

  if (data.gaps_per_concept) {
    telemetry.gaps_per_concept = data.gaps_per_concept;
  }

  if (data.scorecard) {
    telemetry.scorecard = data.scorecard;
  }

  return telemetry;
}

// Agent event logging helper
export async function logAgentEvent(
  correlationId: string,
  userId: string,
  agent: string,
  tool: string,
  status: 'running' | 'completed' | 'failed',
  tokensIn: number = 0,
  tokensOut: number = 0,
  costEstimate: number = 0,
  errorMessage?: string
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceKey) {
    console.warn('Missing Supabase configuration for agent event logging');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    
    const eventData = {
      correlation_id: correlationId,
      user_id: userId,
      agent,
      tool,
      status,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_estimate: costEstimate,
      error_message: errorMessage,
      ended_at: status !== 'running' ? new Date().toISOString() : null,
    };

    if (status === 'running') {
      // Insert new event
      await supabase.from('agent_events').insert(eventData);
    } else {
      // Update existing event
      await supabase
        .from('agent_events')
        .update(eventData)
        .eq('correlation_id', correlationId)
        .eq('agent', agent)
        .eq('tool', tool)
        .eq('status', 'running');
    }
  } catch (error) {
    console.error('Failed to log agent event:', error);
  }
}