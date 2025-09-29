-- Missing tables for education-agent functionality
-- Migration: 20250126_education_agent_missing_tables

-- Rate limit logs table (referenced by education-agent)
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Idempotency keys table (referenced by education-agent)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_user_endpoint ON rate_limit_logs(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at ON rate_limit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limit_logs
CREATE POLICY "Service role can manage rate limit logs" ON rate_limit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for idempotency_keys
CREATE POLICY "Service role can manage idempotency keys" ON idempotency_keys
  FOR ALL USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE rate_limit_logs IS 'Logs rate limiting requests for education-agent';
COMMENT ON TABLE idempotency_keys IS 'Stores idempotency results for education-agent requests';
