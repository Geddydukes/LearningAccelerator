import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiter (in production, use Redis or database)
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_WINDOW = 5000 // 5 seconds

// Clean up old rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [userId, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(userId)
    }
  }
}, 600000) // 10 minutes

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

    // Rate limiting check
    const now = Date.now()
    const lastCall = rateLimitMap.get(userId)
    if (lastCall && (now - lastCall) < RATE_LIMIT_WINDOW) {
      console.log(`Rate limited for user ${userId}, last call was ${now - lastCall}ms ago`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limited. Please wait a few seconds before trying again.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        },
      )
    }
    
    // Update rate limit
    rateLimitMap.set(userId, now)

    console.log('CLO Agent called with:', { action, payload, userId })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Supabase client initialized')

    // Load CLO prompt from storage
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('prompts')
      .download('clo_v3.md')

    if (promptError || !promptData) {
      console.error('Prompt loading failed:', promptError)
      throw new Error(`Failed to load CLO prompt: ${promptError?.message || 'No prompt data'}`)
    }

    console.log('Prompt loaded successfully, size:', promptData.size)

    const promptText = await promptData.text()

    // Get user profile and context
    const { data: userProfile, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('User profile fetch failed:', userError)
      throw new Error(`Failed to fetch user profile: ${userError.message}`)
    }

    console.log('User profile fetched:', { name: userProfile?.name, focusAreas: userProfile?.learning_preferences?.focus_areas })

    // Get current week
    const currentWeek = Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))

    console.log('Current week calculated:', currentWeek)

    // Format prompt with user context
    const formattedPrompt = promptText
      .replace(/{{LEARNER_NAME}}/g, userProfile?.name || 'Learner')
      .replace(/{{TRACK_LABEL}}/g, userProfile?.learning_preferences?.focus_areas?.[0] || 'Full-Stack Development')
      .replace(/{{TIME_PER_WEEK}}/g, payload.timePerWeek || '5')
      .replace(/{{HARDWARE_SPECS}}/g, 'basic laptop') // Default since not stored
      .replace(/{{LEARNING_STYLE}}/g, userProfile?.learning_preferences?.preferred_interaction_style || 'mixed')
      .replace(/{{END_GOAL}}/g, 'Master full-stack development fundamentals') // Default since not stored
      .replace(/{{BUDGET_JSON}}/g, JSON.stringify({ budget: 0 })) // Default since not stored
      .replace(/{{CORE_COMPETENCY_BLOCK}}/g, 'Full-Stack Development, React, TypeScript, Web Technologies')
      .replace(/{{MONTH_GOALS_JSON}}/g, JSON.stringify({ goals: ['Build foundation', 'Complete projects', 'Master concepts'] }))

    console.log('Prompt formatted successfully')

    // Call Gemini API with formatted prompt
    const geminiResponse = await callGeminiAPI(formattedPrompt, action, payload, currentWeek)

    if (geminiResponse.success) {
      console.log('Gemini API call successful')
      return new Response(
        JSON.stringify({ success: true, data: geminiResponse.data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      console.error('Gemini API call failed:', geminiResponse.error)
      throw new Error(geminiResponse.error)
    }

  } catch (error) {
    console.error('CLO Agent error:', error)
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
    console.log('Starting Gemini API call...')
    
    const geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('VITE_GEMINI_API_KEY not configured')
      throw new Error('VITE_GEMINI_API_KEY not configured')
    }

    console.log('Gemini API key found, length:', geminiApiKey.length)

    // Map our actions to the prompt's expected commands
    let command;
    if (action === 'GET_DAILY_LESSON') {
      command = 'BEGIN_WEEK';
    } else if (action === 'GET_WEEKLY_PLAN') {
      command = 'BEGIN_WEEK';
    } else {
      command = action;
    }

    console.log('Command mapped:', { action, command })

    const geminiPrompt = `${prompt}\n\nCommand: ${command}\n\nGenerate a comprehensive weekly learning plan for week ${weekNumber}. Include all required sections from the prompt template.`

    console.log('Calling Gemini API...')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: geminiPrompt
            }]
          }]
        })
      }
    )

    console.log('Gemini API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error response:', errorText)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Gemini API response received, candidates:', data.candidates?.length || 0)
    console.log('Full Gemini API response:', JSON.stringify(data, null, 2))
    
    const generatedText = data.candidates[0]?.content?.parts[0]?.text || ''
    console.log('Generated text length:', generatedText.length)
    console.log('Generated text content:', generatedText)

    // Parse the response based on the action
    if (action === 'GET_DAILY_LESSON' || action === 'GET_WEEKLY_PLAN') {
      console.log('Extracting structured data from response...')
      return {
        success: true,
        data: {
          title: extractDailyTitle(generatedText) || 'Weekly Learning Module',
          description: extractWeeklyDescription(generatedText) || 'Comprehensive weekly learning plan',
          objectives: extractDailyObjectives(generatedText) || ['Master core concepts', 'Complete practical exercises', 'Build foundational knowledge'],
          key_concepts: extractKeyConcepts(generatedText) || ['Full-Stack Development Fundamentals', 'React Best Practices', 'TypeScript Programming'],
          resources: extractResources(generatedText) || ['Online tutorials', 'Documentation', 'Practice exercises'],
          content: generatedText, // Return the full generated content
          exercises: extractDailyExercises(generatedText) || ['Practice exercises', 'Mini-projects', 'Code challenges'],
          estimated_duration: extractDailyDuration(generatedText) || 25,
          weekly_summary: extractWeeklySummary(generatedText) || 'Weekly learning module with comprehensive coverage',
          daily_breakdown: extractDailyBreakdown(generatedText) || ['Day 1: Foundation', 'Day 2: Practice', 'Day 3: Application', 'Day 4: Review', 'Day 5: Assessment'],
          plan_duration: extractPlanDuration(generatedText) || 5,
          fullContent: generatedText // Store the complete response
        }
      }
    }

    return {
      success: true,
      data: {
        message: generatedText
      }
    }

  } catch (error) {
    console.error('callGeminiAPI error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Helper functions to extract information from Gemini response
function extractDailyTitle(text: string): string {
  // Look for various title patterns in the response
  const patterns = [
    /Weekly Theme[^\n]*: ([^\n]+)/i,
    /Week \d+[^\n]*: ([^\n]+)/i,
    /Module[^\n]*: ([^\n]+)/i,
    /^#\s*([^\n]+)/m
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  
  return 'Weekly Learning Module'
}

function extractWeeklyDescription(text: string): string {
  // Look for description after the title
  const titleMatch = extractDailyTitle(text)
  if (titleMatch !== 'Weekly Learning Module') {
    // Find the next few lines after the title for description
    const lines = text.split('\n')
    const titleIndex = lines.findIndex(line => line.includes(titleMatch))
    if (titleIndex >= 0 && titleIndex + 1 < lines.length) {
      const description = lines[titleIndex + 1].trim()
      if (description && !description.startsWith('**') && description.length > 10) {
        return description
      }
    }
  }
  return 'Comprehensive weekly learning plan'
}

function extractDailyObjectives(text: string): string[] {
  const patterns = [
    /SMART Learning Objectives[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /Learning Objectives[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /Objectives[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i
  ]
  
  for (const pattern of patterns) {
    const objectivesMatch = text.match(pattern)
    if (objectivesMatch) {
      const objectivesText = objectivesMatch[1]
      const objectives = objectivesText.match(/\d+\.\s*([^\n]+)/g)
      if (objectives && objectives.length > 0) {
        return objectives.map(obj => obj.replace(/\d+\.\s*/, '').trim()).filter(obj => obj.length > 5)
      }
    }
  }
  
  // Fallback: look for numbered lists that might be objectives
  const numberedLines = text.match(/\d+\.\s*([^\n]+)/g)
  if (numberedLines && numberedLines.length > 0) {
    return numberedLines.slice(0, 5).map(obj => obj.replace(/\d+\.\s*/, '').trim()).filter(obj => obj.length > 5)
  }
  
  return ['Master core concepts', 'Complete practical exercises', 'Build foundational knowledge']
}

function extractWeeklyObjectives(text: string): string[] {
  return extractDailyObjectives(text)
}

function extractKeyConcepts(text: string): string[] {
  const patterns = [
    /Core Theoretical Concepts[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /Key Concepts[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /Theoretical Concepts[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i
  ]
  
  for (const pattern of patterns) {
    const conceptsMatch = text.match(pattern)
    if (conceptsMatch) {
      const conceptsText = conceptsMatch[1]
      const concepts = conceptsText.match(/\d+\.\s*([^\n]+)/g)
      if (concepts && concepts.length > 0) {
        return concepts.map(concept => concept.replace(/\d+\.\s*/, '').trim()).filter(concept => concept.length > 5)
      }
    }
  }
  
  return ['Full-Stack Development Fundamentals', 'React Best Practices', 'TypeScript Programming']
}

function extractResources(text: string): string[] {
  const patterns = [
    /Curated Resources[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /Resources[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /Learning Resources[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i
  ]
  
  for (const pattern of patterns) {
    const resourcesMatch = text.match(pattern)
    if (resourcesMatch) {
      const resourcesText = resourcesMatch[1]
      const resources = resourcesText.match(/\d+\.\s*([^\n]+)/g)
      if (resources && resources.length > 0) {
        return resources.map(resource => resource.replace(/\d+\.\s*/, '').trim()).filter(resource => resource.length > 5)
      }
    }
  }
  
  return ['Online tutorials', 'Documentation', 'Practice exercises']
}

function extractDailyContent(text: string): string {
  // Return a summary of the content instead of the full text
  const lines = text.split('\n').slice(0, 10) // First 10 lines
  return lines.join('\n').trim()
}

function extractDailyExercises(text: string): string[] {
  const patterns = [
    /Capstone Project[^\n]*:([\s\S]*?)(?=\n\n|$)/i,
    /Practice Exercises[^\n]*:([\s\S]*?)(?=\n\n|$)/i,
    /Exercises[^\n]*:([\s\S]*?)(?=\n\n|$)/i
  ]
  
  for (const pattern of patterns) {
    const exercisesMatch = text.match(pattern)
    if (exercisesMatch) {
      const exercisesText = exercisesMatch[1]
      const exercises = exercisesText.match(/\d+\.\s*([^\n]+)/g)
      if (exercises && exercises.length > 0) {
        return exercises.map(exercise => exercise.replace(/\d+\.\s*/, '').trim()).filter(exercise => exercise.length > 5)
      }
    }
  }
  
  return ['Practice exercises', 'Mini-projects', 'Code challenges']
}

function extractDailyDuration(text: string): number {
  // Look for duration patterns in the text
  const patterns = [
    /(\d+)\s*minutes?/i,
    /(\d+)\s*mins?/i,
    /(\d+)\s*hours?/i,
    /(\d+)\s*hrs?/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const duration = parseInt(match[1])
      if (duration > 0) {
        // Convert hours to minutes if needed
        if (text.toLowerCase().includes('hour') || text.toLowerCase().includes('hr')) {
          return duration * 60
        }
        return duration
      }
    }
  }
  
  return 25 // Default to 25 minutes
}

function extractWeeklySummary(text: string): string {
  const title = extractDailyTitle(text)
  if (title !== 'Weekly Learning Module') {
    return title
  }
  return 'Weekly learning module with comprehensive coverage'
}

function extractDailyBreakdown(text: string): string[] {
  const patterns = [
    /Daily Socratic Prompts[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /Daily Breakdown[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /Week Schedule[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i
  ]
  
  for (const pattern of patterns) {
    const breakdownMatch = text.match(pattern)
    if (breakdownMatch) {
      const breakdownText = breakdownMatch[1]
      const breakdown = breakdownText.match(/\d+\.\s*([^\n]+)/g)
      if (breakdown && breakdown.length > 0) {
        return breakdown.map(item => item.replace(/\d+\.\s*/, '').trim()).filter(item => item.length > 5)
      }
    }
  }
  
  return ['Day 1: Foundation', 'Day 2: Practice', 'Day 3: Application', 'Day 4: Review', 'Day 5: Assessment']
}

function extractPlanDuration(text: string): number {
  // Look for week duration patterns
  const patterns = [
    /Week (\d+)/i,
    /(\d+)\s*weeks?/i,
    /(\d+)\s*days?/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const duration = parseInt(match[1])
      if (duration > 0 && duration <= 7) {
        return duration
      }
    }
  }
  
  return 5 // Default to 5 days
}
