import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlexRequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: AlexRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load Alex prompt from storage
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download('alex_v3.yml')

    if (promptError) {
      throw new Error(`Failed to load Alex prompt: ${promptError.message}`)
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
      .replace(/{{REPOSITORY_URL}}/g, payload.repositoryUrl || '')
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
      
      if (action === 'REVIEW_CODE') {
        return {
          success: true,
          data: {
            repository_url: payload.repositoryUrl,
            analysis_summary: extractAnalysisSummary(responseText),
            code_quality_score: extractCodeQualityScore(responseText),
            recommendations: extractRecommendations(responseText),
            technical_debt_items: extractTechnicalDebtItems(responseText),
            best_practices_followed: extractBestPracticesFollowed(responseText),
            areas_for_improvement: extractAreasForImprovement(responseText)
          }
        }
      } else if (action === 'DEPTH_ADVISOR') {
        return {
          success: true,
          data: {
            recommendation: extractRecommendation(responseText),
            reasoning: extractReasoning(responseText),
            estimated_review_time: extractEstimatedReviewTime(responseText)
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
function extractAnalysisSummary(text: string): string {
  const summaryMatch = text.match(/Analysis Summary[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return summaryMatch ? summaryMatch[1].trim() : 'Code analysis complete - good structure with room for improvement'
}

function extractCodeQualityScore(text: string): number {
  const scoreMatch = text.match(/Code Quality Score[:\s]+(\d+)/i)
  return scoreMatch ? parseInt(scoreMatch[1]) : 85
}

function extractRecommendations(text: string): string[] {
  const recommendationsMatch = text.match(/Recommendations?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (recommendationsMatch) {
    return recommendationsMatch[1]
      .split('\n')
      .map(rec => rec.replace(/^[-*•]\s*/, '').trim())
      .filter(rec => rec.length > 0)
  }
  return ['Add comprehensive error handling', 'Implement input validation', 'Consider adding unit tests']
}

function extractTechnicalDebtItems(text: string): string[] {
  const debtMatch = text.match(/Technical Debt[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (debtMatch) {
    return debtMatch[1]
      .split('\n')
      .map(item => item.replace(/^[-*•]\s*/, '').trim())
      .filter(item => item.length > 0)
  }
  return ['Hardcoded configuration values', 'Missing documentation']
}

function extractBestPracticesFollowed(text: string): string[] {
  const practicesMatch = text.match(/Best Practices[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (practicesMatch) {
    return practicesMatch[1]
      .split('\n')
      .map(practice => practice.replace(/^[-*•]\s*/, '').trim())
      .filter(practice => practice.length > 0)
  }
  return ['Clean code structure', 'Good separation of concerns']
}

function extractAreasForImprovement(text: string): string[] {
  const areasMatch = text.match(/Areas for Improvement[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (areasMatch) {
    return areasMatch[1]
      .split('\n')
      .map(area => area.replace(/^[-*•]\s*/, '').trim())
      .filter(area => area.length > 0)
  }
  return ['Error handling', 'Testing coverage', 'Documentation']
}

function extractRecommendation(text: string): string {
  const recMatch = text.match(/Recommendation[:\s]+(\w+)/i)
  return recMatch ? recMatch[1].toUpperCase() : 'STANDARD'
}

function extractReasoning(text: string): string {
  const reasoningMatch = text.match(/Reasoning[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return reasoningMatch ? reasoningMatch[1].trim() : 'Code shows intermediate complexity, standard review depth is appropriate'
}

function extractEstimatedReviewTime(text: string): string {
  const timeMatch = text.match(/Estimated Time[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return timeMatch ? timeMatch[1].trim() : '15-20 minutes'
}
