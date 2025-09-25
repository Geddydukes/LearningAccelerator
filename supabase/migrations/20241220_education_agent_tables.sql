-- Education Agent System Tables
-- This migration creates the necessary tables for the Education Agent system

-- Education Sessions table
CREATE TABLE IF NOT EXISTS education_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week INTEGER NOT NULL DEFAULT 1,
  day INTEGER NOT NULL DEFAULT 1,
  phase TEXT NOT NULL DEFAULT 'planning' CHECK (phase IN ('planning', 'lecture', 'check', 'practice_prep', 'practice', 'reflect', 'completed')),
  artifacts JSONB DEFAULT '{}',
  etag TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, week, day)
);

-- Program Plans table
CREATE TABLE IF NOT EXISTS program_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT '1.0',
  program_plan JSONB NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly Plans table
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_plan_id UUID REFERENCES program_plans(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  weekly_plan JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, week)
);

-- Coding Sessions table
CREATE TABLE IF NOT EXISTS coding_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'javascript',
  focus_areas TEXT[] DEFAULT '{}',
  week INTEGER,
  day INTEGER,
  file_system JSONB DEFAULT '{}',
  task_brief JSONB DEFAULT '{}',
  tests TEXT DEFAULT '',
  getting_started TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coding Runs table (for logging code execution)
CREATE TABLE IF NOT EXISTS coding_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  tests BOOLEAN DEFAULT FALSE,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coding Reviews table (for Alex agent reviews)
CREATE TABLE IF NOT EXISTS coding_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission JSONB NOT NULL,
  rubric JSONB NOT NULL,
  review JSONB NOT NULL,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Education Artifacts table (for storing session artifacts)
CREATE TABLE IF NOT EXISTS education_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  artifact_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_education_sessions_user_week_day ON education_sessions(user_id, week, day);
CREATE INDEX IF NOT EXISTS idx_education_sessions_phase ON education_sessions(phase);
CREATE INDEX IF NOT EXISTS idx_program_plans_user_accepted ON program_plans(user_id, accepted);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week ON weekly_plans(user_id, week);
CREATE INDEX IF NOT EXISTS idx_coding_sessions_user_status ON coding_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_coding_runs_session ON coding_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_coding_reviews_session ON coding_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_education_artifacts_session ON education_artifacts(session_id);

-- Row Level Security (RLS) policies
ALTER TABLE education_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_artifacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for education_sessions
CREATE POLICY "Users can view their own education sessions" ON education_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own education sessions" ON education_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education sessions" ON education_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education sessions" ON education_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for program_plans
CREATE POLICY "Users can view their own program plans" ON program_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own program plans" ON program_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own program plans" ON program_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own program plans" ON program_plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for weekly_plans
CREATE POLICY "Users can view their own weekly plans" ON weekly_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly plans" ON weekly_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly plans" ON weekly_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly plans" ON weekly_plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for coding_sessions
CREATE POLICY "Users can view their own coding sessions" ON coding_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coding sessions" ON coding_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coding sessions" ON coding_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coding sessions" ON coding_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for coding_runs
CREATE POLICY "Users can view their own coding runs" ON coding_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coding runs" ON coding_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for coding_reviews
CREATE POLICY "Users can view their own coding reviews" ON coding_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coding reviews" ON coding_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for education_artifacts
CREATE POLICY "Users can view their own education artifacts" ON education_artifacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_sessions 
      WHERE education_sessions.id = education_artifacts.session_id 
      AND education_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own education artifacts" ON education_artifacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM education_sessions 
      WHERE education_sessions.id = education_artifacts.session_id 
      AND education_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own education artifacts" ON education_artifacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM education_sessions 
      WHERE education_sessions.id = education_artifacts.session_id 
      AND education_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own education artifacts" ON education_artifacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM education_sessions 
      WHERE education_sessions.id = education_artifacts.session_id 
      AND education_sessions.user_id = auth.uid()
    )
  );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_education_sessions_updated_at 
  BEFORE UPDATE ON education_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_plans_updated_at 
  BEFORE UPDATE ON program_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_plans_updated_at 
  BEFORE UPDATE ON weekly_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coding_sessions_updated_at 
  BEFORE UPDATE ON coding_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE education_sessions IS 'Stores daily learning sessions for the Education Agent system';
COMMENT ON TABLE program_plans IS 'Stores multi-week program plans created by the CLO agent';
COMMENT ON TABLE weekly_plans IS 'Stores weekly learning plans derived from program plans';
COMMENT ON TABLE coding_sessions IS 'Stores coding workspace sessions for hands-on programming practice';
COMMENT ON TABLE coding_runs IS 'Logs code execution attempts and results';
COMMENT ON TABLE coding_reviews IS 'Stores Alex agent reviews of coding submissions';
COMMENT ON TABLE education_artifacts IS 'Stores various artifacts generated during learning sessions';
