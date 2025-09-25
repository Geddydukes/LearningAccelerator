import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export const codingClient = {
  async start(args: { language: 'ts'|'js'|'py'; focusAreas: string[]; rubric?: any; week?: number; day?: number }) {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase.functions.invoke('coding-workspace/start', {
      body: { userId, action: 'START', payload: args }
    });
    if (error) throw error;
    return data as { ok: boolean; data: { fs: Array<{ path: string; content: string }>; task_brief_md: string; getting_started_md: string } };
  },

  async run(args: { fs: Array<{ path: string; content: string }>; language: 'ts'|'js'|'py'; tests?: boolean }) {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase.functions.invoke('coding-workspace/run', {
      body: { userId, action: 'RUN', payload: args }
    });
    if (error) throw error;
    return data as { ok: boolean; data: { stdout?: string; stderr?: string; pass_count?: number; fail_count?: number } };
  },
};


