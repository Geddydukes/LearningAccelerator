-- Orchestrator v1.1 Migration
-- Migration: 20250119_orchestrator_v1_1

-- 1. learning_intents table
CREATE TABLE IF NOT EXISTS learning_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_label text,
  topic text NOT NULL,
  depth text NOT NULL CHECK (depth IN ('surface', 'informed', 'expert')),
  end_goal text NOT NULL,
  time_per_day_min int NOT NULL CHECK (time_per_day_min >= 20 AND time_per_day_min <= 180),
  user_tz text NOT NULL DEFAULT 'UTC',
  active boolean DEFAULT true,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. agent_signals_cache table
CREATE TABLE IF NOT EXISTS agent_signals_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week int,
  day int,
  topic text NOT NULL,
  clo jsonb,
  alex jsonb,
  ta jsonb,
  socratic jsonb,
  freshness jsonb NOT NULL DEFAULT '{}'::jsonb,
  etag jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. instructor_sessions table
CREATE TABLE IF NOT EXISTS instructor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  intent_id uuid NOT NULL REFERENCES learning_intents(id) ON DELETE CASCADE,
  week int NOT NULL,
  day int NOT NULL,
  plan_json jsonb NOT NULL,
  plan_md text NOT NULL,
  signal_quality jsonb NOT NULL DEFAULT '{}'::jsonb,
  research_summary jsonb,
  degraded_mode boolean DEFAULT false,
  completion jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ts timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_intents_user_active ON learning_intents(user_id, active);
CREATE INDEX IF NOT EXISTS idx_agent_signals_cache_user_week_day ON agent_signals_cache(user_id, week, day);
CREATE INDEX IF NOT EXISTS idx_instructor_sessions_user_created ON instructor_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_ts ON events(user_id, ts DESC);

-- Enable RLS on all tables
ALTER TABLE learning_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_signals_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_intents
CREATE POLICY "Users can read own intents" ON learning_intents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intents" ON learning_intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intents" ON learning_intents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all intents" ON learning_intents
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for agent_signals_cache
CREATE POLICY "Users can read own cache" ON agent_signals_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache" ON agent_signals_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cache" ON agent_signals_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all cache" ON agent_signals_cache
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for instructor_sessions
CREATE POLICY "Users can read own sessions" ON instructor_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON instructor_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON instructor_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions" ON instructor_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for events
CREATE POLICY "Users can read own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all events" ON events
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_learning_intents_updated_at 
  BEFORE UPDATE ON learning_intents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_signals_cache_updated_at 
  BEFORE UPDATE ON agent_signals_cache 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_sessions_updated_at 
  BEFORE UPDATE ON instructor_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to deactivate previous active intents
CREATE OR REPLACE FUNCTION deactivate_previous_intents(p_user_id uuid, p_new_intent_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE learning_intents 
  SET active = false 
  WHERE user_id = p_user_id 
    AND id != p_new_intent_id 
    AND active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active intent for user
CREATE OR REPLACE FUNCTION get_active_intent(p_user_id uuid)
RETURNS learning_intents AS $$
BEGIN
  RETURN (
    SELECT * FROM learning_intents 
    WHERE user_id = p_user_id AND active = true 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 