#!/usr/bin/env node

/**
 * Guru V1 Golden Path Demo Script
 * 
 * This script demonstrates the complete Education Agent flow:
 * 1. Creates a learner profile
 * 2. Starts a daily learning session
 * 3. Calls education-agent state machine through lecture → check → practice
 * 4. Prints a session timeline
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jclgmvbkrlkppecwnljv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Demo configuration
const DEMO_CONFIG = {
  userId: 'demo-user-' + Date.now(),
  week: 1,
  day: 1,
  correlationId: 'demo-session-' + Date.now(),
  programId: 'datasci-week-1',
  weeklyPlanId: 'datasci-week-1-weekly'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Load seed data
function loadSeedData() {
  try {
    const programPath = join(__dirname, '../seed-data/programs/datasci-week-1.yaml');
    const weeklyPath = join(__dirname, '../seed-data/weekly/datasci-week-1.yaml');
    
    const programData = readFileSync(programPath, 'utf8');
    const weeklyData = readFileSync(weeklyPath, 'utf8');
    
    return { programData, weeklyData };
  } catch (error) {
    logError(`Failed to load seed data: ${error.message}`);
    return null;
  }
}

// Create demo user profile
async function createDemoUser() {
  logStep(1, 'Creating demo user profile');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: DEMO_CONFIG.userId,
        email: 'demo@learning-accelerator.com',
        full_name: 'Demo Learner',
        experience_level: 'beginner',
        learning_goals: ['data_science', 'python', 'statistics'],
        preferred_learning_style: 'hands_on',
        time_commitment: '1_hour_daily',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    logSuccess(`Created demo user: ${data.email}`);
    return data;
  } catch (error) {
    logError(`Failed to create demo user: ${error.message}`);
    throw error;
  }
}

// Seed program and weekly plans
async function seedProgramData() {
  logStep(2, 'Seeding program and weekly plans');
  
  try {
    const seedData = loadSeedData();
    if (!seedData) throw new Error('Failed to load seed data');

    // Create program plan
    const { data: programPlan, error: programError } = await supabase
      .from('program_plans')
      .upsert({
        id: DEMO_CONFIG.programId,
        user_id: DEMO_CONFIG.userId,
        version: '1.0',
        program_plan: {
          title: 'Data Science Fundamentals',
          description: '4-week introduction to data science',
          duration_weeks: 4,
          difficulty: 'beginner',
          focus_areas: ['Python Programming', 'Statistics Fundamentals', 'Data Visualization']
        },
        accepted: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (programError) throw programError;

    // Create weekly plan
    const { data: weeklyPlan, error: weeklyError } = await supabase
      .from('weekly_plans')
      .upsert({
        id: DEMO_CONFIG.weeklyPlanId,
        user_id: DEMO_CONFIG.userId,
        program_plan_id: DEMO_CONFIG.programId,
        week: DEMO_CONFIG.week,
        weekly_plan: {
          title: 'Introduction to Data Science',
          description: 'Week 1 focuses on understanding what data science is and getting comfortable with Python basics',
          daily_plans: {
            day_1: { title: 'What is Data Science?', learning_objectives: ['Understand the data science workflow'] },
            day_2: { title: 'Python Environment Setup', learning_objectives: ['Set up Python development environment'] },
            day_3: { title: 'Basic Python Syntax', learning_objectives: ['Learn Python variables and data types'] },
            day_4: { title: 'Introduction to Jupyter Notebooks', learning_objectives: ['Master Jupyter Notebook interface'] },
            day_5: { title: 'Week 1 Project: Hello Data Science', learning_objectives: ['Apply week\'s learning to a practical project'] }
          }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (weeklyError) throw weeklyError;

    logSuccess(`Seeded program plan: ${programPlan.id}`);
    logSuccess(`Seeded weekly plan: ${weeklyPlan.id}`);
    
    return { programPlan, weeklyPlan };
  } catch (error) {
    logError(`Failed to seed program data: ${error.message}`);
    throw error;
  }
}

// Call Education Agent
async function callEducationAgent(event, payload = {}) {
  const url = `${SUPABASE_URL}/functions/v1/education-agent`;
  
  const body = {
    event,
    userId: DEMO_CONFIG.userId,
    week: DEMO_CONFIG.week,
    day: DEMO_CONFIG.day,
    payload,
    correlationId: DEMO_CONFIG.correlationId
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'x-correlation-id': DEMO_CONFIG.correlationId
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  } catch (error) {
    logError(`Education Agent call failed: ${error.message}`);
    throw error;
  }
}

// Run the complete learning flow
async function runLearningFlow() {
  logStep(3, 'Starting Education Agent learning flow');
  
  try {
    // Start day
    logInfo('Calling start_day event...');
    const startResult = await callEducationAgent('start_day', {
      intentObject: {
        learning_goals: ['data_science', 'python', 'statistics'],
        experience_level: 'beginner',
        time_commitment: '1_hour_daily'
      },
      programDurationWeeks: 4
    });
    
    logSuccess(`Started learning session - Phase: ${startResult.data.phase}`);
    logInfo(`Program Plan: ${startResult.data.programPlan?.title || 'N/A'}`);
    logInfo(`Weekly Plan: ${startResult.data.weeklyPlan?.title || 'N/A'}`);

    // Simulate lecture completion
    logInfo('Simulating lecture completion...');
    const lectureResult = await callEducationAgent('lecture_done', {
      lectureContext: {
        topic: 'Introduction to Data Science',
        duration: '20 minutes',
        keyPoints: ['Data science workflow', 'Types of data', 'Real-world applications']
      }
    });
    
    logSuccess(`Lecture completed - Phase: ${lectureResult.data.phase}`);

    // Simulate comprehension check
    logInfo('Simulating comprehension check...');
    const checkResult = await callEducationAgent('check_done', {
      checkResults: {
        answers: {
          'What are the main steps in the data science workflow?': 'Ask, Prepare, Process, Analyze, Share, Act',
          'Can you give an example of structured vs. unstructured data?': 'Structured: Excel spreadsheet, Unstructured: Social media posts',
          'How does data science differ from traditional statistics?': 'Data science includes programming, visualization, and business context'
        },
        comprehension_score: 0.85,
        areas_for_improvement: ['statistical concepts']
      }
    });
    
    logSuccess(`Comprehension check completed - Phase: ${checkResult.data.phase}`);

    // Simulate practice selection
    logInfo('Simulating practice selection (TA exercises)...');
    const practiceResult = await callEducationAgent('practice_ready', {
      practiceType: 'ta',
      language: 'python',
      focusAreas: ['python_basics', 'data_types']
    });
    
    logSuccess(`Practice session started - Phase: ${practiceResult.data.phase}, Type: ${practiceResult.data.practiceType}`);

    // Simulate practice completion
    logInfo('Simulating practice completion...');
    const practiceDoneResult = await callEducationAgent('practice_done', {
      practiceResults: {
        ta: {
          exercises_completed: 3,
          success_rate: 0.9,
          time_spent: '25 minutes',
          blockers: [],
          mastery_estimate: {
            'python_basics': 0.8,
            'data_types': 0.85
          }
        }
      }
    });
    
    logSuccess(`Practice completed - Phase: ${practiceDoneResult.data.phase}`);

    // Simulate daily reflection
    logInfo('Simulating daily reflection...');
    const reflectResult = await callEducationAgent('reflect_done', {
      reflection: {
        summary: 'Great first day! I understand the data science workflow and feel confident with basic Python concepts.',
        challenges: 'Need to practice more with data types',
        next_steps: 'Review Python syntax and prepare for environment setup tomorrow',
        confidence_level: 0.8
      },
      telemetry: {
        instructor_hints: ['Focus on data types practice'],
        ta_blockers: [],
        mastery_estimate: { 'python_basics': 0.8, 'data_types': 0.85 },
        time_used_min: 65,
        degraded_days_count: 0
      }
    });
    
    logSuccess(`Daily reflection completed - Phase: ${reflectResult.data.phase}`);
    
    return {
      startResult,
      lectureResult,
      checkResult,
      practiceResult,
      practiceDoneResult,
      reflectResult
    };
  } catch (error) {
    logError(`Learning flow failed: ${error.message}`);
    throw error;
  }
}

// Print session timeline
async function printSessionTimeline() {
  logStep(4, 'Retrieving session timeline');
  
  try {
    const { data: events, error } = await supabase
      .from('agent_events')
      .select('*')
      .eq('correlation_id', DEMO_CONFIG.correlationId)
      .order('started_at', { ascending: true });

    if (error) throw error;

    if (!events || events.length === 0) {
      logInfo('No agent events found for this session');
      return;
    }

    log('\n📊 Session Timeline:', 'magenta');
    log('=' * 50, 'magenta');
    
    events.forEach((event, index) => {
      const duration = event.ended_at 
        ? `${new Date(event.ended_at).getTime() - new Date(event.started_at).getTime()}ms`
        : 'Running...';
      
      const statusColor = event.status === 'completed' ? 'green' : 
                         event.status === 'failed' ? 'red' : 'yellow';
      
      log(`\n${index + 1}. ${event.agent} → ${event.tool}`, 'cyan');
      log(`   Status: ${event.status}`, statusColor);
      log(`   Duration: ${duration}`, 'blue');
      log(`   Tokens: ${event.tokens_in} in, ${event.tokens_out} out`, 'blue');
      log(`   Cost: $${event.cost_estimate.toFixed(4)}`, 'blue');
      
      if (event.error_message) {
        log(`   Error: ${event.error_message}`, 'red');
      }
    });

    const totalCost = events.reduce((sum, event) => sum + (event.cost_estimate || 0), 0);
    const totalTokens = events.reduce((sum, event) => sum + (event.tokens_in || 0) + (event.tokens_out || 0), 0);
    
    log('\n📈 Session Summary:', 'magenta');
    log(`Total Events: ${events.length}`, 'blue');
    log(`Total Tokens: ${totalTokens}`, 'blue');
    log(`Total Cost: $${totalCost.toFixed(4)}`, 'blue');
    log(`Correlation ID: ${DEMO_CONFIG.correlationId}`, 'blue');
    
  } catch (error) {
    logError(`Failed to retrieve timeline: ${error.message}`);
  }
}

// Main demo function
async function runDemo() {
  log('\n🚀 Starting Guru V1 Golden Path Demo', 'bright');
  log('=' * 50, 'bright');
  
  try {
    // Setup
    await createDemoUser();
    await seedProgramData();
    
    // Run learning flow
    const results = await runLearningFlow();
    
    // Show timeline
    await printSessionTimeline();
    
    log('\n🎉 Demo completed successfully!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Check the Education Agent UI at /home/workspace', 'blue');
    log('2. View the session timeline at /dev/timeline/' + DEMO_CONFIG.correlationId, 'blue');
    log('3. Explore the agent events in the database', 'blue');
    
  } catch (error) {
    logError(`Demo failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}
