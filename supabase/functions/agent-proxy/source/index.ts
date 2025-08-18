import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRequest {
  agent: 'clo' | 'socratic' | 'alex' | 'brand';
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agent, action, payload, userId }: AgentRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load agent prompt from storage
    const promptPath = getPromptPath(agent)
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download(promptPath)

    if (promptError) {
      throw new Error(`Failed to load prompt for ${agent}: ${promptError.message}`)
    }

    const promptText = await promptData.text()

    // Route to appropriate agent handler
    let result;
    switch (agent) {
      case 'clo':
        result = await handleCLOAgent(promptText, action, payload)
        break
      case 'socratic':
        result = await handleSocraticAgent(promptText, action, payload)
        break
      case 'alex':
        result = await handleAlexAgent(promptText, action, payload)
        break
      case 'brand':
        result = await handleBrandAgent(promptText, action, payload)
        break
      default:
        throw new Error(`Unknown agent: ${agent}`)
    }

    // Store result in weekly_notes if applicable
    if (result.shouldPersist) {
      await persistAgentResult(supabaseClient, userId, agent, result.data)
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
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

function getPromptPath(agent: string): string {
  const promptMap = {
    'clo': 'clo_v3.yml',
    'socratic': 'socratic_v3.yml', 
    'alex': 'alex_v3.yml',
    'brand': 'brand_strategist_v3.yml'
  }
  
  return promptMap[agent as keyof typeof promptMap] || `${agent}_prompt.yml`
}

async function handleCLOAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement actual Gemini API call with loaded prompt
  console.log('CLO Prompt loaded:', prompt.substring(0, 100) + '...')
  return {
    shouldPersist: true,
    data: {
      module_title: "Sample Learning Module",
      learning_objectives: ["Objective 1", "Objective 2"],
      key_concepts: ["Concept 1", "Concept 2"],
      estimated_duration: 120,
      prerequisites: ["Basic knowledge"],
      resources: [],
      assessment_criteria: ["Criteria 1"]
    }
  }
}

async function handleSocraticAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement Gemini API call with Socratic prompt
  return {
    shouldPersist: false,
    data: {
      question: "What do you think about this concept?",
      conversation_id: payload.conversationId || crypto.randomUUID()
    }
  }
}

async function handleAlexAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement Gemini API call with Alex prompt
  return {
    shouldPersist: true,
    data: {
      repository_url: payload.repositoryUrl,
      analysis_summary: "Code analysis complete",
      code_quality_score: 85,
      recommendations: [],
      technical_debt_items: [],
      best_practices_followed: [],
      areas_for_improvement: []
    }
  }
}

async function handleBrandAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement Gemini API call with Brand prompt
  return {
    shouldPersist: true,
    data: {
      content_themes: ["Theme 1", "Theme 2"],
      kpi_metrics: [],
      social_content_suggestions: [],
      brand_voice_analysis: "Professional and engaging",
      engagement_strategies: []
    }
  }
}

async function persistAgentResult(supabaseClient: any, userId: string, agent: string, data: any) {
  const currentWeek = Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))
  
  const updateField = `${agent === 'alex' ? 'lead_engineer' : agent}_${agent === 'clo' ? 'briefing_note' : agent === 'brand' ? 'strategy_package' : 'conversation'}`
  
  const { error } = await supabaseClient
    .from('weekly_notes')
    .upsert({
      user_id: userId,
      week_number: currentWeek,
      [updateField]: data,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,week_number'
    })

  if (error) {
    console.error('Failed to persist agent result:', error)
  }
}
