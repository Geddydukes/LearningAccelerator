-- Create storage buckets for prompt management
-- 20250819_prompts_buckets.sql

-- Create the storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('prompts-base', 'prompts-base', true, 1048576, ARRAY['text/plain', 'text/markdown', 'text/yaml', 'application/xml']),
  ('prompts-manifest', 'prompts-manifest', true, 1048576, ARRAY['application/json']),
  ('prompts-compiled', 'prompts-compiled', false, 1048576, ARRAY['text/plain']);

-- Create RLS policies for prompts-base bucket (public read, immutable)
CREATE POLICY "Public read access to prompts-base" ON storage.objects
  FOR SELECT USING (bucket_id = 'prompts-base');

CREATE POLICY "Service role can manage prompts-base" ON storage.objects
  FOR ALL USING (bucket_id = 'prompts-base' AND auth.role() = 'service_role');

-- Create RLS policies for prompts-manifest bucket (public read, service role write)
CREATE POLICY "Public read access to prompts-manifest" ON storage.objects
  FOR SELECT USING (bucket_id = 'prompts-manifest');

CREATE POLICY "Service role can manage prompts-manifest" ON storage.objects
  FOR ALL USING (bucket_id = 'prompts-manifest' AND auth.role() = 'service_role');

-- Create RLS policies for prompts-compiled bucket (private, service role only)
CREATE POLICY "Service role can manage prompts-compiled" ON storage.objects
  FOR ALL USING (bucket_id = 'prompts-compiled' AND auth.role() = 'service_role');

-- Forbid anonymous users from writing to any prompt bucket
CREATE POLICY "Anon cannot write to prompt buckets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('prompts-base', 'prompts-manifest', 'prompts-compiled') 
    AND auth.role() != 'anon'
  );

CREATE POLICY "Anon cannot update prompt buckets" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('prompts-base', 'prompts-manifest', 'prompts-compiled') 
    AND auth.role() != 'anon'
  );

CREATE POLICY "Anon cannot delete from prompt buckets" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('prompts-base', 'prompts-manifest', 'prompts-compiled') 
    AND auth.role() != 'anon'
  );

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
