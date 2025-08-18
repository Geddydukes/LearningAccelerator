import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TARequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: TARequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load TA prompt from storage
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download('taagent_v1_4.yml')

    if (promptError) {
      throw new Error(`Failed to load TA prompt: ${promptError.message}`)
    }

    const promptText = await promptData.text()

    // Get user profile and context
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Format prompt with user context
    const formattedPrompt = promptText
      .replace(/{{TOPIC}}/g, payload.topic || 'Machine Learning Fundamentals')
      .replace(/{{LEARNING_STYLE}}/g, userProfile?.learning_style || 'mixed')
      .replace(/{{USER_LEVEL}}/g, payload.userLevel || 'beginner')

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
      
      if (action === 'HELP_WITH_EXERCISE') {
        return {
          success: true,
          data: {
            exercise_id: payload.exerciseId || 'ex-1',
            help_text: extractHelpText(responseText),
            hints: extractHints(responseText),
            solution_steps: extractSolutionSteps(responseText),
            is_completed: false
          }
        }
      } else if (action === 'REVIEW_CODE') {
        return {
          success: true,
          data: {
            review_id: crypto.randomUUID(),
            feedback: extractFeedback(responseText),
            suggestions: extractSuggestions(responseText),
            score: extractScore(responseText),
            max_score: 10,
            next_steps: extractNextSteps(responseText)
          }
        }
      } else if (action === 'EXPLAIN_CONCEPT') {
        return {
          success: true,
          data: {
            concept: payload.concept || 'Machine Learning',
            explanation: extractExplanation(responseText),
            examples: extractExamples(responseText),
            analogies: extractAnalogies(responseText)
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
function extractHelpText(text: string): string {
  const helpMatch = text.match(/Help Text[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return helpMatch ? helpMatch[1].trim() : 'Let me help you with this exercise step by step.'
}

function extractHints(text: string): string[] {
  const hintsMatch = text.match(/Hints?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (hintsMatch) {
    return hintsMatch[1]
      .split('\n')
      .map(hint => hint.replace(/^[-*•]\s*/, '').trim())
      .filter(hint => hint.length > 0)
  }
  return ['Start with the basics', 'Break it down step by step']
}

function extractSolutionSteps(text: string): string[] {
  const stepsMatch = text.match(/Solution Steps?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (stepsMatch) {
    return stepsMatch[1]
      .split('\n')
      .map(step => step.replace(/^[-*•]\s*/, '').trim())
      .filter(step => step.length > 0)
  }
  return ['Step 1: Understand the problem', 'Step 2: Plan your approach', 'Step 3: Implement the solution']
}

function extractFeedback(text: string): string {
  const feedbackMatch = text.match(/Feedback[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return feedbackMatch ? feedbackMatch[1].trim() : 'Your code shows good understanding of the concepts.'
}

function extractSuggestions(text: string): string[] {
  const suggestionsMatch = text.match(/Suggestions?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (suggestionsMatch) {
    return suggestionsMatch[1]
      .split('\n')
      .map(suggestion => suggestion.replace(/^[-*•]\s*/, '').trim())
      .filter(suggestion => suggestion.length > 0)
  }
  return ['Consider adding error handling', 'Improve variable naming']
}

function extractScore(text: string): number {
  const scoreMatch = text.match(/Score[:\s]+(\d+)/i)
  return scoreMatch ? parseInt(scoreMatch[1]) : 7
}

function extractNextSteps(text: string): string {
  const nextStepsMatch = text.match(/Next Steps?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return nextStepsMatch ? nextStepsMatch[1].trim() : 'Try implementing the suggested improvements.'
}

function extractExplanation(text: string): string {
  const explanationMatch = text.match(/Explanation[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return explanationMatch ? explanationMatch[1].trim() : 'Let me explain this concept in simple terms.'
}

function extractExamples(text: string): string[] {
  const examplesMatch = text.match(/Examples?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (examplesMatch) {
    return examplesMatch[1]
      .split('\n')
      .map(example => example.replace(/^[-*•]\s*/, '').trim())
      .filter(example => example.length > 0)
  }
  return ['Email spam detection', 'Recommendation systems', 'Image recognition']
}

function extractAnalogies(text: string): string[] {
  const analogiesMatch = text.match(/Analogies?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (analogiesMatch) {
    return analogiesMatch[1]
      .split('\n')
      .map(analogy => analogy.replace(/^[-*•]\s*/, '').trim())
      .filter(analogy => analogy.length > 0)
  }
  return ['Like teaching a child to recognize animals', 'Similar to learning to ride a bike through practice']
}
