import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function callEducationAgent(body: { event: string; payload?: any; week?: number; day?: number }) {
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;
  if (!userId) throw new Error('Not authenticated');
  const { data, error } = await supabase.functions.invoke('education-agent', {
    body: { userId, event: body.event, payload: body.payload, week: body.week, day: body.day }
  });
  if (error) throw error;
  return data as { ok: boolean } & Record<string, any>;
}


