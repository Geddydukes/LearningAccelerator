import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InstructorRequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: InstructorRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load instructor prompt from storage
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download('instructor_v2_1.yml')

    if (promptError) {
      throw new Error(`Failed to load instructor prompt: ${promptError.message}`)
    }

    const promptText = await promptData.text()

    // Get user profile and context
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Get current week and day
    const currentWeek = Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))
    const currentDay = Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (24 * 60 * 60 * 1000)) % 5 + 1

    // Format prompt with user context
    const formattedPrompt = promptText
      .replace(/{{TRACK_LABEL}}/g, userProfile?.track_label || 'AI/ML Engineering')
      .replace(/{{WEEK_NUMBER}}/g, currentWeek.toString())
      .replace(/{{DAY_NUMBER}}/g, currentDay.toString())
      .replace(/{{TIME_PER_DAY_MIN}}/g, payload.timePerDay || '30')
      .replace(/{{LEARNING_STYLE}}/g, userProfile?.learning_style || 'mixed')
      .replace(/{{END_GOAL}}/g, userProfile?.end_goal || 'Master machine learning fundamentals')
      .replace(/{{HARDWARE_SPECS}}/g, userProfile?.hardware_specs || 'basic laptop')
      .replace(/{{USER_PREMIUM_BOOL}}/g, (userProfile?.premium || false).toString())
      .replace(/{{USER_TZ}}/g, userProfile?.timezone || 'UTC')

    // Call Gemini API with formatted prompt
    const geminiResponse = await callGeminiAPI(formattedPrompt, action, payload)

    if (geminiResponse.success) {
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
            text: `${prompt}\n\nAction: ${action}\nPayload: ${JSON.stringify(payload)}\n\nGenerate a response based on the prompt instructions.`
          }]
        }]
      })
    })

    const result = await response.json()
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      return {
        success: true,
        data: {
          lesson_id: `daily-${payload.dayNumber || 1}`,
          title: extractTitle(result.candidates[0].content.parts[0].text),
          objectives: extractObjectives(result.candidates[0].content.parts[0].text),
          content: extractContent(result.candidates[0].content.parts[0].text),
          exercises: extractExercises(result.candidates[0].content.parts[0].text),
          estimated_duration: extractDuration(result.candidates[0].content.parts[0].text),
          day_number: payload.dayNumber || 1,
          practice_options: [
            { type: 'socratic', title: 'Socratic Practice', description: 'Deep dive through questioning' },
            { type: 'ta', title: 'TA Session', description: 'Get help with exercises' }
          ]
        }
      }
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

// Helper functions to extract structured data from Gemini response
function extractTitle(text: string): string {
  const titleMatch = text.match(/Title[:\s]+([^\n]+)/i)
  return titleMatch ? titleMatch[1].trim() : 'Daily Learning Session'
}

function extractObjectives(text: string): string[] {
  const objectivesMatch = text.match(/Objectives?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (objectivesMatch) {
    return objectivesMatch[1]
      .split('\n')
      .map(obj => obj.replace(/^[-*•]\s*/, '').trim())
      .filter(obj => obj.length > 0)
  }
  return ['Complete daily objectives']
}

function extractContent(text: string): string {
  const contentMatch = text.match(/Content[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return contentMatch ? contentMatch[1].trim() : 'Daily lesson content will appear here.'
}

function extractExercises(text: string): string[] {
  const exercisesMatch = text.match(/Exercises?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (exercisesMatch) {
    return exercisesMatch[1]
      .split('\n')
      .map(ex => ex.replace(/^[-*•]\s*/, '').trim())
      .filter(ex => ex.length > 0)
  }
  return ['Practice exercises']
}

function extractDuration(text: string): number {
  const durationMatch = text.match(/Duration[:\s]+(\d+)/i)
  return durationMatch ? parseInt(durationMatch[1]) : 30
}
