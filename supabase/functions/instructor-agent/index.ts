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

    // Load instructor prompt from storage (fallback to hardcoded if storage fails)
    let promptText;
    try {
      const { data: promptData, error: promptError } = await supabaseClient.storage
        .from('agent-prompts')
        .download('instructor_v2_1.yml')

      if (promptError) {
        console.log('Storage failed, using hardcoded prompt:', promptError.message);
        promptText = getHardcodedInstructorPrompt();
      } else {
        promptText = await promptData.text();
      }
    } catch (error) {
      console.log('Storage error, using hardcoded prompt:', error.message);
      promptText = getHardcodedInstructorPrompt();
    }

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

    // Map our actions to the prompt's expected commands
    let command;
    if (action === 'GET_DAILY_LESSON') {
      command = 'START_DAY';
    } else if (action === 'GET_NEXT_LESSON') {
      command = 'REPLAN_LIGHT';
    } else if (action === 'DELIVER_LECTURE') {
      command = 'DELIVER_LECTURE';
    } else if (action === 'CHECK_COMPREHENSION') {
      command = 'CHECK_COMPREHENSION';
    } else if (action === 'MODIFY_PRACTICE_PROMPTS') {
      command = 'MODIFY_PRACTICE_PROMPTS';
    }
    
    // Call Gemini API with formatted prompt
    const geminiResponse = await callGeminiAPI(formattedPrompt, command, payload, action)

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

async function callGeminiAPI(prompt: string, command: string, payload: any, originalAction: string) {
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
            text: `${prompt}\n\nCommand: ${command}\nPayload: ${JSON.stringify(payload)}\n\nGenerate a response based on the prompt instructions and command. Return structured data in JSON format.`
          }]
        }]
      })
    })

    const result = await response.json()
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const responseText = result.candidates[0].content.parts[0].text
      
      // Parse response based on action type
      return {
        success: true,
        data: parseInstructorResponse(responseText, originalAction, payload)
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

// Main response parser for instructor agent
function parseInstructorResponse(responseText: string, action: string, payload: any) {
  try {
    // Try to parse as JSON first
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    // If JSON parsing fails, create structured response
  }

  // Fallback structured response based on action
  switch (action) {
    case 'DELIVER_LECTURE':
      return {
        lecture_content: extractContent(responseText) || "Today we'll explore the foundational concepts of machine learning. We'll start with understanding what machine learning is, how it differs from traditional programming, and the different types of learning approaches.",
        key_concepts: extractKeyConcepts(responseText) || ["Supervised Learning", "Unsupervised Learning", "Model Training"],
        estimated_duration: extractDuration(responseText) || 20,
        next_phase: 'comprehension_check',
        lecture_id: `lecture-${Date.now()}`,
        difficulty_level: payload.difficultyLevel || 'intermediate'
      }
    case 'CHECK_COMPREHENSION':
      return {
        questions: extractComprehensionQuestions(responseText) || [
          { id: 'q1', question: 'What is the difference between supervised and unsupervised learning?' },
          { id: 'q2', question: 'Explain the concept of model training.' }
        ],
        user_understanding: extractUnderstandingLevel(responseText) || 'intermediate',
        next_phase: 'practice_preparation',
        assessment_id: `assessment-${Date.now()}`
      }
    case 'MODIFY_PRACTICE_PROMPTS':
      return {
        ta_prompt: extractTAPrompt(responseText) || "Modified TA prompt based on user understanding...",
        socratic_prompt: extractSocraticPrompt(responseText) || "Modified Socratic prompt based on user understanding...",
        practice_focus: extractPracticeFocus(responseText) || ["reinforcement", "application"],
        modification_id: `modification-${Date.now()}`
      }
    case 'GET_DAILY_LESSON':
    case 'GET_NEXT_LESSON':
    default:
      return {
        lesson_id: `daily-${payload.dayNumber || 1}`,
        title: extractTitle(responseText),
        objectives: extractObjectives(responseText),
        content: extractContent(responseText),
        exercises: extractExercises(responseText),
        estimated_duration: extractDuration(responseText),
        day_number: payload.dayNumber || 1,
        practice_options: [
          { type: 'socratic', title: 'Socratic Practice', description: 'Deep dive through questioning' },
          { type: 'ta', title: 'TA Session', description: 'Get help with exercises' }
        ]
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

function extractKeyConcepts(text: string): string[] {
  const conceptsMatch = text.match(/Key Concepts?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (conceptsMatch) {
    return conceptsMatch[1]
      .split('\n')
      .map(concept => concept.replace(/^[-*•]\s*/, '').trim())
      .filter(concept => concept.length > 0)
  }
  return ['Core concepts']
}

function extractComprehensionQuestions(text: string): Array<{id: string, question: string}> {
  const questionsMatch = text.match(/Questions?[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (questionsMatch) {
    return questionsMatch[1]
      .split('\n')
      .map((q, index) => ({
        id: `q${index + 1}`,
        question: q.replace(/^[-*•]\s*/, '').trim()
      }))
      .filter(q => q.question.length > 0)
  }
  return []
}

function extractUnderstandingLevel(text: string): string {
  const levelMatch = text.match(/Understanding Level[:\s]+([^\n]+)/i)
  return levelMatch ? levelMatch[1].trim().toLowerCase() : 'intermediate'
}

function extractTAPrompt(text: string): string {
  const taMatch = text.match(/TA Prompt[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return taMatch ? taMatch[1].trim() : 'Modified TA prompt based on user understanding...'
}

function extractSocraticPrompt(text: string): string {
  const socraticMatch = text.match(/Socratic Prompt[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  return socraticMatch ? socraticMatch[1].trim() : 'Modified Socratic prompt based on user understanding...'
}

function extractPracticeFocus(text: string): string[] {
  const focusMatch = text.match(/Practice Focus[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (focusMatch) {
    return focusMatch[1]
      .split('\n')
      .map(focus => focus.replace(/^[-*•]\s*/, '').trim())
      .filter(focus => focus.length > 0)
  }
  return ['reinforcement', 'application']
}
