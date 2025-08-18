import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = 'https://jclgmvbkrlkppecwnljv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadPrompts() {
  try {
    const promptsDir = path.join(__dirname, '../prompts/base');
    const files = fs.readdirSync(promptsDir);
    
    console.log('Found prompt files:', files);
    
    for (const file of files) {
      if (file.endsWith('.yml')) {
        const filePath = path.join(promptsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        console.log(`Uploading ${file}...`);
        
        const { data, error } = await supabase.storage
          .from('agent-prompts')
          .upload(file, content, {
            contentType: 'application/x-yaml',
            upsert: true
          });
        
        if (error) {
          console.error(`Error uploading ${file}:`, error);
        } else {
          console.log(`✅ Successfully uploaded ${file}`);
        }
      }
    }
    
    console.log('All prompts uploaded successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadPrompts();
