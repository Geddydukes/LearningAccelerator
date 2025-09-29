// Test file to demonstrate the prompt system working
// This shows how the compile → proxy flow works

import { compilePrompt, callAgent, compileAndCallAgent } from '../src/lib/agents/promptCompiler';

// Mock environment variables for testing
const mockEnv = {
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'mock-key'
};

// Example usage of the prompt system
async function testPromptSystem() {
  console.log('🧪 Testing Prompt System...\n');
  
  // Example 1: Compile a CLO prompt
  console.log('1️⃣ Compiling CLO prompt...');
  try {
    const cloPrompt = await compilePrompt('clo', 'user123', {
      weekNumber: 1,
      timePerWeek: 5,
      track: 'fullstack_web',
      level: 'intermediate'
    });
    
    console.log(`✅ CLO prompt compiled: ${cloPrompt.hash}`);
    console.log(`   URL: ${cloPrompt.compiledUrl}`);
    console.log(`   Cached: ${cloPrompt.cached}\n`);
    
    // Example 2: Call the agent with compiled prompt
    console.log('2️⃣ Calling CLO agent...');
    const cloResult = await callAgent('clo', cloPrompt.compiledUrl, {
      action: 'CREATE_WEEKLY_PLAN',
      weekNumber: 1
    }, 'user123', 1);
    
    console.log(`✅ CLO agent called: ${cloResult.success ? 'success' : 'failed'}`);
    if (cloResult.error) {
      console.log(`   Error: ${cloResult.error}`);
    }
    console.log('');
    
  } catch (error) {
    console.log(`❌ CLO test failed: ${error.message}\n`);
  }
  
  // Example 3: One-step compile and call
  console.log('3️⃣ Testing one-step compile and call...');
  try {
    const result = await compileAndCallAgent('socratic', 'user123', {
      weekNumber: 1,
      learningObjectives: ['Understand React hooks', 'Build a simple app'],
      currentProgress: 0.3
    }, {
      action: 'START_SESSION',
      weekNumber: 1
    }, 1);
    
    console.log(`✅ Socratic agent test: ${result.success ? 'success' : 'failed'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.log(`❌ Socratic test failed: ${error.message}`);
  }
  
  console.log('\n🎯 Prompt System Test Complete!');
  console.log('\n📋 What this demonstrates:');
  console.log('   • Prompt compilation with variables');
  console.log('   • Caching and hash generation');
  console.log('   • Agent calling with compiled prompts');
  console.log('   • One-step compile and call workflow');
  console.log('   • Error handling and fallbacks');
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPromptSystem().catch(console.error);
}

export { testPromptSystem };
