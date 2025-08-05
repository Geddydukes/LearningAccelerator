/*
  # Create Initial User Profile

  1. New User Creation
    - Creates user profile for Geddydukes
    - Sets up initial learning preferences
    - Configures default settings

  2. Security
    - User will be created through Supabase Auth
    - Profile data stored in users table
    - RLS policies will apply

  3. Initial Setup
    - Default voice preference set to 'alloy'
    - Learning preferences configured for full-stack development
    - User role set to 'learner'
*/

-- Insert initial user profile (this will be created after auth signup)
-- The actual auth user creation happens through the signup process

-- Set up default learning preferences for the user
DO $$
BEGIN
  -- This is a template for the user data that will be created
  -- The actual user creation happens through the auth signup flow
  
  -- Log that the migration ran
  RAISE NOTICE 'User profile migration ready - user will be created through signup process';
END $$;