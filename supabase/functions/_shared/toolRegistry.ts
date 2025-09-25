// Tool Registry - wraps Edge Functions as typed tools with normalized I/O
// Deno (Supabase Edge) environment

export type ToolCallArgs = {
  userId: string;
  week?: number;
  day?: number;
  payload?: Record<string, unknown>;
  correlationId?: string;
  etagIfNoneMatch?: string;
};

export type ToolResult<TData> = {
  ok: boolean;
  data?: TData;
  error?: string;
  etag?: string;
};

async function invokeEdgeFunction<TData = unknown>(
  fnPath: string,
  body: Record<string, unknown>,
  etagIfNoneMatch?: string,
): Promise<ToolResult<TData>> {
  const urlBase = Deno.env.get('SUPABASE_URL');
  const serviceJwt = Deno.env.get('EDGE_SERVICE_JWT');
  if (!urlBase || !serviceJwt) {
    return { ok: false, error: 'Missing SUPABASE_URL or EDGE_SERVICE_JWT' };
  }

  const res = await fetch(`${urlBase}/functions/v1/${fnPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceJwt}`,
      ...(etagIfNoneMatch ? { 'If-None-Match': etagIfNoneMatch } : {}),
    },
    body: JSON.stringify(body),
  });

  if (res.status === 304) {
    return { ok: true, data: undefined, etag: res.headers.get('ETag') ?? undefined };
  }

  const etag = res.headers.get('ETag') ?? undefined;
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    return { ok: false, error: json?.error || res.statusText, etag };
  }
  // Normalize common shapes { success, data } | { ok, data }
  const data = json?.data ?? json;
  const ok = json?.ok ?? json?.success ?? true;
  return { ok, data, error: ok ? undefined : (json?.error || 'Unknown error'), etag };
}

export const toolRegistry = {
  clo: {
    planWeek: (args: ToolCallArgs & { topic: string }) =>
      invokeEdgeFunction('agent-proxy', {
        agent: 'clo',
        action: 'GET_WEEKLY_PLAN',
        payload: { topic: (args.payload?.topic as string) || args.topic, week: args.week },
        userId: args.userId,
        weekNumber: args.week,
      }, args.etagIfNoneMatch),

    planDay: (args: ToolCallArgs & { topic?: string }) =>
      invokeEdgeFunction('agent-proxy', {
        agent: 'clo',
        action: 'GET_DAILY_LESSON',
        payload: { topic: (args.payload?.topic as string) || args.topic, day: args.day, week: args.week },
        userId: args.userId,
        weekNumber: args.week,
      }, args.etagIfNoneMatch),
  },

  instructor: {
    deliverLecture: (args: ToolCallArgs & { basePrompt?: unknown }) =>
      invokeEdgeFunction('instructor-agent', {
        action: 'DELIVER_LECTURE',
        payload: { basePrompt: args.payload?.basePrompt, week: args.week, day: args.day },
        userId: args.userId,
      }, args.etagIfNoneMatch),

    checkComprehension: (args: ToolCallArgs & { lectureContext: unknown }) =>
      invokeEdgeFunction('instructor-agent', {
        action: 'CHECK_COMPREHENSION',
        payload: { lectureContext: args.payload?.lectureContext },
        userId: args.userId,
      }, args.etagIfNoneMatch),

    modifyPracticePrompts: (args: ToolCallArgs & { understandingMap: unknown; cloDailyPrompts: unknown }) =>
      invokeEdgeFunction('instructor-agent', {
        action: 'MODIFY_PRACTICE_PROMPTS',
        payload: {
          understandingMap: args.payload?.understandingMap,
          cloDailyPrompts: args.payload?.cloDailyPrompts,
        },
        userId: args.userId,
      }, args.etagIfNoneMatch),
  },

  ta: {
    generateExercises: (args: ToolCallArgs & { modifiedPrompt: unknown }) =>
      invokeEdgeFunction('agent-proxy', {
        agent: 'ta',
        action: 'GENERATE_EXERCISES',
        payload: { modifiedPrompt: args.payload?.modifiedPrompt },
        userId: args.userId,
      }, args.etagIfNoneMatch),
  },

  socratic: {
    generateQuestions: (args: ToolCallArgs & { modifiedPrompt: unknown }) =>
      invokeEdgeFunction('agent-proxy', {
        agent: 'socratic',
        action: 'GENERATE_QUESTIONS',
        payload: { modifiedPrompt: args.payload?.modifiedPrompt },
        userId: args.userId,
      }, args.etagIfNoneMatch),
  },

  alex: {
    preReview: (args: ToolCallArgs & { fs: Array<{ path: string; content: string }>; rubric?: unknown }) =>
      invokeEdgeFunction('coding-workspace/alex/pre', {
        action: 'PRE_REVIEW',
        payload: { fs: args.payload?.fs, rubric: args.payload?.rubric },
        userId: args.userId,
      }, args.etagIfNoneMatch),

    finalReview: (args: ToolCallArgs & { fs: Array<{ path: string; content: string }>; rubric: unknown }) =>
      invokeEdgeFunction('coding-workspace/alex/final', {
        action: 'FINAL_REVIEW',
        payload: { fs: args.payload?.fs, rubric: args.payload?.rubric },
        userId: args.userId,
      }, args.etagIfNoneMatch),
  },

  codingWorkspace: {
    start: (args: ToolCallArgs & { language: string; focusAreas: string[]; rubric?: unknown }) =>
      invokeEdgeFunction('coding-workspace/start', {
        action: 'START',
        payload: {
          language: (args.payload?.language as string) || (args as any).language,
          focusAreas: (args.payload?.focusAreas as string[]) || (args as any).focusAreas,
          rubric: args.payload?.rubric,
          week: args.week,
          day: args.day,
        },
        userId: args.userId,
      }, args.etagIfNoneMatch),

    run: (args: ToolCallArgs & { fs: Array<{ path: string; content: string }>; language: string; tests?: boolean }) =>
      invokeEdgeFunction('coding-workspace/run', {
        action: 'RUN',
        payload: { fs: args.payload?.fs, language: args.payload?.language, tests: args.payload?.tests },
        userId: args.userId,
      }, args.etagIfNoneMatch),
  },
};

export type ToolRegistry = typeof toolRegistry;


