import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRequest {
  agent: 'clo' | 'socratic' | 'alex' | 'brand' | 'onboarder' | 'portfolio_curator' | 'clarifier' | 'ta' | 'instructor' | 'career_match';
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
        result = await handleCLOAgent(promptText, action, payload, userId)
        break
      case 'socratic':
        result = await handleSocraticAgent(promptText, action, payload, userId)
        break
      case 'alex':
        result = await handleAlexAgent(promptText, action, payload, userId)
        break
      case 'brand':
        result = await handleBrandAgent(promptText, action, payload, userId)
        break
      case 'onboarder':
        result = await handleOnboarderAgent(promptText, action, payload, userId)
        break
      case 'portfolio_curator':
        result = await handlePortfolioAgent(promptText, action, payload, userId)
        break
      case 'clarifier':
        result = await handleClarifierAgent(promptText, action, payload, userId)
        break
      case 'ta':
        result = await handleTAAgent(promptText, action, payload, userId)
        break
      case 'instructor':
        result = await handleInstructorAgent(promptText, action, payload, userId)
        break
      case 'career_match':
        result = await handleCareerMatchAgent(promptText, action, payload, userId)
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
    'brand': 'brand_strategist_v3.yml',
    'onboarder': 'onboarder_v2.yml',
    'portfolio_curator': 'portfolio_v1_8.yml',
    'clarifier': 'clarifier_v3.yml',
    'ta': 'taagent_v1_4.yml',
    'instructor': 'instructor_v2_1.yml',
    'career_match': 'career_match_v1_3.yml'
  }
  
  return promptMap[agent as keyof typeof promptMap] || `${agent}_prompt.yml`
}

async function handleCLOAgent(_prompt: string, action: string, payload: any, userId: string) {
  const data = await callAgentFunction('clo-agent', action, payload, userId)
  return { shouldPersist: true, data }
}

async function handleSocraticAgent(prompt: string, action: string, payload: any) {
  console.log('Socratic Agent called with action:', action)
  const data = await callAgentFunction('socratic-agent', action, payload, (payload && payload.userId) || '')
  return { shouldPersist: false, data }
}

async function handleAlexAgent(_prompt: string, action: string, payload: any, userId: string) {
  const data = await callAgentFunction('alex-agent', action, payload, userId)
  return { shouldPersist: true, data }
}

async function handleBrandAgent(_prompt: string, action: string, payload: any, userId: string) {
  const data = await callAgentFunction('brand-agent', action, payload, userId)
  return { shouldPersist: true, data }
}

async function handleOnboarderAgent(_prompt: string, action: string, payload: any, userId: string) {
  const data = await callAgentFunction('onboarder-agent', action, payload, userId)
  return { shouldPersist: true, data }
}

async function handlePortfolioAgent(_prompt: string, action: string, payload: any, userId: string) {
  const data = await callAgentFunction('portfolio-curator', action, payload, userId)
  return { shouldPersist: true, data }
}

async function handleClarifierAgent(_prompt: string, action: string, payload: any, userId: string) {
  const data = await callAgentFunction('clarifier-agent', action, payload, userId)
  return { shouldPersist: true, data }
}

async function handleTAAgent(_prompt: string, action: string, payload: any, userId: string) {
  const data = await callAgentFunction('ta-agent', action, payload, userId)
  return { shouldPersist: true, data }
}

async function handleInstructorAgent(_prompt: string, action: string, payload: any, userId: string) {
  const data = await callAgentFunction('instructor-agent', action, payload, userId)
  return { shouldPersist: true, data }
}

async function handleCareerMatchAgent(_prompt: string, action: string, payload: any, userId: string) {
  const data = await callAgentFunction('career-match', action, payload, userId)
  return { shouldPersist: true, data }
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

async function callAgentFunction(endpoint: string, action: string, payload: any, userId: string): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const authToken = Deno.env.get('EDGE_SERVICE_JWT') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!supabaseUrl || !authToken) {
    throw new Error('Missing SUPABASE_URL or EDGE_SERVICE_JWT/SERVICE_ROLE_KEY in environment')
  }

  const resp = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ action, payload, userId })
  })

  const json = await resp.json()
  if (!resp.ok || !json.success) {
    throw new Error(json.error || `Upstream ${endpoint} call failed`)
  }
  return json.data
}
