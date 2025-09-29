import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GCResult {
  success: boolean;
  deleted_count: number;
  scanned_count: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🗑️ prompt_gc_started')

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get cutoff dates
    const compilationCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
    const invocationCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    console.log(`📅 Compilation cutoff: ${compilationCutoff.toISOString()}`)
    console.log(`📅 Invocation cutoff: ${invocationCutoff.toISOString()}`)

    // Get all referenced hashes from telemetry tables
    const { data: referencedHashes, error: hashError } = await supabaseClient
      .from('prompt_compilations')
      .select('hash')
      .gte('created_at', compilationCutoff.toISOString())

    if (hashError) {
      throw new Error(`Failed to fetch referenced hashes: ${hashError.message}`)
    }

    const { data: invokedHashes, error: invokeError } = await supabaseClient
      .from('prompt_invocations')
      .select('hash')
      .gte('created_at', invocationCutoff.toISOString())

    if (invokeError) {
      throw new Error(`Failed to fetch invoked hashes: ${invokeError.message}`)
    }

    // Combine all referenced hashes
    const keepHashes = new Set([
      ...referencedHashes.map(r => r.hash),
      ...invokedHashes.map(r => r.hash)
    ])

    console.log(`🔒 Keeping ${keepHashes.size} referenced hashes`)

    // List all objects in prompts-compiled bucket
    const { data: allObjects, error: listError } = await supabaseClient.storage
      .from('prompts-compiled')
      .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })

    if (listError) {
      throw new Error(`Failed to list compiled objects: ${listError.message}`)
    }

    console.log(`📂 Found ${allObjects.length} compiled objects`)

    let deletedCount = 0
    let scannedCount = 0
    const toDelete: string[] = []

    // Recursively scan all subdirectories
    async function scanDirectory(path: string = ''): Promise<void> {
      const { data: objects, error } = await supabaseClient.storage
        .from('prompts-compiled')
        .list(path, { limit: 1000 })

      if (error) {
        console.warn(`⚠️ Failed to list ${path}: ${error.message}`)
        return
      }

      for (const obj of objects) {
        const fullPath = path ? `${path}/${obj.name}` : obj.name
        scannedCount++

        if (obj.metadata?.size === undefined) {
          // This is a directory, scan recursively
          await scanDirectory(fullPath)
        } else {
          // This is a file, check if it should be deleted
          const filename = obj.name
          const hashMatch = filename.match(/^([a-f0-9]{64})\.txt$/)
          
          if (hashMatch) {
            const fileHash = hashMatch[1]
            const fileAge = new Date(obj.created_at)
            const isOld = fileAge < compilationCutoff
            
            if (isOld && !keepHashes.has(fileHash)) {
              toDelete.push(fullPath)
              console.log(`🗑️ Marking for deletion: ${fullPath} (${fileAge.toISOString()})`)
            }
          }
        }
      }
    }

    await scanDirectory()

    // Delete unreferenced objects
    if (toDelete.length > 0) {
      console.log(`🗑️ Deleting ${toDelete.length} unreferenced objects...`)
      
      for (const objectPath of toDelete) {
        const { error: deleteError } = await supabaseClient.storage
          .from('prompts-compiled')
          .remove([objectPath])

        if (deleteError) {
          console.warn(`⚠️ Failed to delete ${objectPath}: ${deleteError.message}`)
        } else {
          deletedCount++
          console.log(`✅ Deleted: ${objectPath}`)
        }
      }
    } else {
      console.log('✅ No objects to delete')
    }

    const result: GCResult = {
      success: true,
      deleted_count: deletedCount,
      scanned_count: scannedCount
    }

    console.log(`🎉 prompt_gc_completed: deleted ${deletedCount}/${scannedCount} objects`)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ prompt_gc_error:', error)
    
    const result: GCResult = {
      success: false,
      deleted_count: 0,
      scanned_count: 0,
      error: error.message
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
