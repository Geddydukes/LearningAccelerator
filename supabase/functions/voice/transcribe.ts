import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscribeRequest {
  audioData: string; // base64 encoded audio
  sessionId?: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioData, sessionId, userId }: TranscribeRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate user
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error('Unauthorized user')
    }

    // Convert base64 to buffer
    const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))

    // Call OpenAI Whisper API
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'json')

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: formData
    })

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      throw new Error(`Whisper API error: ${whisperResponse.status} - ${errorText}`)
    }

    const whisperResult = await whisperResponse.json()
    const transcript = whisperResult.text

    // Store transcript in database if session provided
    if (sessionId) {
      await supabaseClient
        .from('messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: transcript,
          has_transcript: true,
          transcript: transcript
        })
    }

    // Log transcription usage
    await supabaseClient
      .from('transcription_usage')
      .insert({
        user_id: userId,
        session_id: sessionId,
        audio_length: audioBuffer.length,
        transcript_length: transcript.length,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          transcript,
          sessionId,
          confidence: whisperResult.confidence || 0.9
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Transcribe error:', error)
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