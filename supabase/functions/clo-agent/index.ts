import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CLORequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: CLORequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load CLO prompt from storage
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download('clo_v3.yml')

    if (promptError) {
      throw new Error(`Failed to load CLO prompt: ${promptError.message}`)
    }

    const promptText = await promptData.text()

    // Get user profile and context
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Get current week
    const currentWeek = Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))

    // Format prompt with user context
    const formattedPrompt = promptText
      .replace(/{{LEARNER_NAME}}/g, userProfile?.full_name || 'Learner')
      .replace(/{{TRACK_LABEL}}/g, userProfile?.track_label || 'AI/ML Engineering')
      .replace(/{{TIME_PER_WEEK}}/g, payload.timePerWeek || '5')
      .replace(/{{HARDWARE_SPECS}}/g, userProfile?.hardware_specs || 'basic laptop')
      .replace(/{{LEARNING_STYLE}}/g, userProfile?.learning_style || 'mixed')
      .replace(/{{END_GOAL}}/g, userProfile?.end_goal || 'Master machine learning fundamentals')
      .replace(/{{BUDGET_JSON}}/g, JSON.stringify({ budget: userProfile?.budget || 0 }))

    // Call Gemini API with formatted prompt
    const geminiResponse = await callGeminiAPI(formattedPrompt, action, payload, currentWeek)

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

async function callGeminiAPI(prompt: string, action: string, payload: any, weekNumber: number) {
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
            text: `${prompt}\n\nAction: ${action}\nWeek: ${weekNumber}\nPayload: ${JSON.stringify(payload)}\n\nGenerate a response based on the prompt instructions.`
          }]
        }]
      })
    })

    const result = await response.json()
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const responseText = result.candidates[0].content.parts[0].text
      
      if (action === 'GET_DAILY_LESSON') {
        return {
          success: true,
          data: {
            lesson_id: `lesson-${weekNumber}-${payload.dayNumber || 1}`,
            title: extractTitle(responseText),
            objectives: extractObjectives(responseText),
            content: extractContent(responseText),
            exercises: extractExercises(responseText),
            duration: extractDuration(responseText),
            day_number: payload.dayNumber || 1
          }
        }
      } else if (action === 'GET_WEEKLY_PLAN') {
        return {
          success: true,
          data: {
            plan_id: `plan-${weekNumber}`,
            title: extractPlanTitle(responseText),
            description: extractDescription(responseText),
            weekly_summary: extractWeeklySummary(responseText),
            objectives: extractObjectives(responseText),
            key_concepts: extractKeyConcepts(responseText),
            daily_breakdown: extractDailyBreakdown(responseText),
            resources: extractResources(responseText),
            estimated_duration: extractPlanDuration(responseText),
            week_number: weekNumber
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
function extractTitle(text: string): string {
  const titleMatch = text.match(/Title[:\s]+([^\n]+)/i)
  return titleMatch ? titleMatch[1].trim() : 'Daily Learning Session'
}

function extractPlanTitle(text: string): string {
  const titleMatch = text.match(/Weekly Theme[:\s]+([^\n]+)/i)
  return titleMatch ? titleMatch[1].trim() : 'Weekly Learning Plan'
}

function extractDescription(text: string): string {
  const descMatch = text.match(/Description[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return descMatch ? descMatch[1].trim() : 'Weekly learning objectives and content.'
}

function extractWeeklySummary(text: string): string {
  const summaryMatch = text.match(/Weekly Summary[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return summaryMatch ? summaryMatch[1].trim() : 'Weekly learning overview.'
}

function extractObjectives(text: string): string[] {
  const objectivesMatch = text.match(/Objectives?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (objectivesMatch) {
    return objectivesMatch[1]
      .split('\n')
      .map(obj => obj.replace(/^[-*•]\s*/, '').trim())
      .filter(obj => obj.length > 0)
  }
  return ['Complete weekly objectives']
}

function extractKeyConcepts(text: string): string[] {
  const conceptsMatch = text.match(/Key Concepts?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (conceptsMatch) {
    return conceptsMatch[1]
      .split('\n')
      .map(concept => concept.replace(/^[-*•]\s*/, '').trim())
      .filter(concept => concept.length > 0)
  }
  return ['Key concepts']
}

function extractDailyBreakdown(text: string): any[] {
  const breakdownMatch = text.match(/Daily Breakdown[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (breakdownMatch) {
    const lines = breakdownMatch[1].split('\n').filter(line => line.trim().length > 0)
    return lines.map((line, index) => {
      const dayMatch = line.match(/Day (\d+)[:\s]+(.+)/i)
      const durationMatch = line.match(/(\d+)\s*min/i)
      return {
        day: dayMatch ? parseInt(dayMatch[1]) : index + 1,
        focus: dayMatch ? dayMatch[2].trim() : line.trim(),
        duration: durationMatch ? `${durationMatch[1]} min` : '30 min'
      }
    })
  }
  return [
    { day: 1, focus: 'Learning Fundamentals', duration: '30 min' },
    { day: 2, focus: 'Practical Application', duration: '30 min' },
    { day: 3, focus: 'Advanced Concepts', duration: '30 min' },
    { day: 4, focus: 'Project Work', duration: '30 min' },
    { day: 5, focus: 'Review & Assessment', duration: '30 min' }
  ]
}

function extractResources(text: string): any[] {
  const resourcesMatch = text.match(/Resources?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (resourcesMatch) {
    const lines = resourcesMatch[1].split('\n').filter(line => line.trim().length > 0)
    return lines.map(line => {
      const typeMatch = line.match(/^[-*•]\s*(\w+)[:\s]+(.+)/i)
      return {
        type: typeMatch ? typeMatch[1] : 'Resource',
        title: typeMatch ? typeMatch[2].trim() : line.trim(),
        url: '#',
        description: typeMatch ? typeMatch[2].trim() : line.trim()
      }
    })
  }
  return [{ type: 'Course', title: 'Learning Materials', url: '#', description: 'Course materials' }]
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

function extractPlanDuration(text: string): number {
  const durationMatch = text.match(/Estimated Duration[:\s]+(\d+)/i)
  return durationMatch ? parseInt(durationMatch[1]) : 150
}
