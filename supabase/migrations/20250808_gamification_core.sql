-- Gamification Core System
-- Migration: 20250808_gamification_core.sql

-- Add XP column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 CHECK (xp >= 0);

-- Create streaks table
CREATE TABLE IF NOT EXISTS streaks (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    agent TEXT NOT NULL CHECK (agent IN ('CLO', 'Socratic', 'TA', 'Project')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, activity_date, agent)
);

-- Enable Row Level Security
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Create policies for streaks
CREATE POLICY "Users can view own streaks" ON streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create view for current streak days
CREATE OR REPLACE VIEW current_streak_days AS
WITH streak_data AS (
    SELECT 
        user_id,
        agent,
        activity_date,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, agent 
            ORDER BY activity_date DESC
        ) as rn
    FROM streaks
),
consecutive_days AS (
    SELECT 
        user_id,
        agent,
        activity_date,
        activity_date - (ROW_NUMBER() OVER (
            PARTITION BY user_id, agent 
            ORDER BY activity_date DESC
        )::INTEGER) as grp
    FROM streak_data
    WHERE rn = 1
),
streak_counts AS (
    SELECT 
        user_id,
        agent,
        COUNT(*) as days
    FROM consecutive_days
    GROUP BY user_id, agent, grp
    HAVING COUNT(*) >= 1
)
SELECT 
    user_id,
    agent,
    MAX(days) as current_streak_days
FROM streak_counts
GROUP BY user_id, agent;

-- Create function to log streak and increment XP
CREATE OR REPLACE FUNCTION log_streak(
    p_user_id UUID,
    p_agent TEXT,
    p_xp INTEGER DEFAULT 10
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert streak record
    INSERT INTO streaks (user_id, activity_date, agent)
    VALUES (p_user_id, CURRENT_DATE, p_agent)
    ON CONFLICT (user_id, activity_date, agent) DO NOTHING;
    
    -- Increment XP atomically
    UPDATE users 
    SET xp = xp + p_xp
    WHERE id = p_user_id;
    
    -- Ensure XP doesn't go negative
    UPDATE users 
    SET xp = GREATEST(xp, 0)
    WHERE id = p_user_id AND xp < 0;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT ON streaks TO authenticated;
GRANT SELECT ON current_streak_days TO authenticated;
GRANT EXECUTE ON FUNCTION log_streak TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_streaks_user_date ON streaks(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_streaks_agent ON streaks(agent);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp);

-- Insert some sample data for testing (optional)
-- INSERT INTO streaks (user_id, activity_date, agent) VALUES 
-- ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '3 days', 'CLO'),
-- ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 'Socratic'),
-- ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 'TA'),
-- ('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 'Project'); 