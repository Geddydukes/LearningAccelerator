import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createFeatherRuntime } from "../_shared/feather/runtime.ts";
import { FeatherTaskContext } from "../_shared/feather/types.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SupabaseClient = ReturnType<typeof createClient>;

interface CLOLearningPreferences {
  focus_areas?: string[];
  preferred_interaction_style?: string;
  core_competencies?: string[];
}

interface CLOUserProfile {
  name?: string;
  learning_preferences?: CLOLearningPreferences;
  hardware_specs?: string;
  end_goal?: string;
}

interface CLORequestPayload {
  weekNumber?: number;
  timePerWeek?: number;
  [key: string]: unknown;
}

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 5000;

setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(userId);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 12);

const runtime = createFeatherRuntime({
  agentId: "clo",
  label: "Chief Learning Officer",
  tasks: [
    {
      id: "generate-weekly-lecture",
      phaseId: "lecture",
      label: "Weekly Lecture",
      run: runLecturePhase,
    },
    {
      id: "generate-comprehension",
      phaseId: "comprehension",
      label: "Comprehension Check",
      run: runComprehensionPhase,
    },
    {
      id: "generate-practice",
      phaseId: "practice",
      label: "Practice Personalization",
      run: runPracticePhase,
    },
  ],
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: runtime.corsHeaders });
  }

  const payload = await req.json();

  const userId: string | undefined = payload?.userId;
  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: "userId is required" }),
      { headers: { ...runtime.corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }

  const now = Date.now();
  const lastCall = rateLimitMap.get(userId);
  if (lastCall && now - lastCall < RATE_LIMIT_WINDOW_MS) {
    return new Response(
      JSON.stringify({ success: false, error: "Rate limited. Please wait a few seconds before trying again." }),
      { headers: { ...runtime.corsHeaders, "Content-Type": "application/json" }, status: 429 },
    );
  }
  rateLimitMap.set(userId, now);

  const proxyRequest = new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body: JSON.stringify(payload),
  });

  return runtime.handleRequest(proxyRequest);
});

async function runLecturePhase(ctx: FeatherTaskContext) {
  const requestPayload = (ctx.request.payload || {}) as CLORequestPayload;
  const weekNumber = typeof requestPayload.weekNumber === "number"
    ? requestPayload.weekNumber
    : await resolveCurrentWeek();

  const supabase: SupabaseClient = (ctx.supabase as SupabaseClient) ?? createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const prompt = await loadPrompt(supabase, "prompts", "clo_v3.md");
  const userProfile = await loadUserProfile(supabase, ctx.request.userId);

  const formattedPrompt = formatPrompt(prompt, userProfile, requestPayload, weekNumber, ctx.request.action);
  const geminiResult = await callGeminiAPI(formattedPrompt, ctx.request.action, weekNumber);

  ctx.state.weekNumber = weekNumber;
  ctx.state.lecture = geminiResult;

  ctx.emitArtifact({
    id: `clo-lecture-${weekNumber}`,
    kind: "weekly_plan",
    label: `Week ${weekNumber} lecture plan`,
    data: geminiResult.data,
    meta: {
      weekNumber,
      generatedAt: new Date().toISOString(),
    },
  });

  ctx.setPhaseSummary(geminiResult.data?.summary || `Generated lecture plan for week ${weekNumber}`);
}

async function runComprehensionPhase(ctx: FeatherTaskContext) {
  const lectureData = ctx.state.lecture?.data ?? {};
  const questions = lectureData?.comprehension_questions || lectureData?.CLO_Assessor_Directive?.comprehension_check || [];

  const normalized = Array.isArray(questions)
    ? questions
    : Object.values(questions || {}).map((question, index) => ({
      id: `q${index + 1}`,
      question,
    }));

  const enrichedQuestions = normalized.length > 0
    ? normalized
    : [
      { id: "q1", question: "What is the primary objective for this week?" },
      { id: "q2", question: "How will you apply the new concepts in practice?" },
    ];

  ctx.emitArtifact({
    id: `clo-comprehension-${ctx.state.weekNumber}`,
    kind: "question_list",
    label: "Comprehension Check",
    data: { questions: enrichedQuestions },
    meta: { count: enrichedQuestions.length },
  });

  ctx.setPhaseSummary(`Generated ${enrichedQuestions.length} comprehension questions.`);
}

async function runPracticePhase(ctx: FeatherTaskContext) {
  const lectureData = ctx.state.lecture?.data ?? {};
  const practice = lectureData?.practice_prompts || lectureData?.CLO_Assessor_Directive?.practice_prompts || [];

  const normalized = Array.isArray(practice)
    ? practice
    : Object.values(practice || {}).map((prompt, index) => ({
      id: `practice-${index + 1}`,
      prompt,
    }));

  const practicePrompts = normalized.length > 0
    ? normalized
    : [
      { id: "practice-1", prompt: "Complete the core exercise outlined by the CLO." },
      { id: "practice-2", prompt: "Document blockers and questions for the TA." },
    ];

  ctx.emitArtifact({
    id: `clo-practice-${ctx.state.weekNumber}`,
    kind: "practice_plan",
    label: "Practice Personalization",
    data: { prompts: practicePrompts },
    meta: {
      count: practicePrompts.length,
      taHandoff: lectureData?.CLO_Assessor_Directive?.ta_handoff || null,
    },
  });

  ctx.setPhaseSummary(`Prepared practice guidance with ${practicePrompts.length} prompts.`);
}

async function loadPrompt(supabase: SupabaseClient, bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(`Failed to load CLO prompt: ${error?.message ?? "unknown error"}`);
  }
  return await data.text();
}

async function loadUserProfile(supabase: SupabaseClient, userId: string): Promise<CLOUserProfile> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
  return data as CLOUserProfile;
}

function formatPrompt(
  prompt: string,
  userProfile: CLOUserProfile,
  payload: CLORequestPayload,
  weekNumber: number,
  action: string,
) {
  const preferences = userProfile?.learning_preferences ?? {};
  return prompt
    .replace(/{{LEARNER_NAME}}/g, userProfile?.name || 'Learner')
    .replace(/{{TRACK_LABEL}}/g, preferences?.focus_areas?.[0] || 'Full-Stack Development')
    .replace(/{{TIME_PER_WEEK}}/g, String(payload.timePerWeek || 5))
    .replace(/{{HARDWARE_SPECS}}/g, userProfile?.hardware_specs || 'basic laptop')
    .replace(/{{LEARNING_STYLE}}/g, preferences?.preferred_interaction_style || 'mixed')
    .replace(/{{END_GOAL}}/g, userProfile?.end_goal || 'Master core engineering fundamentals')
    .replace(/{{BUDGET_JSON}}/g, JSON.stringify({ budget: 0 }))
    .replace(/{{CORE_COMPETENCY_BLOCK}}/g, preferences?.core_competencies?.join(', ') || 'Full-Stack Development, React, TypeScript')
    .replace(/{{MONTH_GOALS_JSON}}/g, JSON.stringify({ goals: ['Build foundation', 'Complete projects', 'Master concepts'] }))
    .concat(`\n\nCommand: ${mapActionToCommand(action, weekNumber)}`);
}

async function callGeminiAPI(
  prompt: string,
  action: string,
  weekNumber: number,
) {
  const geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('VITE_GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${prompt}\n\nGenerate a comprehensive weekly learning plan for week ${weekNumber}. Include all required sections and return JSON.`,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const parsed = extractJson(text) ?? { raw_response: text };
  const command = mapActionToCommand(action, weekNumber);

  return {
    success: true,
    data: {
      ...parsed,
      raw_response: text,
      week_number: weekNumber,
      command_executed: command,
    },
  };
}

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (error) {
    console.warn('Failed to parse CLO JSON response', error);
    return null;
  }
}

function mapActionToCommand(action: string | undefined, weekNumber: number) {
  const normalized = action ?? '';
  switch (normalized) {
    case 'GET_DAILY_LESSON':
    case 'GET_WEEKLY_PLAN':
      return `BEGIN_WEEK_${weekNumber}`;
    default:
      return normalized || 'BEGIN_WEEK';
  }
}

async function resolveCurrentWeek() {
  const start = new Date('2024-01-01').getTime();
  return Math.ceil((Date.now() - start) / (7 * 24 * 60 * 60 * 1000));
}
