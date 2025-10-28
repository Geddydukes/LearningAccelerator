import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createFeatherRuntime } from "../_shared/feather/runtime.ts";
import { FeatherTaskContext } from "../_shared/feather/types.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SupabaseClient = ReturnType<typeof createClient>;

interface TAProfile {
  learning_style?: string;
}

interface TAPayload {
  topic?: string;
  userLevel?: string;
  exerciseId?: string;
  concept?: string;
}

const runtime = createFeatherRuntime({
  agentId: "ta",
  label: "Teaching Assistant",
  tasks: [
    {
      id: "ta-support",
      phaseId: "practice",
      label: "Practice Support",
      run: runSupportPhase,
    },
    {
      id: "ta-summary",
      phaseId: "reflection",
      label: "TA Summary",
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

async function runSupportPhase(ctx: FeatherTaskContext) {
  const supabase: SupabaseClient = (ctx.supabase as SupabaseClient) ?? createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const prompt = await loadPrompt(supabase, 'agent-prompts', 'taagent_v1_4.yml');
  const profile = await loadProfile(supabase, ctx.request.userId);
  const formatted = formatPrompt(prompt, profile, ctx.request.payload as TAPayload, ctx.request.instructorModifications);

  const response = await callGeminiAPI(formatted, ctx.request.action, ctx.request.payload);
  ctx.state.support = response.data;

  ctx.emitArtifact({
    id: `ta-support-${Date.now()}`,
    kind: "ta_guidance",
    label: `TA Support for ${(ctx.request.payload as TAPayload)?.topic || 'practice task'}`,
    data: response.data,
  });

  ctx.setPhaseSummary('Generated TA support directives.');
}

async function runSummaryPhase(ctx: FeatherTaskContext) {
  const support = ctx.state.support ?? {};
  const summary = {
    primaryAction: support?.next_steps?.[0] || support?.next_steps || support?.help_text,
    score: support?.score,
    completed: support?.is_completed ?? false,
  };

  ctx.emitArtifact({
    id: `ta-summary-${Date.now()}`,
    kind: "session_summary",
    label: 'TA Session Summary',
    data: summary,
  });

  ctx.setPhaseSummary('Summarized TA session.');
}

async function loadPrompt(supabase: SupabaseClient, bucket: string, file: string) {
  const { data, error } = await supabase.storage.from(bucket).download(file);
  if (error || !data) {
    throw new Error(`Failed to load TA prompt: ${error?.message ?? 'unknown error'}`);
  }
  return await data.text();
}

async function loadProfile(supabase: SupabaseClient, userId: string): Promise<TAProfile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
  return data as TAProfile;
}

function formatPrompt(
  template: string,
  profile: TAProfile,
  payload: TAPayload | undefined,
  instructorModifications: Record<string, unknown> | undefined,
) {
  const practiceFocus = instructorModifications?.['practiceFocus'] as unknown;
  const focusList = Array.isArray(practiceFocus) ? (practiceFocus as string[]) : [];
  const understanding = instructorModifications?.['userUnderstanding'] ?? {};
  const instructorNotes = (instructorModifications?.['instructorNotes'] as string) || '';

  return template
    .replace(/{{TOPIC}}/g, payload?.topic || 'Machine Learning Fundamentals')
    .replace(/{{LEARNING_STYLE}}/g, profile?.learning_style || 'mixed')
    .replace(/{{USER_LEVEL}}/g, payload?.userLevel || 'beginner')
    .replace(/{{INSTRUCTOR_NOTES}}/g, instructorNotes)
    .replace(/{{PRACTICE_FOCUS}}/g, focusList.join(', '))
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
  const structured = parseTAResponse(text, action, payload as TAPayload | undefined);
  return { success: true, data: structured };
}

function parseTAResponse(text: string, action: string, payload: TAPayload | undefined) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.warn('Failed to parse TA JSON response', error);
    }
  }

  if (action === 'HELP_WITH_EXERCISE') {
    return {
      exercise_id: payload?.exerciseId || 'exercise-1',
      help_text: extractHelpText(text),
      hints: extractHints(text),
      solution_steps: extractSolutionSteps(text),
      is_completed: false,
    };
  }

  if (action === 'REVIEW_CODE') {
    return {
      review_id: crypto.randomUUID(),
      feedback: extractFeedback(text),
      suggestions: extractSuggestions(text),
      score: extractScore(text),
      max_score: 10,
      next_steps: extractNextSteps(text),
    };
  }

  if (action === 'EXPLAIN_CONCEPT') {
    return {
      concept: payload?.concept || 'Machine Learning',
      explanation: extractExplanation(text),
      examples: extractExamples(text),
      analogies: extractAnalogies(text),
    };
  }

  return {
    help_text: extractHelpText(text),
    hints: extractHints(text),
    solution_steps: extractSolutionSteps(text),
  };
}

function extractHelpText(text: string): string {
  const helpMatch = text.match(/Help Text[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  return helpMatch ? helpMatch[1].trim() : 'Let me help you with this exercise step by step.';
}

function extractHints(text: string): string[] {
  const hintsMatch = text.match(/Hints?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  if (hintsMatch) {
    return hintsMatch[1]
      .split('\n')
      .map((hint) => hint.replace(/^[-*•]\s*/, '').trim())
      .filter((hint) => hint.length > 0);
  }
  return ['Start with the basics', 'Break it down step by step'];
}

function extractSolutionSteps(text: string): string[] {
  const stepsMatch = text.match(/Solution Steps?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  if (stepsMatch) {
    return stepsMatch[1]
      .split('\n')
      .map((step) => step.replace(/^[-*•]\s*/, '').trim())
      .filter((step) => step.length > 0);
  }
  return ['Step 1: Understand the problem', 'Step 2: Plan your approach', 'Step 3: Implement the solution'];
}

function extractFeedback(text: string): string {
  const feedbackMatch = text.match(/Feedback[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  return feedbackMatch ? feedbackMatch[1].trim() : 'Your code shows good understanding of the concepts.';
}

function extractSuggestions(text: string): string[] {
  const suggestionsMatch = text.match(/Suggestions?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  if (suggestionsMatch) {
    return suggestionsMatch[1]
      .split('\n')
      .map((suggestion) => suggestion.replace(/^[-*•]\s*/, '').trim())
      .filter((suggestion) => suggestion.length > 0);
  }
  return ['Refine your variable naming', 'Add more comments for clarity'];
}

function extractScore(text: string): number {
  const scoreMatch = text.match(/Score[:\s]+(\d+)/i);
  return scoreMatch ? parseInt(scoreMatch[1]) : 7;
}

function extractNextSteps(text: string): string[] {
  const nextMatch = text.match(/Next Steps?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  if (nextMatch) {
    return nextMatch[1]
      .split('\n')
      .map((step) => step.replace(/^[-*•]\s*/, '').trim())
      .filter((step) => step.length > 0);
  }
  return ['Refactor the solution', 'Write unit tests'];
}

function extractExplanation(text: string): string {
  const match = text.match(/Explanation[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  return match ? match[1].trim() : 'Here is a detailed explanation of the concept.';
}

function extractExamples(text: string): string[] {
  const match = text.match(/Examples?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  if (match) {
    return match[1]
      .split('\n')
      .map((example) => example.replace(/^[-*•]\s*/, '').trim())
      .filter((example) => example.length > 0);
  }
  return ['Example 1', 'Example 2'];
}

function extractAnalogies(text: string): string[] {
  const match = text.match(/Analogies?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  if (match) {
    return match[1]
      .split('\n')
      .map((analogy) => analogy.replace(/^[-*•]\s*/, '').trim())
      .filter((analogy) => analogy.length > 0);
  }
  return ['Think of it like building blocks that combine into a structure.'];
}
