import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: AgentRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load agent prompt from storage
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download('onboarder_v2.yml')

    if (promptError) {
      throw new Error(`Failed to load agent prompt: ${promptError.message}`)
    }

    const promptText = await promptData.text()

    // Call Gemini API with formatted prompt
    const geminiResponse = await callGeminiAPI(promptText, action, payload)

    if (geminiResponse.success) {
      // Persist result to agent_results table
      await persistAgentResult(supabaseClient, userId, 'onboarder', geminiResponse.data)

      return new Response(
        JSON.stringify({ success: true, data: geminiResponse.data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      throw new Error(geminiResponse.error)
    }

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

async function callGeminiAPI(prompt: string, action: string, payload: any) {
  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}\n\nYou are the Onboarder agent. Follow these rules strictly:\n1) Action: ${action}\n2) Payload: ${JSON.stringify(payload)}\n3) Output MUST be a single JSON object matching this JSON Schema (no prose, no markdown, no code fences):\n${JSON.stringify(getActionSchema(action))}\n4) Do NOT include explanations or additional text. Return ONLY JSON.\n5) If information is missing, infer cautiously and note assumptions in an 'assumptions' array.`
          }]
        }]
      })
    })

    const result = await response.json()
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const responseText = result.candidates[0].content.parts[0].text
      const parsed = parseOnboarderResponse(responseText, action)
      return { success: true, data: parsed }
    } else {
      throw new Error('Invalid response from Gemini API')
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

function parseOnboarderResponse(responseText: string, action: string) {
  // Attempt strict JSON parse first
  const parsed = tryParseStrictJson(responseText)
  if (parsed) {
    return parsed
  }

  // Try to extract JSON from common wrappers (e.g., code fences)
  const extracted = extractJsonFromText(responseText)
  if (extracted) {
    return extracted
  }

  // As a last resort, throw an error so the caller can handle it
  throw new Error(`Onboarder agent did not return valid JSON for action ${action}`)
}

function tryParseStrictJson(text: string): any | null {
  try {
    // Fast path if the model actually returned only JSON
    return JSON.parse(text)
  } catch (_e) {
    return null
  }
}

function extractJsonFromText(text: string): any | null {
  // Look for the first JSON object in the text
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch (_e) {
    return null
  }
}

function getActionSchema(action: string): Record<string, unknown> {
  switch (action) {
    case 'CREATE_PROFILE':
      return {
        type: 'object',
        required: ['user_profile', 'onboarding_complete'],
        properties: {
          user_profile: {
            type: 'object',
            required: ['learning_style', 'time_commitment', 'experience_level', 'career_goals'],
            properties: {
              learning_style: { type: 'string', enum: ['visual', 'verbal', 'kinesthetic', 'mixed'] },
              time_commitment: { type: 'number', minimum: 1 },
              experience_level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
              career_goals: { type: 'array', items: { type: 'string' } }
            }
          },
          onboarding_complete: { type: 'boolean' },
          recommended_track: { type: 'string' },
          personalized_plan: {
            type: 'object',
            properties: {
              weekly_hours: { type: 'number' },
              difficulty_progression: { type: 'string' },
              focus_areas: { type: 'array', items: { type: 'string' } }
            }
          },
          assumptions: { type: 'array', items: { type: 'string' } }
        }
      }
    case 'ASSESS_READINESS':
      return {
        type: 'object',
        required: ['readiness_score', 'strengths', 'areas_for_improvement', 'recommended_prerequisites', 'estimated_prep_time'],
        properties: {
          readiness_score: { type: 'number', minimum: 0, maximum: 100 },
          strengths: { type: 'array', items: { type: 'string' } },
          areas_for_improvement: { type: 'array', items: { type: 'string' } },
          recommended_prerequisites: { type: 'array', items: { type: 'string' } },
          estimated_prep_time: { type: 'string' },
          diagnostic_notes: { type: 'string' },
          assumptions: { type: 'array', items: { type: 'string' } }
        }
      }
    case 'GENERATE_LEARNING_PLAN':
      return {
        type: 'object',
        required: ['track_recommendation', 'weekly_structure', 'milestones', 'success_metrics'],
        properties: {
          track_recommendation: { type: 'string' },
          weekly_structure: {
            type: 'object',
            additionalProperties: { type: 'string' }
          },
          milestones: { type: 'array', items: { type: 'string' } },
          success_metrics: { type: 'array', items: { type: 'string' } },
          assumptions: { type: 'array', items: { type: 'string' } }
        }
      }
    default:
      return { type: 'object' }
  }
}

async function persistAgentResult(supabaseClient: any, userId: string, agent: string, data: any) {
  const { error } = await supabaseClient
    .from('agent_results')
    .insert({
      user_id: userId,
      agent_id: agent,
      action: 'onboarding',
      result_data: data,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Failed to persist agent result:', error)
  }
}
