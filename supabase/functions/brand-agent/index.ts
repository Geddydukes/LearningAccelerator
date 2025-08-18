import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BrandRequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: BrandRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load Brand prompt from storage
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download('brand_strategist_v3.yml')

    if (promptError) {
      throw new Error(`Failed to load Brand prompt: ${promptError.message}`)
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
      .replace(/{{BRAND_NAME}}/g, payload.brandName || 'Your Brand')
      .replace(/{{INDUSTRY}}/g, payload.industry || 'Technology')
      .replace(/{{TARGET_AUDIENCE}}/g, payload.targetAudience || 'General')
      .replace(/{{LEARNING_STYLE}}/g, userProfile?.learning_style || 'mixed')

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
      
      if (action === 'SUBMIT_BRIEFING') {
        return {
          success: true,
          data: {
            content_themes: extractContentThemes(responseText),
            kpi_metrics: extractKPIMetrics(responseText),
            social_content_suggestions: extractSocialContentSuggestions(responseText),
            brand_voice_analysis: extractBrandVoiceAnalysis(responseText),
            engagement_strategies: extractEngagementStrategies(responseText)
          }
        }
      } else if (action === 'CONTENT_OPTIMIZER') {
        return {
          success: true,
          data: {
            top_format: extractTopFormat(responseText),
            tweak_suggestion: extractTweakSuggestion(responseText),
            engagement_prediction: extractEngagementPrediction(responseText)
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
function extractContentThemes(text: string): string[] {
  const themesMatch = text.match(/Content Themes?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (themesMatch) {
    return themesMatch[1]
      .split('\n')
      .map(theme => theme.replace(/^[-*•]\s*/, '').trim())
      .filter(theme => theme.length > 0)
  }
  return ['Machine Learning Fundamentals', 'Practical Application', 'Continuous Learning']
}

function extractKPIMetrics(text: string): any[] {
  const metricsMatch = text.match(/KPI Metrics?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (metricsMatch) {
    const lines = metricsMatch[1].split('\n').filter(line => line.trim().length > 0)
    return lines.map(line => {
      const metricMatch = line.match(/^[-*•]\s*(.+?)[:\s]+(.+?)(?:\s+([↑↓→]))?$/i)
      return {
        metric: metricMatch ? metricMatch[1].trim() : line.trim(),
        value: metricMatch ? metricMatch[2].trim() : 'N/A',
        trend: metricMatch && metricMatch[3] ? metricMatch[3] : '→'
      }
    })
  }
  return [
    { metric: "Learning Progress", value: "75%", trend: "↑" },
    { metric: "Concept Mastery", value: "8/10", trend: "→" },
    { metric: "Project Completion", value: "3/5", trend: "↑" }
  ]
}

function extractSocialContentSuggestions(text: string): string[] {
  const suggestionsMatch = text.match(/Social Content Suggestions?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (suggestionsMatch) {
    return suggestionsMatch[1]
      .split('\n')
      .map(suggestion => suggestion.replace(/^[-*•]\s*/, '').trim())
      .filter(suggestion => suggestion.length > 0)
  }
  return ['Share your ML learning journey on LinkedIn', 'Post about the practical project you completed', 'Tweet about key insights from today\'s session']
}

function extractBrandVoiceAnalysis(text: string): string {
  const voiceMatch = text.match(/Brand Voice Analysis[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return voiceMatch ? voiceMatch[1].trim() : 'Professional and engaging, showing technical expertise while remaining approachable'
}

function extractEngagementStrategies(text: string): string[] {
  const strategiesMatch = text.match(/Engagement Strategies?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (strategiesMatch) {
    return strategiesMatch[1]
      .split('\n')
      .map(strategy => strategy.replace(/^[-*•]\s*/, '').trim())
      .filter(strategy => strategy.length > 0)
  }
  return ['Share weekly learning milestones', 'Post code snippets with explanations', 'Engage with the ML community']
}

function extractTopFormat(text: string): string {
  const formatMatch = text.match(/Top Format[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return formatMatch ? formatMatch[1].trim() : 'LinkedIn post with visual'
}

function extractTweakSuggestion(text: string): string {
  const tweakMatch = text.match(/Tweak Suggestion[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return tweakMatch ? tweakMatch[1].trim() : 'Add a personal story about your learning challenge'
}

function extractEngagementPrediction(text: string): string {
  const predictionMatch = text.match(/Engagement Prediction[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return predictionMatch ? predictionMatch[1].trim() : 'High engagement expected due to relatable content'
}
