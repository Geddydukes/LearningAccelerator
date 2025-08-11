-- Certificates System
-- Migration: 20250809_create_certificates.sql

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    cert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    track TEXT NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT now(),
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for certificates
CREATE POLICY "Users can view own certificates" ON certificates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificates" ON certificates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own certificates" ON certificates
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON certificates TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_track ON certificates(track);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at); 