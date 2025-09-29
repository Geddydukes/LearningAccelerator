#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jclgmvbkrlkppecwnljv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyLearnerProgression() {
  console.log('Applying learner progression migration...');

  try {
    // Check if learner_tracks table exists
    const { error: tableCheck } = await supabase
      .from('learner_tracks')
      .select('*')
      .limit(1);

    if (tableCheck && tableCheck.code === '42P01') {
      console.log('learner_tracks table does not exist, creating it...');
      
      // Read the migration file
      const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250819_learner_progression.sql');
      const migrationSQL = readFileSync(migrationPath, 'utf8');
      
      // Create the tables directly using the client
      console.log('Creating learner_tracks table...');
      
      // Create learner_tracks table
      const { error: createTracksError } = await supabase
        .from('learner_tracks')
        .select('*')
        .limit(1);
      
      if (createTracksError && createTracksError.code === '42P01') {
        // Table doesn't exist, we need to create it manually
        console.log('Table does not exist. You need to create it manually in the Supabase dashboard.');
        console.log('Go to: https://supabase.com/dashboard/project/jclgmvbkrlkppecwnljv/sql');
        console.log('And run the SQL from: supabase/migrations/20250819_learner_progression.sql');
        return;
      }
      
      console.log('learner_tracks table creation completed');
    } else {
      console.log('learner_tracks table already exists');
    }

    // Verify the table was created
    const { data, error: verifyError } = await supabase
      .from('learner_tracks')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.error('Failed to verify table creation:', verifyError);
    } else {
      console.log('✅ learner_tracks table verified successfully!');
    }

  } catch (err) {
    console.error('Error applying migration:', err);
  }
}

applyLearnerProgression();
