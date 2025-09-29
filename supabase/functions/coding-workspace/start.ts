import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StartWorkspaceBody {
  userId: string;
  payload?: {
    language?: string;
    focusAreas?: string[];
    week?: number;
    day?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') return error('Method Not Allowed', 405);
    
    const body: StartWorkspaceBody = await req.json();
    if (!body?.userId) return error('Missing userId', 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { language = 'javascript', focusAreas = [], week, day } = body.payload || {};

    // Create initial file system
    const fileSystem = createInitialFileSystem(language, focusAreas);
    
    // Generate task brief
    const taskBrief = await generateTaskBrief(supabase, body.userId, language, focusAreas, week, day);
    
    // Create tests
    const tests = await generateTests(language, focusAreas);
    
    // Generate getting started guide
    const gettingStarted = generateGettingStarted(language, focusAreas);

    // Create coding session
    const session = await createCodingSession(supabase, {
      userId: body.userId,
      language,
      focusAreas,
      week,
      day,
      fileSystem,
      taskBrief,
      tests,
      gettingStarted,
    });

    return ok({
      sessionId: session.id,
      language,
      focusAreas,
      fileSystem,
      taskBrief,
      tests,
      gettingStarted,
      etag: generateETag(),
    });

  } catch (error) {
    console.error('Coding Workspace Start error:', error);
    return error(error.message);
  }
});

function createInitialFileSystem(language: string, focusAreas: string[]) {
  const baseFiles = {
    'README.md': {
      content: `# Coding Challenge\n\nComplete the tasks in the files below. Run tests to check your progress.\n\n## Getting Started\n\n1. Read the task brief\n2. Implement your solution\n3. Run tests to verify\n4. Submit for review when ready\n`,
      type: 'text/markdown'
    },
    '.gitignore': {
      content: `node_modules/\n*.log\n.env\n.DS_Store\n`,
      type: 'text/plain'
    }
  };

  if (language === 'javascript' || language === 'typescript') {
    return {
      ...baseFiles,
      'package.json': {
        content: JSON.stringify({
          name: 'coding-challenge',
          version: '1.0.0',
          type: 'module',
          scripts: {
            test: 'node --test test/*.js',
            start: 'node index.js'
          },
          devDependencies: {
            '@types/node': '^20.0.0'
          }
        }, null, 2),
        type: 'application/json'
      },
      'index.js': {
        content: `// Your main implementation file\n// Implement the functions described in the task brief\n\nexport function main() {\n  // Your code here\n  console.log('Hello, World!');\n}\n\n// Run if this file is executed directly\nif (import.meta.url === \`file://\${process.argv[1]}\`) {\n  main();\n}\n`,
        type: 'application/javascript'
      },
      'test/index.test.js': {
        content: `import { test } from 'node:test';\nimport assert from 'node:assert';\nimport { main } from '../index.js';\n\n// Tests will be generated based on focus areas\n// This is a placeholder test structure\n\ntest('main function exists', () => {\n  assert(typeof main === 'function');\n});\n`,
        type: 'application/javascript'
      }
    };
  }

  if (language === 'python') {
    return {
      ...baseFiles,
      'requirements.txt': {
        content: `# Python dependencies\npytest>=7.0.0\n`,
        type: 'text/plain'
      },
      'main.py': {
        content: `# Your main implementation file\n# Implement the functions described in the task brief\n\ndef main():\n    # Your code here\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`,
        type: 'text/x-python'
      },
      'test_main.py': {
        content: `import pytest\nfrom main import main\n\n# Tests will be generated based on focus areas\n# This is a placeholder test structure\n\ndef test_main_exists():\n    assert callable(main)\n`,
        type: 'text/x-python'
      }
    };
  }

  return baseFiles;
}

async function generateTaskBrief(supabase: any, userId: string, language: string, focusAreas: string[], week?: number, day?: number) {
  // Get user's learning context
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: weeklyPlan } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('week', week)
    .single();

  // Generate contextual task brief
  const brief = {
    title: `Coding Challenge: ${focusAreas.join(', ') || 'General Programming'}`,
    description: `Complete the programming tasks below to practice ${focusAreas.join(', ') || 'core programming concepts'}.`,
    objectives: focusAreas.map(area => ({
      concept: area,
      description: `Implement functionality related to ${area}`,
      difficulty: 'intermediate'
    })),
    requirements: [
      'Write clean, readable code',
      'Follow best practices for the language',
      'Include appropriate error handling',
      'Write tests for your implementation',
      'Document your code with comments'
    ],
    constraints: [
      'No external libraries unless specified',
      'Code must be production-ready',
      'Follow the language conventions'
    ],
    context: {
      userLevel: profile?.experience_level || 'intermediate',
      weekFocus: weeklyPlan?.focus_topics || [],
      language: language
    }
  };

  return brief;
}

async function generateTests(language: string, focusAreas: string[]) {
  const testTemplates = {
    javascript: `import { test } from 'node:test';
import assert from 'node:assert';
import { main } from '../index.js';

// Generated tests based on focus areas
${focusAreas.map(area => `
test('${area} implementation', () => {
  // Test your ${area} implementation
  assert(true, 'Implement ${area} functionality');
});`).join('\n')}
`,
    python: `import pytest
from main import main

# Generated tests based on focus areas
${focusAreas.map(area => `
def test_${area.replace(/\s+/g, '_').toLowerCase()}_implementation():
    # Test your ${area} implementation
    assert True, 'Implement ${area} functionality'
`).join('\n')}
`
  };

  return testTemplates[language] || testTemplates.javascript;
}

function generateGettingStarted(language: string, focusAreas: string[]) {
  const guides = {
    javascript: `# Getting Started with JavaScript

## Setup
1. Make sure Node.js is installed
2. Run \`npm install\` to install dependencies
3. Run \`npm test\` to run tests

## Focus Areas
${focusAreas.map(area => `- **${area}**: Implement functionality related to ${area}`).join('\n')}

## Tips
- Use modern JavaScript features (ES6+)
- Write descriptive variable and function names
- Include JSDoc comments for functions
- Handle edge cases and errors appropriately`,
    
    python: `# Getting Started with Python

## Setup
1. Make sure Python 3.8+ is installed
2. Run \`pip install -r requirements.txt\` to install dependencies
3. Run \`pytest\` to run tests

## Focus Areas
${focusAreas.map(area => `- **${area}**: Implement functionality related to ${area}`).join('\n')}

## Tips
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Write docstrings for functions and classes
- Handle exceptions gracefully`
  };

  return guides[language] || guides.javascript;
}

async function createCodingSession(supabase: any, data: any) {
  const sessionData = {
    user_id: data.userId,
    language: data.language,
    focus_areas: data.focusAreas,
    week: data.week,
    day: data.day,
    file_system: data.fileSystem,
    task_brief: data.taskBrief,
    tests: data.tests,
    getting_started: data.gettingStarted,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  const { data: session, error } = await supabase
    .from('coding_sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create coding session: ${error.message}`);
  }

  return session;
}

function generateETag(): string {
  return `W/"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`;
}

function ok(data: any) {
  return new Response(
    JSON.stringify({ success: true, data }),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }, 
      status: 200 
    }
  );
}

function error(msg: string, status = 500) {
  return new Response(
    JSON.stringify({ success: false, error: msg }),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }, 
      status 
    }
  );
}