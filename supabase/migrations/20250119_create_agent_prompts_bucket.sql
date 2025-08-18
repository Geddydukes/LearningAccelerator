-- Create the agent-prompts storage bucket for storing agent prompts
-- This is a safe operation that won't affect existing data

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-prompts',
  'agent-prompts',
  true,
  10485760, -- 10MB limit
  ARRAY['application/x-yaml', 'text/yaml', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'agent-prompts');

CREATE POLICY "Service Role Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'agent-prompts');

CREATE POLICY "Service Role Update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'agent-prompts');

CREATE POLICY "Service Role Delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'agent-prompts');
