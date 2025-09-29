-- Create learner_tracks table
CREATE TABLE IF NOT EXISTS learner_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_label TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_week INTEGER NOT NULL DEFAULT 1,
  current_day INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  prefs_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create module_instances table
CREATE TABLE IF NOT EXISTS module_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_track_id UUID NOT NULL REFERENCES learner_tracks(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  day INTEGER NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('plan_approved', 'socratic_complete', 'ta_complete', 'alex_complete', 'day_complete')),
  plan_hash TEXT,
  agent_flags_json JSONB DEFAULT '{}',
  completion_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(learner_track_id, week, day)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learner_tracks_user_id ON learner_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_tracks_status ON learner_tracks(status);
CREATE INDEX IF NOT EXISTS idx_module_instances_track_id ON module_instances(learner_track_id);
CREATE INDEX IF NOT EXISTS idx_module_instances_week_day ON module_instances(week, day);

-- Enable Row Level Security
ALTER TABLE learner_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learner_tracks
CREATE POLICY "Users can view their own tracks" ON learner_tracks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracks" ON learner_tracks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks" ON learner_tracks
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for module_instances
CREATE POLICY "Users can view their own module instances" ON module_instances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learner_tracks 
      WHERE learner_tracks.id = module_instances.learner_track_id 
      AND learner_tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own module instances" ON module_instances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM learner_tracks 
      WHERE learner_tracks.id = module_instances.learner_track_id 
      AND learner_tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own module instances" ON module_instances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM learner_tracks 
      WHERE learner_tracks.id = module_instances.learner_track_id 
      AND learner_tracks.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_learner_tracks_updated_at 
  BEFORE UPDATE ON learner_tracks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_instances_updated_at 
  BEFORE UPDATE ON module_instances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO learner_tracks (user_id, track_label, current_week, current_day) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'AI/ML Engineering', 1, 1);
