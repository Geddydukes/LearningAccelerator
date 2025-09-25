import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { toolRegistry, ToolCallArgs, ToolResult, parseToolResult, extractTelemetry } from "../_shared/toolRegistry.ts";

interface EventBody {
  event: string;
  userId: string;
  week?: number;
  day?: number;
  payload?: Record<string, unknown>;
  correlationId?: string;
  etagIfNoneMatch?: string;
}

interface EducationSession {
  id: string;
  user_id: string;
  week: number;
  day: number;
  phase: 'planning' | 'lecture' | 'check' | 'practice_prep' | 'practice' | 'reflect' | 'completed';
  artifacts: Record<string, unknown>;
  etag: string;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    if (req.method !== 'POST') return error('Method Not Allowed', 405);
    
    const body: EventBody = await req.json();
    if (!body?.userId) return error('Missing userId', 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const session = await getOrCreateSession(supabase, body);

    let result: ToolResult;
    switch (body.event) {
      case 'start_day':
        result = await handleStartDay(supabase, session, { userId: body.userId, week: body.week, day: body.day, payload: body.payload });
        break;
      case 'lecture_done':
        result = await handleLectureDone(supabase, session, { userId: body.userId, week: body.week, day: body.day, payload: body.payload });
        break;
      case 'check_done':
        result = await handleCheckDone(supabase, session, { userId: body.userId, week: body.week, day: body.day, payload: body.payload });
        break;
      case 'practice_ready':
        result = await handlePracticeReady(supabase, session, { userId: body.userId, week: body.week, day: body.day, payload: body.payload });
        break;
      case 'practice_done':
        result = await handlePracticeDone(supabase, session, { userId: body.userId, week: body.week, day: body.day, payload: body.payload });
        break;
      case 'reflect_done':
        result = await handleReflectDone(supabase, session, { userId: body.userId, week: body.week, day: body.day, payload: body.payload });
        break;
      default:
        return error(`Unknown event: ${body.event}`, 400);
    }

    if (result.ok && result.data) {
      await persistArtifacts(supabase, session, result.data);
    }

    return ok(result);

  } catch (error) {
    console.error('Education Agent error:', error);
    return error(error.message);
  }
});

// Event Handlers with proper tool parsing
async function handleStartDay(supabase: any, session: EducationSession, args: ToolCallArgs): Promise<ToolResult> {
  try {
    // Get or create Program Plan
    let programPlan = await getProgramPlan(supabase, args.userId);
    if (!programPlan) {
      const cloResult = await toolRegistry.clo.call({
        ...args,
        action: 'PROGRAM_PLAN_CREATE',
        intentObject: args.payload?.intentObject,
        programDurationWeeks: args.payload?.programDurationWeeks,
      });

      if (!cloResult.ok) return cloResult;
      programPlan = parseToolResult(cloResult, ['id', 'version', 'program_plan']);
    }

    // Create Weekly Plan
    const weeklyPlanResult = await toolRegistry.clo.call({
      ...args,
      action: 'WEEKLY_PLAN_CREATE',
      programPlanId: programPlan?.id,
      programVersion: programPlan?.version,
      weekNumber: args.week,
      priorPerformanceSummary: await getPriorPerformanceSummary(supabase, args.userId, args.week),
    });

    if (!weeklyPlanResult.ok) return weeklyPlanResult;
    const weeklyPlan = parseToolResult(weeklyPlanResult, ['weekly_plan']);

    // Start Instructor Lecture
    const lectureResult = await toolRegistry.instructor.call({
      ...args,
      mode: 'DELIVER_LECTURE',
      weeklyPlanSnapshot: weeklyPlan,
      learnerProfile: await getLearnerProfile(supabase, args.userId),
    });

    if (!lectureResult.ok) return lectureResult;
    const lecture = parseToolResult(lectureResult, ['lecture']);

    return {
      ok: true,
      data: {
        phase: 'lecture',
        programPlan,
        weeklyPlan,
        lecture,
        artifacts: { programPlan, weeklyPlan, lecture }
      },
      etag: generateETag(),
    };

  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleLectureDone(supabase: any, session: EducationSession, args: ToolCallArgs): Promise<ToolResult> {
  try {
    const checkResult = await toolRegistry.instructor.call({
      ...args,
      mode: 'CHECK_COMPREHENSION',
      weeklyPlanSnapshot: session.artifacts.weeklyPlan,
    });

    if (!checkResult.ok) return checkResult;
    const comprehensionCheck = parseToolResult(checkResult, ['checks']);

    return {
      ok: true,
      data: {
        phase: 'check',
        comprehensionCheck,
        artifacts: { ...session.artifacts, comprehensionCheck }
      },
      etag: generateETag(),
    };

  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleCheckDone(supabase: any, session: EducationSession, args: ToolCallArgs): Promise<ToolResult> {
  try {
    const modifyResult = await toolRegistry.instructor.call({
      ...args,
      mode: 'MODIFY_PRACTICE_PROMPTS',
      weeklyPlanSnapshot: session.artifacts.weeklyPlan,
      checkResults: args.payload?.checkResults,
    });

    if (!modifyResult.ok) return modifyResult;
    const modifiedPrompts = parseToolResult(modifyResult, ['modified_prompts']);

    return {
      ok: true,
      data: {
        phase: 'practice_prep',
        modifiedPrompts,
        artifacts: { ...session.artifacts, modifiedPrompts }
      },
      etag: generateETag(),
    };

  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handlePracticeReady(supabase: any, session: EducationSession, args: ToolCallArgs): Promise<ToolResult> {
  try {
    const practiceType = args.payload?.practiceType as 'ta' | 'socratic' | 'coding';
    
    if (practiceType === 'coding') {
      const codingResult = await toolRegistry.codingWorkspace.call({
        ...args,
        action: 'START',
        language: args.payload?.language,
        focusAreas: args.payload?.focusAreas,
      });

      if (!codingResult.ok) return codingResult;

      return {
        ok: true,
        data: {
          phase: 'practice',
          practiceType: 'coding',
          codingWorkspace: codingResult.data,
          artifacts: { ...session.artifacts, codingWorkspace: codingResult.data }
        },
        etag: generateETag(),
      };
    } else {
      const tool = practiceType === 'ta' ? toolRegistry.ta : toolRegistry.socratic;
      const mode = practiceType === 'ta' ? 'PREP_EXERCISES' : 'START_DIALOG';
      
      const practiceResult = await tool.call({
        ...args,
        mode: mode as any,
        taBasePrompt: session.artifacts.modifiedPrompts?.ta,
        socraticBasePrompt: session.artifacts.modifiedPrompts?.socratic,
        instructorMods: session.artifacts.modifiedPrompts,
      });

      if (!practiceResult.ok) return practiceResult;

      return {
        ok: true,
        data: {
          phase: 'practice',
          practiceType,
          practice: practiceResult.data,
          artifacts: { ...session.artifacts, [practiceType]: practiceResult.data }
        },
        etag: generateETag(),
      };
    }

  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handlePracticeDone(supabase: any, session: EducationSession, args: ToolCallArgs): Promise<ToolResult> {
  try {
    const practiceResults = args.payload?.practiceResults;
    const telemetry = extractTelemetryFromResults(practiceResults);

    return {
      ok: true,
      data: {
        phase: 'reflect',
        practiceResults,
        telemetry,
        artifacts: { ...session.artifacts, practiceResults, telemetry }
      },
      etag: generateETag(),
    };

  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleReflectDone(supabase: any, session: EducationSession, args: ToolCallArgs): Promise<ToolResult> {
  try {
    const reflectionResult = await toolRegistry.instructor.call({
      ...args,
      mode: 'DAILY_REFLECTION',
      todayTelemetry: args.payload?.telemetry,
    });

    if (!reflectionResult.ok) return reflectionResult;
    const reflection = parseToolResult(reflectionResult, ['reflection']);

    return {
      ok: true,
      data: {
        phase: 'completed',
        reflection,
        artifacts: { ...session.artifacts, reflection }
      },
      etag: generateETag(),
    };

  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// Helper Functions
async function getOrCreateSession(supabase: any, body: EventBody): Promise<EducationSession> {
  const { userId, week, day } = body;
  
  const { data: existingSession } = await supabase
    .from('education_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('week', week)
    .eq('day', day)
    .single();

  if (existingSession) return existingSession;

  const newSession = {
    user_id: userId,
    week: week || 1,
    day: day || 1,
    phase: 'planning' as const,
    artifacts: {},
    etag: generateETag(),
  };

  const { data: session, error } = await supabase
    .from('education_sessions')
    .insert(newSession)
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return session;
}

async function persistArtifacts(supabase: any, session: EducationSession, artifacts: Record<string, unknown>) {
  const { error } = await supabase
    .from('education_sessions')
    .update({
      artifacts: { ...session.artifacts, ...artifacts },
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  if (error) console.error('Failed to persist artifacts:', error);
}

async function getProgramPlan(supabase: any, userId: string) {
  const { data } = await supabase
    .from('program_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('accepted', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

async function getPriorPerformanceSummary(supabase: any, userId: string, week: number) {
  const { data: sessions } = await supabase
    .from('education_sessions')
    .select('artifacts')
    .eq('user_id', userId)
    .lt('week', week)
    .order('week', { ascending: false })
    .limit(5);

  const summary = {
    instructor_hints: [],
    socratic_mastery: {},
    ta_blockers: [],
    alex_scorecard: { score: 0, gaps: [] },
    time_used_min: 0,
    degraded_days_count: 0,
  };

  sessions?.forEach(session => {
    if (session.artifacts.telemetry) {
      Object.assign(summary, session.artifacts.telemetry);
    }
  });

  return summary;
}

async function getLearnerProfile(supabase: any, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

function extractTelemetryFromResults(results: any): Record<string, any> {
  const telemetry: Record<string, any> = {};

  if (results?.ta) {
    telemetry.ta_blockers = results.ta.blockers || [];
    telemetry.mastery_estimate = results.ta.mastery_estimate || {};
  }

  if (results?.socratic) {
    telemetry.gaps_per_concept = results.socratic.gaps_per_concept || {};
  }

  if (results?.alex) {
    telemetry.scorecard = results.alex.scorecard || {};
  }

  return telemetry;
}

function generateETag(): string {
  return `W/"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`;
}

function ok(data: any) {
  return new Response(
    JSON.stringify({ success: true, data }),
    { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json' 
      }, 
      status: 200 
    }
  );
}

function error(msg: string, status = 500) {
  return new Response(
    JSON.stringify({ success: false, error: msg }),
    { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json' 
      }, 
      status 
    }
  );
}


