import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1"
import { resolvePromptSpec } from '../_shared/manifest.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRequest {
  agent: 'clo' | 'socratic' | 'alex' | 'brand' | 'ta' | 'instructor' | 'clarifier' | 'onboarder' | 'career_match' | 'portfolio_curator';
  action: string;
  payload: any;
  userId: string;
  weekNumber?: number;
  compiled_url?: string;
  compiled_object_path?: string;
  compiled_inline?: string;
}

interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agent, action, payload, userId, weekNumber, compiled_url, compiled_object_path, compiled_inline }: AgentRequest = await req.json()

    // Validate required fields
    if (!agent || !userId) {
      throw new Error('Missing required fields: agent and userId')
    }

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check entitlement for premium agents
    const promptSpec = await resolvePromptSpec(agent)
    if (promptSpec.entitlement === 'premium') {
      const userTier = await getUserTier(supabaseClient, userId)
      if (userTier !== 'enterprise' && userTier !== 'premium') {
        console.log(`🔒 entitlement_check_failed: ${agent} requires premium, user has ${userTier}`)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Agent '${agent}' requires premium subscription`,
            entitlement_required: 'premium',
            user_tier: userTier
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          },
        )
      }
      console.log(`✅ entitlement_check_passed: ${agent} for ${userTier} user`)
    }

    // Get compiled prompt text
    let promptText: string;
    
    if (compiled_url) {
      // Use compiled prompt from signed URL
      const response = await fetch(compiled_url);
      if (!response.ok) {
        // If signed URL expired, try to re-sign using object path
        if (response.status === 403 && compiled_object_path) {
          console.log(`🔄 signed_url_expired, re-signing: ${agent}`);
          const { data: newSignedUrl, error: resignError } = await supabaseClient.storage
            .from('prompts-compiled')
            .createSignedUrl(compiled_object_path, 60);
            
          if (resignError) {
            throw new Error(`Failed to re-sign URL: ${resignError.message}`);
          }
          
          const retryResponse = await fetch(newSignedUrl.signedUrl);
          if (!retryResponse.ok) {
            throw new Error(`Failed to fetch compiled prompt after re-signing: ${retryResponse.status}`);
          }
          promptText = await retryResponse.text();
          console.log(`📄 prompt_loaded_from_resigned_url: ${agent} (${promptText.length} chars)`);
        } else {
          throw new Error(`Failed to fetch compiled prompt from ${compiled_url}: ${response.status}`)
        }
      } else {
        promptText = await response.text();
        console.log(`📄 prompt_loaded_from_url: ${agent} (${promptText.length} chars)`);
      }
    } else if (compiled_inline) {
      // Use inline compiled prompt
      promptText = compiled_inline;
      console.log(`📄 prompt_loaded_inline: ${agent} (${promptText.length} chars)`);
    } else {
      // Fallback: load from storage (legacy support)
      promptText = await fetchPromptFromStorage(supabaseClient, agent);
      if (!promptText) {
        throw new Error(`Failed to load prompt for ${agent}`)
      }
      console.log(`📄 prompt_loaded_legacy: ${agent} (${promptText.length} chars)`);
    }

    // Initialize Gemini API
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: agent === 'socratic' ? 'gemini-2.0-flash-exp' : 'gemini-2.0-pro-exp'
    })

    // Route to appropriate agent handler
    let result: AgentResponse;
    switch (agent) {
      case 'clo':
        result = await handleCLOAgent(model, promptText, action, payload, userId, weekNumber)
        break
      case 'socratic':
        result = await handleSocraticAgent(model, promptText, action, payload, userId)
        break
      case 'alex':
        result = await handleAlexAgent(model, promptText, action, payload, userId, weekNumber)
        break
      case 'brand':
        result = await handleBrandAgent(model, promptText, action, payload, userId, weekNumber)
        break
      default:
        throw new Error(`Unknown agent: ${agent}`)
    }

    // Store result in weekly_notes if successful and should persist
    if (result.success && result.data && shouldPersistAgentResult(agent, action)) {
      await persistAgentResult(supabaseClient, userId, agent, result.data, weekNumber)
    }

    // Log prompt invocation telemetry
    await logPromptInvocation(supabaseClient, userId, agent, 'gemini', result.success, error?.message)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Agent proxy error:', error)
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

async function fetchPromptFromStorage(supabaseClient: any, agent: string): Promise<string> {
  const promptPath = getPromptPath(agent)
  
  try {
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download(promptPath)

    if (promptError) {
      console.error(`Storage error for ${agent}:`, promptError)
      throw new Error(`Failed to load prompt for ${agent}: ${promptError.message}`)
    }

    const promptText = await promptData.text()
    console.log(`✅ Loaded ${agent} prompt (${promptText.length} chars)`)
    return promptText
  } catch (error) {
    console.error(`Failed to fetch prompt for ${agent}:`, error)
    throw error
  }
}

function getPromptPath(agent: string): string {
  const promptMap = {
    'clo': 'clo_v2_0.md',
    'socratic': 'socratic_v2_0.md', 
    'alex': 'alex_v2_2.md',
    'brand': 'brand_strategist_v2_1.md'
  }
  
  return promptMap[agent as keyof typeof promptMap] || `${agent}_prompt.md`
}

async function handleCLOAgent(
  model: any, 
  prompt: string, 
  action: string, 
  payload: any, 
  userId: string, 
  weekNumber?: number
): Promise<AgentResponse> {
  try {
    const userInput = payload.userInput || payload.input || ''
    const week = weekNumber || await getCurrentWeekNumber(userId)
    
    const systemPrompt = `${prompt}

CURRENT USER CONTEXT:
User Input: ${userInput}
Week Number: ${week}
User ID: ${userId}

EXECUTION INSTRUCTION:
Follow your prompt instructions exactly. Process the user input according to your role as CLO v2.0.`

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()
    
    // Parse JSON response from CLO (it should return structured data)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    let structuredData
    
    if (jsonMatch) {
      try {
        structuredData = JSON.parse(jsonMatch[1])
      } catch (e) {
        console.warn('Failed to parse CLO JSON response:', e)
        structuredData = { raw_response: text }
      }
    } else {
      structuredData = { raw_response: text }
    }

    return {
      success: true,
      data: {
        ...structuredData,
        full_response_text: text,
        week_number: week,
        agent_version: 'v2.0'
      }
    }
  } catch (error) {
    console.error('CLO Agent error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function handleSocraticAgent(
  model: any, 
  prompt: string, 
  action: string, 
  payload: any, 
  userId: string
): Promise<AgentResponse> {
  try {
    const userMessage = payload.message || payload.userMessage || ''
    const conversationHistory = payload.conversationHistory || []
    const cloContext = payload.cloContext || null
    
    let systemPrompt = `${prompt}

CURRENT USER CONTEXT:
User Message: ${userMessage}
User ID: ${userId}`

    if (cloContext) {
      systemPrompt += `\nCLO Context: ${JSON.stringify(cloContext)}`
    }

    if (conversationHistory.length > 0) {
      systemPrompt += `\nConversation History: ${JSON.stringify(conversationHistory)}`
    }

    systemPrompt += `\n\nEXECUTION INSTRUCTION:
Follow your prompt instructions exactly. Provide a Socratic question or response based on the user's message.`

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()
    
    return {
      success: true,
      data: {
        question: text,
        conversation_id: payload.conversationId || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agent_version: 'v2.0'
      }
    }
  } catch (error) {
    console.error('Socratic Agent error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function handleAlexAgent(
  model: any, 
  prompt: string, 
  action: string, 
  payload: any, 
  userId: string, 
  weekNumber?: number
): Promise<AgentResponse> {
  try {
    const repositoryUrl = payload.repositoryUrl || payload.repoUrl || ''
    const codeContext = payload.codeContext || ''
    const week = weekNumber || await getCurrentWeekNumber(userId)
    
    const systemPrompt = `${prompt}

CURRENT USER CONTEXT:
Repository URL: ${repositoryUrl}
Code Context: ${codeContext}
Week Number: ${week}
User ID: ${userId}

EXECUTION INSTRUCTION:
Follow your prompt instructions exactly. Analyze the provided repository and code context as Lead Engineer Advisor v2.2.`

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()
    
    // Parse JSON response from Alex
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    let structuredData
    
    if (jsonMatch) {
      try {
        structuredData = JSON.parse(jsonMatch[1])
      } catch (e) {
        console.warn('Failed to parse Alex JSON response:', e)
        structuredData = { raw_response: text }
      }
    } else {
      structuredData = { raw_response: text }
    }

    return {
      success: true,
      data: {
        ...structuredData,
        repository_url: repositoryUrl,
        week_number: week,
        agent_version: 'v2.2'
      }
    }
  } catch (error) {
    console.error('Alex Agent error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function handleBrandAgent(
  model: any, 
  prompt: string, 
  action: string, 
  payload: any, 
  userId: string, 
  weekNumber?: number
): Promise<AgentResponse> {
  try {
    const businessContext = payload.businessContext || ''
    const weeklyIntelligence = payload.weeklyIntelligence || {}
    const personalReflection = payload.personalReflection || ''
    const week = weekNumber || await getCurrentWeekNumber(userId)
    
    const systemPrompt = `${prompt}

CURRENT USER CONTEXT:
Business Context: ${businessContext}
Personal Reflection: ${personalReflection}
Week Number: ${week}
User ID: ${userId}
Weekly Intelligence: ${JSON.stringify(weeklyIntelligence)}

EXECUTION INSTRUCTION:
Follow your prompt instructions exactly. Generate brand strategy content as Brand Strategist v2.1.`

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()
    
    // Parse JSON response from Brand
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    let structuredData
    
    if (jsonMatch) {
      try {
        structuredData = JSON.parse(jsonMatch[1])
      } catch (e) {
        console.warn('Failed to parse Brand JSON response:', e)
        structuredData = { raw_response: text }
      }
    } else {
      structuredData = { raw_response: text }
    }

    return {
      success: true,
      data: {
        ...structuredData,
        business_context: businessContext,
        week_number: week,
        agent_version: 'v2.1'
      }
    }
  } catch (error) {
    console.error('Brand Agent error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function getCurrentWeekNumber(userId: string): Promise<number> {
  // This would need to be implemented with proper database access
  // For now, return a calculated week number
  const startDate = new Date('2024-01-01')
  const now = new Date()
  const weekDiff = Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, weekDiff)
}

function shouldPersistAgentResult(agent: string, action: string): boolean {
  // CLO, Alex, and Brand results should be persisted
  // Socratic conversations are handled separately
  return ['clo', 'alex', 'brand'].includes(agent)
}

async function persistAgentResult(
  supabaseClient: any, 
  userId: string, 
  agent: string, 
  data: any, 
  weekNumber?: number
) {
  try {
    const week = weekNumber || await getCurrentWeekNumber(userId)
    
    // Map agent to the correct field name in weekly_notes
    const fieldMap = {
      'clo': 'clo_briefing_note',
      'alex': 'lead_engineer_briefing_note', 
      'brand': 'brand_strategy_package',
      'socratic': 'socratic_conversation'
    }
    
    const updateField = fieldMap[agent as keyof typeof fieldMap]
    if (!updateField) {
      console.warn(`Unknown agent for persistence: ${agent}`)
      return
    }
    
    // Update completion status
    const completionField = `${agent}_completed`
    const currentProgress = agent === 'clo' ? 25 : agent === 'socratic' ? 50 : agent === 'alex' ? 75 : 100
    
    const { error } = await supabaseClient
      .from('weekly_notes')
      .upsert({
        user_id: userId,
        week_number: week,
        [updateField]: data,
        completion_status: {
          [completionField]: true,
          overall_progress: currentProgress
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,week_number'
      })

    if (error) {
      console.error('Failed to persist agent result:', error)
      throw error
    }
    
    console.log(`✅ Persisted ${agent} result for user ${userId}, week ${week}`)
  } catch (error) {
    console.error('Error persisting agent result:', error)
    throw error
  }
}

async function logPromptInvocation(
  supabaseClient: any,
  userId: string,
  agentId: string,
  model: string,
  success: boolean,
  errorCode?: string
): Promise<void> {
  try {
    const startTime = Date.now();
    
    await supabaseClient
      .from('prompt_invocations')
      .insert({
        user_id: userId,
        agent_id: agentId,
        hash: 'legacy', // Will be updated when we have hash tracking
        model,
        input_tokens: 0, // Will be updated when we have token counting
        output_tokens: 0, // Will be updated when we have token counting
        latency_ms: Date.now() - startTime,
        success_bool: success,
        error_code: errorCode
      });
      
    console.log(`📊 prompt_invocation_logged: ${agentId} -> ${success ? 'success' : 'error'}`);
  } catch (error) {
    console.warn('⚠️ Failed to log prompt invocation:', error);
  }
}

async function getUserTier(supabaseClient: any, userId: string): Promise<string> {
  try {
    // Query user's subscription tier
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.warn(`⚠️ Failed to fetch user tier: ${error.message}`);
      return 'basic'; // Default to basic if we can't determine
    }
    
    return user?.subscription_tier || 'basic';
  } catch (error) {
    console.warn('⚠️ Error checking user tier:', error);
    return 'basic';
  }
}