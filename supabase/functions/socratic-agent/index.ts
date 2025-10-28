import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createFeatherRuntime } from "../_shared/feather/runtime.ts";
import { FeatherTaskContext } from "../_shared/feather/types.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SupabaseClient = ReturnType<typeof createClient>;

interface SocraticProfile {
  learning_style?: string;
}

interface SocraticPayload {
  topic?: string;
  userLevel?: string;
}

const runtime = createFeatherRuntime({
  agentId: "socratic",
  label: "Socratic Facilitator",
  tasks: [
    {
      id: "generate-question",
      phaseId: "comprehension",
      label: "Guided Question",
      run: runQuestionPhase,
    },
    {
      id: "socratic-summary",
      phaseId: "reflection",
      label: "Dialogue Summary",
      run: runSummaryPhase,
    },
  ],
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: runtime.corsHeaders });
  }

  const payload = await req.json();
  const proxy = new Request(req.url, { method: req.method, headers: req.headers, body: JSON.stringify(payload) });
  return runtime.handleRequest(proxy);
});

async function runQuestionPhase(ctx: FeatherTaskContext) {
  const supabase: SupabaseClient = (ctx.supabase as SupabaseClient) ?? createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const prompt = await loadPrompt(supabase, 'agent-prompts', 'socratic_v3.yml');
  const userProfile = await loadProfile(supabase, ctx.request.userId);
  const formatted = formatPrompt(prompt, userProfile, ctx.request.payload as SocraticPayload, ctx.request.instructorModifications);

  const response = await callGeminiAPI(formatted, ctx.request.action, ctx.request.payload);

  ctx.state.question = response.data;

  ctx.emitArtifact({
    id: `socratic-question-${response.data.session_id ?? Date.now()}`,
    kind: "socratic_question",
    label: response.data.topic || (ctx.request.payload as SocraticPayload)?.topic || 'Guided question',
    data: response.data,
    meta: {
      sessionId: response.data.session_id,
      masteryLevel: response.data.mastery_level ?? response.data.level ?? 1,
    },
  });

  ctx.setPhaseSummary("Generated Socratic dialogue prompt");
}

async function runSummaryPhase(ctx: FeatherTaskContext) {
  const question = ctx.state.question ?? {};
  const summary = {
    nextAction: question?.next_question || question?.question,
    masteryLevel: question?.mastery_level ?? question?.level ?? 1,
    feedback: question?.feedback || 'Keep exploring the concept using Socratic questions.',
  };

  ctx.emitArtifact({
    id: `socratic-summary-${Date.now()}`,
    kind: "session_summary",
    label: "Socratic Session Summary",
    data: summary,
  });

  ctx.setPhaseSummary('Summarized Socratic dialogue session.');
}

async function loadPrompt(supabase: SupabaseClient, bucket: string, file: string) {
  const { data, error } = await supabase.storage.from(bucket).download(file);
  if (error || !data) {
    throw new Error(`Failed to load Socratic prompt: ${error?.message ?? 'unknown error'}`);
  }
  return await data.text();
}

async function loadProfile(supabase: SupabaseClient, userId: string): Promise<SocraticProfile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
  return data as SocraticProfile;
}

function formatPrompt(
  template: string,
  profile: SocraticProfile,
  payload: SocraticPayload | undefined,
  instructorModifications: Record<string, unknown> | undefined,
) {
  const instructorNotes = (instructorModifications?.["instructorNotes"] as string) || '';
  const focus = instructorModifications?.["practiceFocus"] as unknown;
  const focusList = Array.isArray(focus) ? (focus as string[]) : [];
  const understanding = instructorModifications?.["userUnderstanding"] ?? {};

  return template
    .replace(/{{TOPIC}}/g, payload?.topic || 'Machine Learning Fundamentals')
    .replace(/{{LEARNING_STYLE}}/g, profile?.learning_style || 'mixed')
    .replace(/{{INSTRUCTOR_NOTES}}/g, instructorNotes)
    .replace(/{{PRACTICE_FOCUS}}/g, focusList.join(', '))
    .replace(/{{SOCRATIC_FOCUS}}/g, focusList.join(', '))
    .replace(/{{USER_UNDERSTANDING}}/g, JSON.stringify(understanding));
}

async function callGeminiAPI(prompt: string, action: string, payload: Record<string, unknown> | undefined) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${prompt}\n\nAction: ${action}\nPayload: ${JSON.stringify(payload || {})}\n\nGenerate a structured response following the prompt instructions.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  const structured = parseSocraticResponse(text, action, payload);
  return { success: true, data: structured };
}

function parseSocraticResponse(text: string, action: string, payload: Record<string, unknown> | undefined) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.warn('Failed to parse Socratic JSON response', error);
    }
  }

  if (action === 'START_SESSION') {
    return {
      session_id: crypto.randomUUID(),
      question: extractQuestion(text),
      level: extractLevel(text),
      topic: (payload as SocraticPayload)?.topic || 'Machine Learning Fundamentals',
    };
  }

  if (action === 'CONTINUE_SESSION') {
    return {
      question: extractQuestion(text),
      level: extractLevel(text),
      feedback: extractFeedback(text),
      mastery_level: extractMasteryLevel(text),
    };
  }

  return {
    question: extractQuestion(text),
    level: extractLevel(text),
    feedback: extractFeedback(text),
    mastery_level: extractMasteryLevel(text),
  };
}

function extractQuestion(text: string): string {
  const questionMatch = text.match(/Question[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  return questionMatch ? questionMatch[1].trim() : 'What do you think about this concept?';
}

function extractLevel(text: string): number {
  const levelMatch = text.match(/Level[:\s]+(\d+)/i);
  return levelMatch ? parseInt(levelMatch[1]) : 1;
}

function extractFeedback(text: string): string {
  const feedbackMatch = text.match(/Feedback[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  return feedbackMatch ? feedbackMatch[1].trim() : 'Let\'s explore this further.';
}

function extractMasteryLevel(text: string): number {
  const masteryMatch = text.match(/Mastery Level[:\s]+(\d+)/i);
  return masteryMatch ? parseInt(masteryMatch[1]) : 3;
}
