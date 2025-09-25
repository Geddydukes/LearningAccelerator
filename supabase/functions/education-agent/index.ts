import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { toolRegistry } from "../_shared/toolRegistry.ts";

interface EventBody {
  userId: string;
  week?: number;
  day?: number;
  event: 'start_day'|'lecture_done'|'check_done'|'practice_ready'|'practice_done'|'reflect_done';
  payload?: Record<string, unknown>;
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ ok: false, error: 'Method Not Allowed' }, 405);
    const body: EventBody = await req.json();
    if (!body?.userId) return json({ ok: false, error: 'Missing userId' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const session = await getOrCreateSession(supabase, body.userId, body.week ?? 1, body.day ?? 1);

    switch (body.event) {
      case 'start_day': {
        const dayPlan = await toolRegistry.clo.planDay({ userId: body.userId, week: body.week, day: body.day, payload: { topic: session.topic } });
        if (!dayPlan.ok) return json({ ok: false, error: dayPlan.error }, 400);

        const lecture = await toolRegistry.instructor.deliverLecture({ userId: body.userId, week: body.week, day: body.day, payload: { basePrompt: dayPlan.data } });
        if (!lecture.ok) return json({ ok: false, error: lecture.error }, 400);

        await persistArtifacts(supabase, session.id, { clo_day: dayPlan.data, lecture: lecture.data });
        return json({ ok: true, next: 'lecture_done', lecture: lecture.data });
      }

      case 'lecture_done': {
        const check = await toolRegistry.instructor.checkComprehension({ userId: body.userId, week: body.week, day: body.day, payload: { lectureContext: body.payload?.lectureContext } });
        if (!check.ok) return json({ ok: false, error: check.error }, 400);
        await persistArtifacts(supabase, session.id, { comprehension: check.data });
        return json({ ok: true, next: 'check_done', comprehension: check.data });
      }

      case 'check_done': {
        const modified = await toolRegistry.instructor.modifyPracticePrompts({ userId: body.userId, week: body.week, day: body.day, payload: { understandingMap: body.payload?.understandingMap, cloDailyPrompts: body.payload?.cloDailyPrompts } });
        if (!modified.ok) return json({ ok: false, error: modified.error }, 400);
        await persistArtifacts(supabase, session.id, { modifiedPrompts: modified.data });
        return json({ ok: true, next: 'practice_ready', modifiedPrompts: modified.data });
      }

      case 'practice_ready': {
        return json({ ok: true, next: 'practice' });
      }

      case 'practice_done': {
        await persistArtifacts(supabase, session.id, { practiceResults: body.payload?.results });
        return json({ ok: true, next: 'reflect' });
      }

      case 'reflect_done': {
        await persistArtifacts(supabase, session.id, { reflect: body.payload?.reflect });
        return json({ ok: true, next: 'completed' });
      }

      default:
        return json({ ok: false, error: 'Unknown event' }, 400);
    }
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

async function getOrCreateSession(supabase: any, userId: string, week: number, day: number): Promise<{ id: string; topic: string }>{
  // Placeholder minimal implementation; DB migration adds tables later.
  return { id: `${userId}:${week}:${day}`, topic: 'Machine Learning' };
}

async function persistArtifacts(supabase: any, sessionId: string, artifacts: Record<string, unknown>) {
  // Placeholder; will upsert into education_artifacts in subsequent migration step.
}


