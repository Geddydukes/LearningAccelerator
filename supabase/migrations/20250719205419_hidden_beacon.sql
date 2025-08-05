/*
  # Create weekly notes schema

  1. New Tables
    - `weekly_notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `week_number` (integer)
      - `clo_briefing_note` (jsonb)
      - `socratic_conversation` (jsonb)
      - `lead_engineer_briefing_note` (jsonb)
      - `brand_strategy_package` (jsonb)
      - `completion_status` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `weekly_notes` table
    - Add policy for users to manage their own weekly notes
    - Add policy for authenticated users to read their own data

  3. Indexes
    - Index on user_id and week_number for efficient queries
    - Index on created_at for chronological sorting
*/

CREATE TABLE IF NOT EXISTS weekly_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_number integer NOT NULL,
  clo_briefing_note jsonb DEFAULT NULL,
  socratic_conversation jsonb DEFAULT NULL,
  lead_engineer_briefing_note jsonb DEFAULT NULL,
  brand_strategy_package jsonb DEFAULT NULL,
  completion_status jsonb DEFAULT '{
    "clo_completed": false,
    "socratic_completed": false,
    "alex_completed": false,
    "brand_completed": false,
    "overall_progress": 0
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE weekly_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own weekly notes"
  ON weekly_notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly notes"
  ON weekly_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly notes"
  ON weekly_notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly notes"
  ON weekly_notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_notes_user_week 
  ON weekly_notes(user_id, week_number);

CREATE INDEX IF NOT EXISTS idx_weekly_notes_created_at 
  ON weekly_notes(created_at DESC);

-- Create unique constraint to prevent duplicate weeks per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_notes_user_week_unique 
  ON weekly_notes(user_id, week_number);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_weekly_notes_updated_at
  BEFORE UPDATE ON weekly_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();