import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SocraticRequest {
  action: string;
  payload: any;
  userId: string;
  instructorModifications?: {
    userUnderstanding: Record<string, string>;
    instructorNotes: string;
    practiceFocus: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId, instructorModifications }: SocraticRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load Socratic prompt from storage
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download('socratic_v3.yml')

    if (promptError) {
      throw new Error(`Failed to load Socratic prompt: ${promptError.message}`)
    }

    const promptText = await promptData.text()

    // Get user profile and context
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Format prompt with user context and instructor modifications
    const formattedPrompt = promptText
      .replace(/{{TOPIC}}/g, payload.topic || 'Machine Learning Fundamentals')
      .replace(/{{LEARNING_STYLE}}/g, userProfile?.learning_style || 'mixed')
      .replace(/{{INSTRUCTOR_NOTES}}/g, instructorModifications?.instructorNotes || '')
      .replace(/{{PRACTICE_FOCUS}}/g, instructorModifications?.practiceFocus?.join(', ') || '')
      .replace(/{{SOCRATIC_FOCUS}}/g, instructorModifications?.practiceFocus?.join(', ') || '')
      .replace(/{{USER_UNDERSTANDING}}/g, JSON.stringify(instructorModifications?.userUnderstanding || {}))

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
      const responseText = result.candidates[0].content.parts[0].text
      
      if (action === 'START_SESSION') {
        return {
          success: true,
          data: {
            session_id: crypto.randomUUID(),
            question: extractQuestion(responseText),
            level: extractLevel(responseText),
            topic: payload.topic || 'Machine Learning Fundamentals'
          }
        }
      } else if (action === 'CONTINUE_SESSION') {
        return {
          success: true,
          data: {
            question: extractQuestion(responseText),
            level: extractLevel(responseText),
            feedback: extractFeedback(responseText),
            mastery_level: extractMasteryLevel(responseText)
          }
        }
      } else if (action === 'ASSESS_MASTERY') {
        return {
          success: true,
          data: {
            mastery_level: extractMasteryLevel(responseText),
            next_question: extractQuestion(responseText),
            level: extractLevel(responseText),
            is_mastered: extractMasteryLevel(responseText) >= 5
          }
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
function extractQuestion(text: string): string {
  const questionMatch = text.match(/Question[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return questionMatch ? questionMatch[1].trim() : 'What do you think about this concept?'
}

function extractLevel(text: string): number {
  const levelMatch = text.match(/Level[:\s]+(\d+)/i)
  return levelMatch ? parseInt(levelMatch[1]) : 1
}

function extractFeedback(text: string): string {
  const feedbackMatch = text.match(/Feedback[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return feedbackMatch ? feedbackMatch[1].trim() : 'Good understanding. Let\'s continue.'
}

function extractMasteryLevel(text: string): number {
  const masteryMatch = text.match(/Mastery Level[:\s]+(\d+)/i)
  return masteryMatch ? parseInt(masteryMatch[1]) : 3
}
