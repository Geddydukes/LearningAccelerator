-- Create prompt telemetry tables
-- 20250819_prompt_telemetry.sql

-- Table for tracking prompt compilations
CREATE TABLE IF NOT EXISTS prompt_compilations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  hash TEXT NOT NULL,
  version TEXT,
  compiled_url TEXT,
  variables_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking prompt invocations
CREATE TABLE IF NOT EXISTS prompt_invocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  hash TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  success_bool BOOLEAN NOT NULL,
  error_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_compilations_user_agent ON prompt_compilations(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_prompt_compilations_hash ON prompt_compilations(hash);
CREATE INDEX IF NOT EXISTS idx_prompt_compilations_created ON prompt_compilations(created_at);

CREATE INDEX IF NOT EXISTS idx_prompt_invocations_user_agent ON prompt_invocations(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_prompt_invocations_hash ON prompt_invocations(hash);
CREATE INDEX IF NOT EXISTS idx_prompt_invocations_created ON prompt_invocations(created_at);

-- RLS policies
ALTER TABLE prompt_compilations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_invocations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own telemetry
CREATE POLICY "Users can view own prompt compilations" ON prompt_compilations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own prompt invocations" ON prompt_invocations
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert telemetry
CREATE POLICY "Service role can insert prompt compilations" ON prompt_compilations
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert prompt invocations" ON prompt_invocations
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Service role can update telemetry
CREATE POLICY "Service role can update prompt compilations" ON prompt_compilations
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update prompt invocations" ON prompt_invocations
  FOR UPDATE USING (auth.role() = 'service_role');
