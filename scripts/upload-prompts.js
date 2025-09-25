import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const prompts = [
  {
    name: 'clo_v3.yml',
    path: '../prompts/base/clo_v3.yml'
  },
  {
    name: 'clo_v3_1.yml',
    path: '../prompts/base/clo_v3_1.yml'
  },
  {
    name: 'socratic_v3.yml',
    path: '../prompts/base/socratic_v3.yml'
  },
  {
    name: 'alex_v3.yml',
    path: '../prompts/base/alex_v3.yml'
  },
  {
    name: 'brand_strategist_v3.yml',
    path: '../prompts/base/brand_strategist_v3.yml'
  },
  {
    name: 'instructor_v2_1.yml',
    path: '../prompts/base/instructor_v2_1.yml'
  },
  {
    name: 'instructor_v2_2.yml',
    path: '../prompts/base/instructor_v2_2.yml'
  },
  {
    name: 'clarifier_v3.yml',
    path: '../prompts/base/clarifier_v3.yml'
  },
  {
    name: 'onboarder_v2.yml',
    path: '../prompts/base/onboarder_v2.yml'
  },
  {
    name: 'career_match_v1_3.yml',
    path: '../prompts/base/career_match_v1_3.yml'
  },
  {
    name: 'portfolio_v1_8.yml',
    path: '../prompts/base/portfolio_v1_8.yml'
  },
  {
    name: 'taagent_v1_4.yml',
    path: '../prompts/base/taagent_v1_4.yml'
  },
  {
    name: 'taagent_v1_5.yml',
    path: '../prompts/base/taagent_v1_5.yml'
  },
  {
    name: 'socratic_v3_1.yml',
    path: '../prompts/base/socratic_v3_1.yml'
  },
  {
    name: 'alex_v3_1.yml',
    path: '../prompts/base/alex_v3_1.yml'
  },
  {
    name: 'clarifier_v3_1.yml',
    path: '../prompts/base/clarifier_v3_1.yml'
  },
  {
    name: 'onboarder_v2_4.yml',
    path: '../prompts/base/onboarder_v2_4.yml'
  }
];

async function uploadPrompts() {
  try {
    console.log('Starting base prompt upload...');
    
    for (const prompt of prompts) {
      console.log(`Uploading ${prompt.name}...`);
      
      const filePath = join(__dirname, prompt.path);
      const content = readFileSync(filePath, 'utf8');
      
      const { data, error } = await supabase.storage
        .from('agent-prompts')
        .upload(prompt.name, content, {
          contentType: 'application/x-yaml',
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading ${prompt.name}:`, error);
      } else {
        console.log(`✅ Successfully uploaded ${prompt.name}`);
      }
    }
    
    console.log('Base prompt upload complete!');
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
}

uploadPrompts();
