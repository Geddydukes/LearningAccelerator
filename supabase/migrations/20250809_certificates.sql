-- Employment-Ready Certificate System
-- Migration: 20250809_certificates.sql

-- Create certificates table
CREATE TABLE certificates (
    cert_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    track text,
    url text,
    issued_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Create policy for public verification
CREATE POLICY "public verify" ON certificates
    FOR SELECT USING (true);

-- Create policy for users to manage their own certificates
CREATE POLICY "users manage own certificates" ON certificates
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_issued_at ON certificates(issued_at);

-- Create function to check if user is employable
CREATE OR REPLACE FUNCTION check_employable(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_clo_competency boolean := false;
    has_portfolio_score boolean := false;
    has_career_match boolean := false;
    learning_months integer := 0;
    overall_competency numeric := 0;
    lighthouse_score numeric := 0;
    career_similarity numeric := 0;
BEGIN
    -- Check CLO competency (placeholder - replace with actual logic when gamification is implemented)
    -- For now, we'll use a placeholder that always returns true for demonstration
    has_clo_competency := true;
    
    -- Check learning months (placeholder)
    learning_months := 6; -- Placeholder value
    
    -- Check portfolio Lighthouse score (placeholder)
    lighthouse_score := 95; -- Placeholder value
    has_portfolio_score := lighthouse_score >= 90;
    
    -- Check career match similarity (placeholder)
    career_similarity := 0.85; -- Placeholder value
    has_career_match := career_similarity >= 0.80;
    
    -- Return true if all criteria are met
    RETURN has_clo_competency AND learning_months >= 6 AND has_portfolio_score AND has_career_match;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON certificates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON certificates TO authenticated;
GRANT EXECUTE ON FUNCTION check_employable TO authenticated; 