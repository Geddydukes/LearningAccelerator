import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolvePromptSpec, getBasePromptUrl, getCompiledPromptUrl } from '../_shared/manifest.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrackSyncRequest {
  agentId: string;
  userId: string;
  variables: Record<string, unknown>;
}

interface TrackSyncResponse {
  success: boolean;
  compiled_url?: string;
  compiled_object_path?: string;
  compiled_inline?: string;
  hash: string;
  cached: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agentId, userId, variables }: TrackSyncRequest = await req.json()

    // Validate required fields
    if (!agentId || !userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: agentId, userId' 
        } as TrackSyncResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`🔧 track_sync_started: ${agentId} for user ${userId}`)

    // Validate variables against schema
    const validationErrors = validateVariables(agentId, variables)
    if (validationErrors.length > 0) {
      console.error(`❌ variable_validation_failed: ${agentId}`, validationErrors)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Variable validation failed',
          validation_errors: validationErrors
        } as TrackSyncResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Resolve prompt specification from manifest
    const promptSpec = await resolvePromptSpec(agentId)
    console.log(`📋 prompt_spec_resolved: ${agentId} -> ${promptSpec.promptPath}`)

    // Fetch base prompt from storage
    const basePromptUrl = getBasePromptUrl(promptSpec.promptPath)
    const basePromptResponse = await fetch(basePromptUrl)
    
    if (!basePromptResponse.ok) {
      console.error(`❌ base_prompt_fetch_failed: ${agentId} -> ${basePromptResponse.status}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Base prompt not found: ${promptSpec.promptPath}` 
        } as TrackSyncResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const basePrompt = await basePromptResponse.text()
    console.log(`📄 base_prompt_loaded: ${agentId} (${basePrompt.length} chars)`)

    // Render variables (simple {{VAR}} replacement)
    const compiledPrompt = renderPrompt(basePrompt, variables)
    console.log(`🔨 prompt_compiled: ${agentId} with ${Object.keys(variables).length} variables`)

    // Compute hash
    const hash = await computeHash(basePrompt, variables, promptSpec.defaultPromptVersion || '1.0')
    console.log(`🔐 hash_computed: ${agentId} -> ${hash}`)

    // Check if compiled prompt already exists
    const objectPath = `${agentId}/${userId}/${hash}.txt`
    const { data: existingObject } = await supabaseClient.storage
      .from('prompts-compiled')
      .list(`${agentId}/${userId}`, { search: `${hash}.txt` })
    
    if (existingObject && existingObject.length > 0) {
      console.log(`✅ prompt_compiled_cached: ${agentId} -> ${hash}`)
      
      // Create 60-second signed URL for the existing compiled prompt
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
        .from('prompts-compiled')
        .createSignedUrl(objectPath, 60) // 60 seconds
      
      if (signedUrlError) {
        console.error(`❌ signed_url_creation_failed: ${agentId} -> ${signedUrlError.message}`)
        throw new Error(`Failed to create signed URL: ${signedUrlError.message}`)
      }
      
      // Log telemetry
      await logPromptCompilation(supabaseClient, userId, agentId, hash, promptSpec.defaultPromptVersion || '1.0', signedUrlData.signedUrl, variables)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          compiled_url: signedUrlData.signedUrl,
          compiled_object_path: objectPath,
          hash, 
          cached: true 
        } as TrackSyncResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Upload compiled prompt to storage
    try {
      const { error: uploadError } = await supabaseClient.storage
        .from('prompts-compiled')
        .upload(objectPath, new TextEncoder().encode(compiledPrompt), {
          cacheControl: 'private, max-age=31536000, immutable'
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log(`📤 prompt_compiled_uploaded: ${agentId} -> ${hash}`)
      
      // Create 60-second signed URL for the newly uploaded prompt
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
        .from('prompts-compiled')
        .createSignedUrl(objectPath, 60) // 60 seconds
      
      if (signedUrlError) {
        console.error(`❌ signed_url_creation_failed: ${agentId} -> ${signedUrlError.message}`)
        throw new Error(`Failed to create signed URL: ${signedUrlError.message}`)
      }
      
      // Log telemetry
      await logPromptCompilation(supabaseClient, userId, agentId, hash, promptSpec.defaultPromptVersion || '1.0', signedUrlData.signedUrl, variables)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          compiled_url: signedUrlData.signedUrl,
          compiled_object_path: objectPath,
          hash, 
          cached: false 
        } as TrackSyncResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )

    } catch (uploadError) {
      console.warn(`⚠️ prompt_upload_failed: ${agentId} -> ${uploadError.message}, falling back to inline`)
      
      // Fallback: return compiled prompt inline
      return new Response(
        JSON.stringify({ 
          success: true, 
          compiled_inline: compiledPrompt, 
          hash, 
          cached: false 
        } as TrackSyncResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

  } catch (error) {
    console.error('❌ track_sync_error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      } as TrackSyncResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Helper functions
function renderPrompt(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || ''
  })
}

async function computeHash(basePrompt: string, variables: Record<string, unknown>, version: string): Promise<string> {
  const data = basePrompt + JSON.stringify(variables) + version
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  
  // Use Web Crypto API for SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function logPromptCompilation(
  supabaseClient: any, 
  userId: string, 
  agentId: string, 
  hash: string, 
  version: string, 
  compiledUrl: string, 
  variables: Record<string, unknown>
): Promise<void> {
  try {
    const variablesFingerprint = Object.keys(variables).sort().join(',') + ':' + 
      await computeHash('', variables, '')
    
    await supabaseClient
      .from('prompt_compilations')
      .insert({
        user_id: userId,
        agent_id: agentId,
        hash,
        version,
        compiled_url: compiledUrl,
        variables_fingerprint: variablesFingerprint
      })
  } catch (error) {
    console.warn('⚠️ Failed to log prompt compilation:', error)
  }
}

// Simple variable validation (without external dependencies)
function validateVariables(agentId: string, variables: Record<string, unknown>): string[] {
  const errors: string[] = []
  
  // Define basic schemas inline to avoid import issues
  const schemas: Record<string, any> = {
    clo: {
      TRACK_LABEL: { type: 'string', required: true, min: 2 },
      TIME_PER_WEEK: { type: 'number', required: true, min: 1, max: 60 },
      END_GOAL: { type: 'string', required: true, min: 4, max: 200 },
      LEARNING_STYLE: { type: 'enum', required: true, values: ['visual', 'verbal', 'kinesthetic', 'mixed'] }
    },
    socratic: {
      WEEK_NUMBER: { type: 'number', required: true, min: 1, max: 52 }
    },
    alex: {
      WEEK_NUMBER: { type: 'number', required: true, min: 1, max: 52 }
    },
    brand: {
      WEEK_NUMBER: { type: 'number', required: true, min: 1, max: 52 }
    },
    ta: {
      WEEK_NUMBER: { type: 'number', required: true, min: 1, max: 52 }
    },
    instructor: {
      WEEK_NUMBER: { type: 'number', required: true, min: 1, max: 52 }
    },
    clarifier: {
      VAGUE_GOAL: { type: 'string', required: true, min: 10, max: 500 }
    },
    onboarder: {},
    career_match: {},
    portfolio_curator: {}
  }
  
  const schema = schemas[agentId]
  if (!schema) {
    return [`Unknown agent: ${agentId}`]
  }
  
  // Validate each field in the schema
  for (const [field, rules] of Object.entries(schema)) {
    const value = variables[field]
    
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${field}`)
      continue
    }
    
    if (value !== undefined && value !== null) {
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`Field ${field} must be a string`)
      } else if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`Field ${field} must be a number`)
      } else if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`Field ${field} must be an array`)
      } else if (rules.type === 'enum' && !rules.values.includes(value)) {
        errors.push(`Field ${field} must be one of: ${rules.values.join(', ')}`)
      }
      
      // Length/range validation
      if (rules.min !== undefined) {
        if (typeof value === 'string' && value.length < rules.min) {
          errors.push(`Field ${field} must be at least ${rules.min} characters`)
        } else if (typeof value === 'number' && value < rules.min) {
          errors.push(`Field ${field} must be at least ${rules.min}`)
        }
      }
      
      if (rules.max !== undefined) {
        if (typeof value === 'string' && value.length > rules.max) {
          errors.push(`Field ${field} must be at most ${rules.max} characters`)
        } else if (typeof value === 'number' && value > rules.max) {
          errors.push(`Field ${field} must be at most ${rules.max}`)
        }
      }
    }
  }
  
  return errors
} 