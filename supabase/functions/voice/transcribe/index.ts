/**
 * Voice Transcription Edge Function
 * 
 * Handles WAV file upload and OpenAI Whisper transcription:
 * 1. Validates Bearer JWT authentication
 * 2. Stores WAV file in tts-cache bucket
 * 3. Calls OpenAI Whisper v2 for transcription
 * 4. Saves transcript to tts-cache bucket
 * 5. Returns transcription status and text
 */

import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.192.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscribeRequest {
  id?: string;
  audio?: File;
}

interface TranscribeResponse {
  status: 'PENDING' | 'COMPLETED' | 'ERROR' | 'TIMEOUT';
  text?: string;
  error?: string;
}

interface WhisperResponse {
  text: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate Bearer JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { id } = await req.json() as TranscribeRequest

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Missing transcription ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if transcription is already completed
    const { data: existingTranscript } = await supabase.storage
      .from('tts-cache')
      .download(`${id}.txt`)

    if (existingTranscript) {
      const transcriptText = await existingTranscript.text()
      return new Response(
        JSON.stringify({
          status: 'COMPLETED',
          text: transcriptText
        } as TranscribeResponse),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if WAV file exists
    const { data: wavFile, error: wavError } = await supabase.storage
      .from('tts-cache')
      .download(`${id}.wav`)

    if (wavError || !wavFile) {
      return new Response(
        JSON.stringify({
          status: 'ERROR',
          error: 'Audio file not found'
        } as TranscribeResponse),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if transcription is in progress
    const { data: progressFile } = await supabase.storage
      .from('tts-cache')
      .download(`${id}.progress`)

    if (progressFile) {
      return new Response(
        JSON.stringify({
          status: 'PENDING'
        } as TranscribeResponse),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Mark transcription as in progress
    await supabase.storage
      .from('tts-cache')
      .upload(`${id}.progress`, new Blob(['processing'], { type: 'text/plain' }), {
        upsert: true
      })

    // Convert WAV to base64 for OpenAI API
    const wavArrayBuffer = await wavFile.arrayBuffer()
    const wavBase64 = btoa(String.fromCharCode(...new Uint8Array(wavArrayBuffer)))

    // Call OpenAI Whisper API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          status: 'ERROR',
          error: 'OpenAI API key not configured'
        } as TranscribeResponse),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if we should use mock transcription (for dev/CI)
    const mockWhisper = Deno.env.get('MOCK_WHISPER') === '1'
    
    let transcriptText: string
    
    if (mockWhisper) {
      // Generate mock transcript with SHA256 hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', wavArrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      transcriptText = `mock transcript ${hashHex.substring(0, 8)}`
    } else {
      // Call OpenAI Whisper API
      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'multipart/form-data',
        },
        body: new FormData().append('file', wavFile, 'audio.wav')
          .append('model', 'whisper-1')
          .append('language', 'en')
      })

      if (!whisperResponse.ok) {
        // Clean up progress file
        await supabase.storage
          .from('tts-cache')
          .remove([`${id}.progress`])

        return new Response(
          JSON.stringify({
            status: 'ERROR',
            error: `Whisper API error: ${whisperResponse.status}`
          } as TranscribeResponse),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const whisperData: WhisperResponse = await whisperResponse.json()
      transcriptText = whisperData.text
    }

    // Save transcript to storage
    await supabase.storage
      .from('tts-cache')
      .upload(`${id}.txt`, new Blob([transcriptText], { type: 'text/plain' }), {
        upsert: true
      })

    // Clean up progress file
    await supabase.storage
      .from('tts-cache')
      .remove([`${id}.progress`])

    console.log(`Transcription completed for ${id}: ${transcriptText.substring(0, 100)}...`)

    return new Response(
      JSON.stringify({
        status: 'COMPLETED',
        text: transcriptText
      } as TranscribeResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({
        status: 'ERROR',
        error: error.message
      } as TranscribeResponse),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 