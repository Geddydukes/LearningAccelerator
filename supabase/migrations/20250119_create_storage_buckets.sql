-- Create storage buckets for the Wisely platform
-- This migration sets up all required buckets with proper RLS policies

-- Create prompts-compiled bucket (private, user-specific compiled prompts)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('prompts-compiled', 'prompts-compiled', false, 5242880, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;

-- Create ta-notes bucket (private, TA session notes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ta-notes', 'ta-notes', false, 10485760, ARRAY['application/json', 'text/markdown'])
ON CONFLICT (id) DO NOTHING;

-- Create diagnostics bucket (private, diagnostic reports)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('diagnostics', 'diagnostics', false, 20971520, ARRAY['application/json', 'text/markdown'])
ON CONFLICT (id) DO NOTHING;

-- Create career bucket (private, career matching data)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('career', 'career', false, 10485760, ARRAY['application/json', 'text/markdown'])
ON CONFLICT (id) DO NOTHING;

-- Create tracks bucket (public, track configurations)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tracks', 'tracks', true, 5242880, ARRAY['application/yaml', 'application/json'])
ON CONFLICT (id) DO NOTHING;

-- Create tts-audio bucket (private, cached audio files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tts-audio', 'tts-audio', false, 52428800, ARRAY['audio/mpeg', 'audio/wav'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for prompts-compiled bucket
CREATE POLICY "Users can read their own compiled prompts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'prompts-compiled' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own compiled prompts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'prompts-compiled' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own compiled prompts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'prompts-compiled' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for ta-notes bucket
CREATE POLICY "Users can read their own TA notes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'ta-notes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can manage TA notes" ON storage.objects
FOR ALL USING (
  bucket_id = 'ta-notes' AND 
  auth.role() = 'service_role'
);

-- RLS Policies for diagnostics bucket
CREATE POLICY "Users can read their own diagnostics" ON storage.objects
FOR SELECT USING (
  bucket_id = 'diagnostics' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can manage diagnostics" ON storage.objects
FOR ALL USING (
  bucket_id = 'diagnostics' AND 
  auth.role() = 'service_role'
);

-- RLS Policies for career bucket
CREATE POLICY "Users can read their own career data" ON storage.objects
FOR SELECT USING (
  bucket_id = 'career' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can manage career data" ON storage.objects
FOR ALL USING (
  bucket_id = 'career' AND 
  auth.role() = 'service_role'
);

-- RLS Policies for tts-audio bucket
CREATE POLICY "Users can read their own cached audio" ON storage.objects
FOR SELECT USING (
  bucket_id = 'tts-audio' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can manage audio cache" ON storage.objects
FOR ALL USING (
  bucket_id = 'tts-audio' AND 
  auth.role() = 'service_role'
);

-- Create additional database tables for tracking usage

-- TA Notes table
CREATE TABLE IF NOT EXISTS ta_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  track TEXT NOT NULL,
  level TEXT NOT NULL,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcription usage tracking
CREATE TABLE IF NOT EXISTS transcription_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES socratic_sessions(id) ON DELETE SET NULL,
  audio_length INTEGER NOT NULL,
  transcript_length INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TTS usage tracking (if not already exists)
CREATE TABLE IF NOT EXISTS tts_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ta_notes_user_week ON ta_notes(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_transcription_usage_user ON transcription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_usage_user_date ON tts_usage(user_id, date);

-- RLS policies for new tables
ALTER TABLE ta_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own TA notes" ON ta_notes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage TA notes" ON ta_notes
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own transcription usage" ON transcription_usage
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transcription usage" ON transcription_usage
FOR ALL USING (auth.role() = 'service_role'); 