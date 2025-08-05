import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, voice = 'Adam' } = await req.json()
    const authHeader = req.headers.get('Authorization')
    
    // Validate JWT and extract user_id
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    )
    if (authError || !user) throw new Error('Unauthorized')

    // Compute cache key
    const cacheKey = createHash("sha256").update(prompt + voice).toString()
    const filePath = `tts-cache/${user.id}/${cacheKey}.mp3`

    // Check cache
    const { data: existingFile } = await supabase.storage
      .from('tts-audio')
      .createSignedUrl(filePath, 86400) // 24h TTL

    if (existingFile?.signedUrl) {
      return new Response(JSON.stringify({
        text: prompt,
        audio_url: existingFile.signedUrl,
        cache_hit: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Rate limiting check (simplified - use Redis in production)
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('tts_usage')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('date', today)
    
    if (count >= 30) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Call ElevenLabs
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY')!
      },
      body: JSON.stringify({ text: prompt, model_id: 'eleven_monolingual_v1' })
    })

    if (!ttsResponse.ok) throw new Error('TTS service unavailable')

    const audioBuffer = await ttsResponse.arrayBuffer()
    
    // Store in cache
    await supabase.storage
      .from('tts-audio')
      .upload(filePath, audioBuffer, { contentType: 'audio/mpeg' })

    // Log usage
    await supabase.from('tts_usage').insert({ user_id: user.id, date: today })

    const { data: signedUrl } = await supabase.storage
      .from('tts-audio')
      .createSignedUrl(filePath, 86400)

    return new Response(JSON.stringify({
      text: prompt,
      audio_url: signedUrl?.signedUrl,
      cache_hit: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})