import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from "https://deno.land/std@0.192.0/yaml/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrackSyncRequest {
  userId: string;
  track: string;
  level: string;
  goals: {
    timePerWeek: number;
    budget: number;
    hardwareSpecs: string;
    learningStyle: string;
    endGoal: string;
  };
}

interface CompiledPrompt {
  agent: string;
  prompt: string;
  version: string;
  compiledAt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, track, level, goals }: TrackSyncRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load track configuration
    const { data: trackConfig, error: trackError } = await supabaseClient.storage
      .from('tracks')
      .download(`${track}/config.yaml`)

    if (trackError) {
      throw new Error(`Failed to load track config: ${trackError.message}`)
    }

    const trackYaml = await trackConfig.text()
    const trackData = parse(trackYaml) as any

    // Load base prompts
    const basePrompts = await loadBasePrompts(supabaseClient)

    // Compile prompts with user-specific placeholders
    const compiledPrompts = await compilePrompts(basePrompts, trackData, goals, level)

    // Save compiled prompts to user-specific storage
    const { error: saveError } = await supabaseClient.storage
      .from('prompts-compiled')
      .upload(`${userId}/prompts.json`, new TextEncoder().encode(JSON.stringify(compiledPrompts)))

    if (saveError) {
      throw new Error(`Failed to save compiled prompts: ${saveError.message}`)
    }

    // Update user's track preferences
    await supabaseClient
      .from('users')
      .update({
        current_track: track,
        track_level: level,
        track_goals: goals,
        prompt_version: 'v3-compiled'
      })
      .eq('id', userId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          track,
          level,
          compiledPrompts: Object.keys(compiledPrompts),
          version: 'v3-compiled'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Track sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function loadBasePrompts(supabaseClient: any): Promise<Record<string, string>> {
  const agents = ['clo', 'socratic', 'alex', 'brand']
  const prompts: Record<string, string> = {}

  for (const agent of agents) {
    try {
      const { data: promptData } = await supabaseClient.storage
        .from('prompts')
        .download(`${agent}_v3_template.md`)

      if (promptData) {
        prompts[agent] = await promptData.text()
      }
    } catch (error) {
      console.warn(`Failed to load ${agent} prompt template:`, error)
    }
  }

  return prompts
}

async function compilePrompts(
  basePrompts: Record<string, string>,
  trackData: any,
  goals: any,
  level: string
): Promise<Record<string, CompiledPrompt>> {
  const compiled: Record<string, CompiledPrompt> = {}

  for (const [agent, template] of Object.entries(basePrompts)) {
    const compiledPrompt = template
      .replace(/{{TRACK_LABEL}}/g, trackData.label || 'AI/ML')
      .replace(/{{CORE_COMPETENCY_BLOCK}}/g, trackData.competencies?.[level] || '')
      .replace(/{{MONTH_GOALS_JSON}}/g, JSON.stringify(trackData.monthGoals || {}))
      .replace(/{{TIME_PER_WEEK}}/g, goals.timePerWeek.toString())
      .replace(/{{BUDGET_JSON}}/g, JSON.stringify({ monthly: goals.budget }))
      .replace(/{{HARDWARE_SPECS}}/g, goals.hardwareSpecs)
      .replace(/{{LEARNING_STYLE}}/g, goals.learningStyle)
      .replace(/{{END_GOAL}}/g, goals.endGoal)

    compiled[agent] = {
      agent,
      prompt: compiledPrompt,
      version: 'v3-compiled',
      compiledAt: new Date().toISOString()
    }
  }

  return compiled
} 