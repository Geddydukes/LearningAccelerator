import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createFeatherRuntime } from "../_shared/feather/runtime.ts";
import { FeatherTaskContext } from "../_shared/feather/types.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SupabaseClient = ReturnType<typeof createClient>;

interface InstructorProfile {
  learning_style?: string;
  end_goal?: string;
  hardware_specs?: string;
  premium?: boolean;
  timezone?: string;
  track_label?: string;
}

interface InstructorPayload {
  timePerDay?: number;
  weekNumber?: number;
  dayNumber?: number;
  difficultyLevel?: string;
}

const runtime = createFeatherRuntime({
  agentId: "instructor",
  label: "Instructor Orchestrator",
  tasks: [
    {
      id: "deliver-lecture",
      phaseId: "lecture",
      label: "Deliver Lecture",
      run: runLecturePhase,
    },
    {
      id: "comprehension-check",
      phaseId: "comprehension",
      label: "Comprehension Check",
      run: runComprehensionPhase,
    },
    {
      id: "practice-modification",
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
  const proxy = new Request(req.url, { method: req.method, headers: req.headers, body: JSON.stringify(payload) });
  return runtime.handleRequest(proxy);
});

async function runLecturePhase(ctx: FeatherTaskContext) {
  const supabase = buildSupabase(ctx);
  const prompt = await loadPrompt(supabase);
  const profile = await loadProfile(supabase, ctx.request.userId);
  const calendar = resolveCalendar(ctx.request.payload as InstructorPayload | undefined);
  ctx.state.calendar = calendar;
  ctx.state.profile = profile;
  ctx.state.promptText = prompt;

  const formattedPrompt = formatPrompt(prompt, profile, calendar, ctx.request.payload as InstructorPayload | undefined, ctx.request.action);
  const lecture = await callGeminiAPI(formattedPrompt, 'DELIVER_LECTURE', ctx.request.payload);

  ctx.state.lecture = lecture.data;

  ctx.emitArtifact({
    id: `instructor-lecture-${calendar.week}-${calendar.day}`,
    kind: 'instructor_lecture',
    label: lecture.data?.title || `Lecture Day ${calendar.day}`,
    data: lecture.data,
    meta: { weekNumber: calendar.week, dayNumber: calendar.day, command: 'DELIVER_LECTURE' },
  });

  ctx.setPhaseSummary('Generated instructor lecture content.');
}

async function runComprehensionPhase(ctx: FeatherTaskContext) {
  const supabase = buildSupabase(ctx);
  const prompt = (ctx.state.promptText as string) || (await loadPrompt(supabase));
  const calendar = ctx.state.calendar || resolveCalendar(ctx.request.payload as InstructorPayload | undefined);
  const comprehensionPayload = {
    ...(ctx.request.payload || {}),
    lecture_summary: ctx.state.lecture?.lecture_content || ctx.state.lecture,
  };

  const profile = (ctx.state.profile as InstructorProfile | undefined) || {};
  const formattedPrompt = formatPrompt(String(prompt), profile, calendar, comprehensionPayload, 'CHECK_COMPREHENSION');
  const comprehension = await callGeminiAPI(formattedPrompt, 'CHECK_COMPREHENSION', comprehensionPayload);

  ctx.state.comprehension = comprehension.data;

  ctx.emitArtifact({
    id: `instructor-comprehension-${calendar.week}-${calendar.day}`,
    kind: 'comprehension_check',
    label: 'Comprehension Assessment',
    data: comprehension.data,
    meta: { questionCount: comprehension.data?.questions?.length ?? 0, command: 'CHECK_COMPREHENSION' },
  });

  ctx.setPhaseSummary('Generated comprehension check.');
}

async function runPracticePhase(ctx: FeatherTaskContext) {
  const supabase = buildSupabase(ctx);
  const prompt = (ctx.state.promptText as string) || (await loadPrompt(supabase));
  const calendar = ctx.state.calendar || resolveCalendar(ctx.request.payload as InstructorPayload | undefined);
  const practicePayload = {
    ...(ctx.request.payload || {}),
    comprehension: ctx.state.comprehension,
    lecture: ctx.state.lecture,
  };

  const profile = (ctx.state.profile as InstructorProfile | undefined) || {};
  const formattedPrompt = formatPrompt(String(prompt), profile, calendar, practicePayload, 'MODIFY_PRACTICE_PROMPTS');
  const practice = await callGeminiAPI(formattedPrompt, 'MODIFY_PRACTICE_PROMPTS', practicePayload);

  ctx.state.practice = practice.data;

  ctx.emitArtifact({
    id: `instructor-practice-${calendar.week}-${calendar.day}`,
    kind: 'practice_modification',
    label: 'Practice Personalization',
    data: practice.data,
    meta: { command: 'MODIFY_PRACTICE_PROMPTS' },
  });

  ctx.setPhaseSummary('Generated practice modifications for TA and Socratic agents.');
}

function buildSupabase(ctx: FeatherTaskContext): SupabaseClient {
  if (ctx.supabase) return ctx.supabase as SupabaseClient;
  const client = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  ctx.state.supabase = client;
  return client;
}

async function loadPrompt(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase.storage.from('agent-prompts').download('instructor_v2_2.yml');
    if (error || !data) {
      console.log('Storage download failed, using hardcoded prompt', error?.message);
      return getHardcodedInstructorPrompt();
    }
    const text = await data.text();
    return text;
  } catch (error) {
    console.log('Storage error, using hardcoded prompt', error.message);
    return getHardcodedInstructorPrompt();
  }
}

async function loadProfile(supabase: SupabaseClient, userId: string): Promise<InstructorProfile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
  return data as InstructorProfile;
}

function resolveCalendar(payload: InstructorPayload | undefined) {
  const week = payload?.weekNumber ?? Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
  const day = payload?.dayNumber ?? (Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (24 * 60 * 60 * 1000)) % 5) + 1;
  return { week, day };
}

function formatPrompt(
  template: string,
  profile: InstructorProfile,
  calendar: { week: number; day: number },
  payload: InstructorPayload | Record<string, unknown> | undefined,
  action: string,
) {
  const timePerDay = (payload as InstructorPayload)?.timePerDay || 30;
  const learningStyle = profile?.learning_style || 'mixed';
  const endGoal = profile?.end_goal || 'Master machine learning fundamentals';
  const hardware = profile?.hardware_specs || 'basic laptop';
  const isPremium = (profile?.premium || false).toString();
  const timezone = profile?.timezone || 'UTC';

  return template
    .replace(/{{TRACK_LABEL}}/g, profile?.track_label || 'AI/ML Engineering')
    .replace(/{{WEEK_NUMBER}}/g, String(calendar.week))
    .replace(/{{DAY_NUMBER}}/g, String(calendar.day))
    .replace(/{{TIME_PER_DAY_MIN}}/g, String(timePerDay))
    .replace(/{{LEARNING_STYLE}}/g, learningStyle)
    .replace(/{{END_GOAL}}/g, endGoal)
    .replace(/{{HARDWARE_SPECS}}/g, hardware)
    .replace(/{{USER_PREMIUM_BOOL}}/g, isPremium)
    .replace(/{{USER_TZ}}/g, timezone)
    .concat(`\n\nCommand: ${action}`);
}

async function callGeminiAPI(prompt: string, command: string, payload: Record<string, unknown> | undefined) {
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
              text: `${prompt}\nPayload: ${JSON.stringify(payload || {})}\n\nGenerate a response based on the prompt instructions and command. Return structured data in JSON format.`,
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
  const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const parsed = parseInstructorResponse(responseText, command, payload);
  return { success: true, data: parsed };
}

function parseInstructorResponse(responseText: string, action: string, payload: any) {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (_error) {
    // fall back to manual parsing
  }

  switch (action) {
    case 'DELIVER_LECTURE':
      return {
        lecture_content: extractContent(responseText) || "Today we'll explore the foundational concepts of the topic.",
        key_concepts: extractKeyConcepts(responseText) || ['Concept A', 'Concept B'],
        estimated_duration: extractDuration(responseText) || 20,
        next_phase: 'comprehension_check',
        lecture_id: `lecture-${Date.now()}`,
        difficulty_level: (payload?.difficultyLevel as string) || 'intermediate',
      };
    case 'CHECK_COMPREHENSION':
      return {
        questions: extractComprehensionQuestions(responseText) || [
          { id: 'q1', question: 'What is the difference between supervised and unsupervised learning?' },
          { id: 'q2', question: 'Explain the concept of model training.' },
        ],
        user_understanding: extractUnderstandingLevel(responseText) || 'intermediate',
        next_phase: 'practice_preparation',
        assessment_id: `assessment-${Date.now()}`,
      };
    case 'MODIFY_PRACTICE_PROMPTS':
      return {
        ta_prompt: extractTAPrompt(responseText) || 'Modified TA prompt based on user understanding...',
        socratic_prompt: extractSocraticPrompt(responseText) || 'Modified Socratic prompt based on user understanding...',
        practice_focus: extractPracticeFocus(responseText) || ['reinforcement', 'application'],
        modification_id: `modification-${Date.now()}`,
      };
    default:
      return {
        raw_text: responseText,
      };
  }
}

function extractContent(text: string): string | undefined {
  const match = text.match(/Lecture Content[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  return match ? match[1].trim() : undefined;
}

function extractKeyConcepts(text: string): string[] | undefined {
  const match = text.match(/Key Concepts?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  if (match) {
    return match[1]
      .split('\n')
      .map((item) => item.replace(/^[-*•]\s*/, '').trim())
      .filter((item) => item.length > 0);
  }
  return undefined;
}

function extractDuration(text: string): number | undefined {
  const match = text.match(/Duration[:\s]+(\d+)/i);
  return match ? parseInt(match[1]) : undefined;
}

function extractComprehensionQuestions(text: string) {
  const match = text.match(/Questions?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  if (match) {
    return match[1]
      .split('\n')
      .map((q, index) => ({ id: `q${index + 1}`, question: q.replace(/^[-*•]\s*/, '').trim() }))
      .filter((item) => item.question.length > 0);
  }
  return undefined;
}

function extractUnderstandingLevel(text: string): string | undefined {
  const match = text.match(/Understanding Level[:\s]+([\w\s]+)/i);
  return match ? match[1].trim() : undefined;
}

function extractTAPrompt(text: string): string | undefined {
  const match = text.match(/TA Prompt[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  return match ? match[1].trim() : undefined;
}

function extractSocraticPrompt(text: string): string | undefined {
  const match = text.match(/Socratic Prompt[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  return match ? match[1].trim() : undefined;
}

function extractPracticeFocus(text: string): string[] | undefined {
  const match = text.match(/Practice Focus[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  if (match) {
    return match[1]
      .split('\n')
      .map((item) => item.replace(/^[-*•]\s*/, '').trim())
      .filter((item) => item.length > 0);
  }
  return undefined;
}

function getHardcodedInstructorPrompt() {
  return `# Instructor Agent Prompt

You are a senior instructor orchestrating a daily learning journey. Use the provided context about the learner, their goals, and the current week/day to deliver lectures, comprehension checks, and practice modifications.

Sections to provide:
- Lecture Content
- Key Concepts
- Duration
- Comprehension Questions
- Understanding Level
- TA Prompt
- Socratic Prompt
- Practice Focus
`;
}
