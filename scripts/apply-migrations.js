#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jclgmvbkrlkppecwnljv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrations() {
  console.log('Applying migrations...');

  try {
    // Check if XP column exists
    const { error: xpCheck } = await supabase
      .from('users')
      .select('xp')
      .limit(1);

    if (xpCheck && xpCheck.code === '42703') {
      console.log('XP column does not exist, adding it...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 CHECK (xp >= 0);'
      });
      
      if (error) {
        console.error('Failed to add XP column:', error);
      } else {
        console.log('XP column added successfully');
      }
    } else {
      console.log('XP column already exists');
    }

    // Check if certificates table exists
    const { error: certCheck } = await supabase
      .from('certificates')
      .select('*')
      .limit(1);

    if (certCheck && certCheck.code === '42P01') {
      console.log('Certificates table does not exist, creating it...');
      const createCertificatesSQL = `
        CREATE TABLE IF NOT EXISTS certificates (
          cert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          track TEXT NOT NULL,
          issued_at TIMESTAMPTZ DEFAULT now(),
          url TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own certificates" ON certificates
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own certificates" ON certificates
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own certificates" ON certificates
          FOR UPDATE USING (auth.uid() = user_id);
        
        GRANT SELECT, INSERT, UPDATE ON certificates TO authenticated;
        
        CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
        CREATE INDEX IF NOT EXISTS idx_certificates_track ON certificates(track);
        CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at);
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql: createCertificatesSQL });
      
      if (error) {
        console.error('Failed to create certificates table:', error);
      } else {
        console.log('Certificates table created successfully');
      }
    } else {
      console.log('Certificates table already exists');
    }

    // Check if streaks table exists
    const { error: streakCheck } = await supabase
      .from('streaks')
      .select('*')
      .limit(1);

    if (streakCheck && streakCheck.code === '42P01') {
      console.log('Streaks table does not exist, creating it...');
      const createStreaksSQL = `
        CREATE TABLE IF NOT EXISTS streaks (
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          activity_date DATE NOT NULL,
          agent TEXT NOT NULL CHECK (agent IN ('CLO', 'Socratic', 'TA', 'Project')),
          created_at TIMESTAMPTZ DEFAULT now(),
          PRIMARY KEY (user_id, activity_date, agent)
        );
        
        ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own streaks" ON streaks
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own streaks" ON streaks
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        GRANT SELECT, INSERT ON streaks TO authenticated;
        
        CREATE INDEX IF NOT EXISTS idx_streaks_user_date ON streaks(user_id, activity_date);
        CREATE INDEX IF NOT EXISTS idx_streaks_agent ON streaks(agent);
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql: createStreaksSQL });
      
      if (error) {
        console.error('Failed to create streaks table:', error);
      } else {
        console.log('Streaks table created successfully');
      }
    } else {
      console.log('Streaks table already exists');
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error applying migrations:', error);
  }
}

applyMigrations(); 