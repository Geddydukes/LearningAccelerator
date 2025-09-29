import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RunCodeBody {
  userId: string;
  sessionId: string;
  payload?: {
    fs?: any[];
    tests?: boolean;
    language?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') return error('Method Not Allowed', 405);
    
    const body: RunCodeBody = await req.json();
    if (!body?.userId || !body?.sessionId) return error('Missing userId or sessionId', 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get coding session
    const { data: session, error: sessionError } = await supabase
      .from('coding_sessions')
      .select('*')
      .eq('id', body.sessionId)
      .eq('user_id', body.userId)
      .single();

    if (sessionError || !session) {
      return error('Coding session not found', 404);
    }

    const { fs = [], tests = false, language = session.language } = body.payload || {};

    // Update file system
    await updateFileSystem(supabase, body.sessionId, fs);

    // Run code execution
    const result = await executeCode(fs, tests, language);

    // Log the run
    await logCodeRun(supabase, {
      sessionId: body.sessionId,
      userId: body.userId,
      language,
      tests,
      result,
    });

    return ok({
      result,
      sessionId: body.sessionId,
      etag: generateETag(),
    });

  } catch (error) {
    console.error('Coding Workspace Run error:', error);
    return error(error.message);
  }
});

async function updateFileSystem(supabase: any, sessionId: string, fs: any[]) {
  const { error } = await supabase
    .from('coding_sessions')
    .update({
      file_system: fs,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to update file system:', error);
  }
}

async function executeCode(fs: any[], tests: boolean, language: string) {
  // Create a temporary directory structure
  const tempDir = `/tmp/coding-${Date.now()}`;
  
  try {
    // Write files to temp directory
    await writeFilesToTemp(tempDir, fs);
    
    // Execute based on language and test flag
    if (tests) {
      return await runTests(tempDir, language);
    } else {
      return await runMain(tempDir, language);
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: '',
      exitCode: 1,
    };
  } finally {
    // Cleanup temp directory
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch (e) {
      console.warn('Failed to cleanup temp directory:', e);
    }
  }
}

async function writeFilesToTemp(tempDir: string, fs: any[]) {
  await Deno.mkdir(tempDir, { recursive: true });
  
  for (const file of fs) {
    const filePath = `${tempDir}/${file.name}`;
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    
    if (dir !== tempDir) {
      await Deno.mkdir(dir, { recursive: true });
    }
    
    await Deno.writeTextFile(filePath, file.content);
  }
}

async function runTests(tempDir: string, language: string) {
  const commands = {
    javascript: ['npm', 'test'],
    typescript: ['npm', 'test'],
    python: ['python', '-m', 'pytest', '-v'],
  };

  const command = commands[language] || commands.javascript;
  
  try {
    const process = new Deno.Command(command[0], {
      args: command.slice(1),
      cwd: tempDir,
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code, stdout, stderr } = await process.output();
    
    return {
      success: code === 0,
      output: new TextDecoder().decode(stdout),
      error: new TextDecoder().decode(stderr),
      exitCode: code,
      type: 'tests',
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.message,
      exitCode: 1,
      type: 'tests',
    };
  }
}

async function runMain(tempDir: string, language: string) {
  const commands = {
    javascript: ['node', 'index.js'],
    typescript: ['npx', 'ts-node', 'index.ts'],
    python: ['python', 'main.py'],
  };

  const command = commands[language] || commands.javascript;
  
  try {
    const process = new Deno.Command(command[0], {
      args: command.slice(1),
      cwd: tempDir,
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code, stdout, stderr } = await process.output();
    
    return {
      success: code === 0,
      output: new TextDecoder().decode(stdout),
      error: new TextDecoder().decode(stderr),
      exitCode: code,
      type: 'main',
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.message,
      exitCode: 1,
      type: 'main',
    };
  }
}

async function logCodeRun(supabase: any, data: any) {
  const runData = {
    session_id: data.sessionId,
    user_id: data.userId,
    language: data.language,
    tests: data.tests,
    result: data.result,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('coding_runs')
    .insert(runData);

  if (error) {
    console.error('Failed to log code run:', error);
  }
}

function generateETag(): string {
  return `W/"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`;
}

function ok(data: any) {
  return new Response(
    JSON.stringify({ success: true, data }),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }, 
      status: 200 
    }
  );
}

function error(msg: string, status = 500) {
  return new Response(
    JSON.stringify({ success: false, error: msg }),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }, 
      status 
    }
  );
}