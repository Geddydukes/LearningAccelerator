import { serve } from "https://deno.land/std/http/server.ts";

interface StartArgs {
  action: 'START';
  payload: {
    language: 'ts'|'js'|'py';
    focusAreas: string[];
    rubric?: unknown;
    week?: number;
    day?: number;
  };
  userId: string;
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors() });
    if (req.method !== 'POST') return json({ ok: false, error: 'Method Not Allowed' }, 405);
    const body: StartArgs = await req.json();

    if (!body?.userId) return json({ ok: false, error: 'Missing userId' }, 400);
    const language = body.payload?.language || 'ts';

    const fs = bootstrapFs(language);
    const task_brief_md = `# Coding Practice\n\nFocus areas: ${body.payload?.focusAreas?.join(', ') || 'general'}\n\nImplement the function in src/index.${language === 'py' ? 'py' : 'ts'} and run tests.`;
    const getting_started_md = `## Getting Started\n\n- Edit files in the editor\n- Run tests via the Run Tests button\n- Ask TA for hints when stuck`;

    return json({ ok: true, data: { fs, task_brief_md, getting_started_md } });
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

function bootstrapFs(language: 'ts'|'js'|'py') {
  if (language === 'py') {
    return [
      { path: 'src/index.py', content: 'def add(a, b):\n    # TODO: implement\n    return a + b\n' },
      { path: 'tests/test_index.py', content: 'from src.index import add\n\ndef test_add():\n    assert add(1,2) == 3\n' },
    ];
  }
  const isTs = language === 'ts';
  return [
    { path: `src/index.${isTs ? 'ts' : 'js'}`, content: `${isTs ? 'export function add(a: number, b: number): number {\n  // TODO: implement\n  return a + b;\n}\n' : 'export function add(a, b) {\n  // TODO: implement\n  return a + b;\n}\n'}` },
    { path: `tests/index.test.${isTs ? 'ts' : 'js'}`, content: `${isTs ? `import { add } from '../src/index'\n\ntest('add', () => {\n  expect(add(1,2)).toBe(3)\n})\n` : `import { add } from '../src/index.js'\n\ntest('add', () => {\n  expect(add(1,2)).toBe(3)\n})\n'}` },
  ];
}


