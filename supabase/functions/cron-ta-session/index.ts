import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TASessionRequest {
  userId: string;
  weekNumber: number;
  cloData?: any;
  socraticData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, weekNumber, cloData, socraticData }: TASessionRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's current track and level
    const { data: user } = await supabaseClient
      .from('users')
      .select('current_track, track_level, track_goals')
      .eq('id', userId)
      .single()

    if (!user?.current_track) {
      throw new Error('User has no active track')
    }

    // Load TA prompt template
    const { data: taPrompt, error: promptError } = await supabaseClient.storage
      .from('prompts')
      .download('ta_v3_template.md')

    if (promptError) {
      throw new Error(`Failed to load TA prompt: ${promptError.message}`)
    }

    const promptTemplate = await taPrompt.text()

    // Initialize Gemini API
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-pro-exp' })

    // Compile TA prompt with context
    const taPromptWithContext = promptTemplate
      .replace(/{{TRACK_LABEL}}/g, user.current_track)
      .replace(/{{TRACK_LEVEL}}/g, user.track_level || 'beginner')
      .replace(/{{WEEK_NUMBER}}/g, weekNumber.toString())
      .replace(/{{CLO_CONTEXT}}/g, JSON.stringify(cloData || {}))
      .replace(/{{SOCRATIC_CONTEXT}}/g, JSON.stringify(socraticData || {}))

    // Generate TA session note
    const result = await model.generateContent(taPromptWithContext)
    const response = await result.response
    const taNote = response.text()

    // Parse JSON response from TA
    const jsonMatch = taNote.match(/```json\s*([\s\S]*?)\s*```/)
    let structuredData

    if (jsonMatch) {
      try {
        structuredData = JSON.parse(jsonMatch[1])
      } catch (e) {
        console.warn('Failed to parse TA JSON response:', e)
        structuredData = { raw_response: taNote }
      }
    } else {
      structuredData = { raw_response: taNote }
    }

    // Save TA session note
    const { error: saveError } = await supabaseClient
      .from('ta_notes')
      .insert({
        user_id: userId,
        week_number: weekNumber,
        track: user.current_track,
        level: user.track_level,
        content: structuredData,
        generated_at: new Date().toISOString()
      })

    if (saveError) {
      throw new Error(`Failed to save TA note: ${saveError.message}`)
    }

    // Update weekly notes with TA completion
    await supabaseClient
      .from('weekly_notes')
      .upsert({
        user_id: userId,
        week_number: weekNumber,
        ta_session_note: structuredData,
        completion_status: {
          ta_completed: true,
          overall_progress: 100
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,week_number'
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          taNote: structuredData,
          weekNumber,
          track: user.current_track,
          generatedAt: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('TA session error:', error)
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