import { serve } from "https://deno.land/std/http/server.ts";

interface RunArgs {
  action: 'RUN';
  payload: {
    fs: Array<{ path: string; content: string }>;
    language: 'ts'|'js'|'py';
    tests?: boolean;
  };
  userId: string;
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors() });
    if (req.method !== 'POST') return json({ ok: false, error: 'Method Not Allowed' }, 405);
    const body: RunArgs = await req.json();
    if (!body?.userId) return json({ ok: false, error: 'Missing userId' }, 400);

    // MVP: we do not execute arbitrary code on the server. We simulate runner output.
    // Future: integrate webcontainers/pyodide client-side, or safe server runner.
    const stdout = body.payload?.tests ? 'Ran 1 test\n✓ add' : 'Program executed.';
    const stderr = '';

    return json({ ok: true, data: { stdout, stderr, pass_count: body.payload?.tests ? 1 : undefined, fail_count: 0 } });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };
}
function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors() } });
}


