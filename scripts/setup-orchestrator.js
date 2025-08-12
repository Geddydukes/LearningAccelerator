#!/usr/bin/env node

/**
 * Setup Script for Learning Accelerator Orchestrator
 * 
 * This script:
 * 1. Applies the orchestrator database migration
 * 2. Creates the workflows storage bucket
 * 3. Uploads workflow YAML files
 * 4. Sets up cron jobs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupOrchestrator() {
  console.log('🚀 Setting up Learning Accelerator Orchestrator...\n');

  try {
    // Step 1: Create workflows storage bucket
    console.log('📦 Creating workflows storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }

    const workflowsBucket = buckets.find(b => b.name === 'workflows');
    if (!workflowsBucket) {
      const { error: createError } = await supabase.storage.createBucket('workflows', {
        public: false,
        allowedMimeTypes: ['application/x-yaml', 'text/yaml', 'text/plain'],
        fileSizeLimit: 1024 * 1024 // 1MB
      });

      if (createError) {
        console.error('Error creating workflows bucket:', createError);
        return;
      }
      console.log('✅ Workflows bucket created');
    } else {
      console.log('✅ Workflows bucket already exists');
    }

    // Step 2: Upload workflow YAML files
    console.log('\n📄 Uploading workflow YAML files...');
    const workflowsDir = path.join(__dirname, '..', 'supabase', 'storage', 'workflows');
    
    if (fs.existsSync(workflowsDir)) {
      const yamlFiles = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml'));
      
      for (const file of yamlFiles) {
        const filePath = path.join(workflowsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const { error: uploadError } = await supabase.storage
          .from('workflows')
          .upload(file, content, {
            contentType: 'application/x-yaml',
            upsert: true
          });

        if (uploadError) {
          console.error(`Error uploading ${file}:`, uploadError);
        } else {
          console.log(`✅ Uploaded ${file}`);
        }
      }
    }

    // Step 3: Set storage policies
    console.log('\n🔒 Setting storage policies...');
    
    // Allow service role to read workflows
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Service role can read workflows" ON storage.objects
        FOR SELECT USING (bucket_id = 'workflows' AND auth.role() = 'service_role');
      `
    });

    if (policyError && !policyError.message.includes('already exists')) {
      console.error('Error setting storage policy:', policyError);
    } else {
      console.log('✅ Storage policies configured');
    }

    // Step 4: Verify database tables
    console.log('\n🗄️ Verifying database tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['job_queue', 'job_attempts', 'workflow_runs', 'rate_limits', 'intent_events']);

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return;
    }

    const expectedTables = ['job_queue', 'job_attempts', 'workflow_runs', 'rate_limits', 'intent_events'];
    const existingTables = tables.map(t => t.table_name);
    
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ Table ${table} exists`);
      } else {
        console.log(`❌ Table ${table} missing - run migration first`);
      }
    }

    // Step 5: Test basic functionality
    console.log('\n🧪 Testing basic functionality...');
    
    // Test inserting an intent event
    const { error: testError } = await supabase
      .from('intent_events')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        type: 'test_event',
        payload: { test: true }
      });

    if (testError) {
      console.error('❌ Error testing intent_events table:', testError);
    } else {
      console.log('✅ Intent events table working');
      
      // Clean up test data
      await supabase
        .from('intent_events')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
    }

    console.log('\n🎉 Orchestrator setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Deploy Edge Functions: supabase functions deploy orchestrator');
    console.log('   2. Deploy cron function: supabase functions deploy cron-orchestrator');
    console.log('   3. Set up cron jobs in Supabase dashboard');
    console.log('   4. Test with: curl -X POST /functions/v1/orchestrator/dispatch');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupOrchestrator();
}

module.exports = { setupOrchestrator }; 