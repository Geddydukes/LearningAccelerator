/*
  # Fix Users Table RLS Policies

  1. Security Updates
    - Add INSERT policy for authenticated users to create their own profiles
    - Update existing policies to use proper auth.uid() function
    - Ensure users can manage their own data

  2. Policy Changes
    - Allow authenticated users to insert their own user profiles
    - Allow users to read and update their own profiles
    - Maintain security by restricting access to own data only
*/

-- Update existing policies to use proper auth function
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);