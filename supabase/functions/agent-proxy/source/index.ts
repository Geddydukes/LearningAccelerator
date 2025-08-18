import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRequest {
  agent: 'clo' | 'socratic' | 'alex' | 'brand';
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agent, action, payload, userId }: AgentRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load agent prompt from storage
    const promptPath = getPromptPath(agent)
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download(promptPath)

    if (promptError) {
      throw new Error(`Failed to load prompt for ${agent}: ${promptError.message}`)
    }

    const promptText = await promptData.text()

    // Route to appropriate agent handler
    let result;
    switch (agent) {
      case 'clo':
        result = await handleCLOAgent(promptText, action, payload)
        break
      case 'socratic':
        result = await handleSocraticAgent(promptText, action, payload)
        break
      case 'alex':
        result = await handleAlexAgent(promptText, action, payload)
        break
      case 'brand':
        result = await handleBrandAgent(promptText, action, payload)
        break
      default:
        throw new Error(`Unknown agent: ${agent}`)
    }

    // Store result in weekly_notes if applicable
    if (result.shouldPersist) {
      await persistAgentResult(supabaseClient, userId, agent, result.data)
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function getPromptPath(agent: string): string {
  const promptMap = {
    'clo': 'clo_v3.yml',
    'socratic': 'socratic_v3.yml', 
    'alex': 'alex_v3.yml',
    'brand': 'brand_strategist_v3.yml'
  }
  
  return promptMap[agent as keyof typeof promptMap] || `${agent}_prompt.yml`
}

async function handleCLOAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement actual Gemini API call with loaded prompt
  console.log('CLO Agent called with action:', action)
  
  let result;
  switch (action) {
    case 'GET_DAILY_LESSON':
      result = {
        lesson_id: 'lesson-1',
        title: 'Introduction to Machine Learning Fundamentals',
        objectives: [
          'Understand basic ML concepts and terminology',
          'Learn about supervised vs unsupervised learning',
          'Complete hands-on exercises with sample data'
        ],
        content: 'Today we\'ll explore the foundational concepts of machine learning. We\'ll start with understanding what machine learning is, how it differs from traditional programming, and the different types of learning approaches.',
        exercises: [
          'Complete the ML terminology quiz',
          'Practice with the sample dataset exercise',
          'Build a simple linear regression model'
        ],
        duration: 60,
        day_number: 1
      };
      break;
    case 'GET_WEEKLY_PLAN':
      result = {
        plan_id: 'plan-1',
        title: 'Machine Learning Fundamentals - Week 1',
        description: 'Introduction to core ML concepts and practical applications',
        objectives: [
          'Master fundamental ML concepts and terminology',
          'Implement basic supervised learning algorithms',
          'Complete a practical ML project from start to finish'
        ],
        key_concepts: [
          'Machine Learning vs Traditional Programming',
          'Supervised vs Unsupervised Learning',
          'Model Training and Validation',
          'Feature Engineering and Selection'
        ],
        resources: [
          { type: 'Course', title: 'ML Fundamentals', url: '#', description: 'Comprehensive online course' },
          { type: 'Book', title: 'Hands-On ML', url: '#', description: 'Practical ML guidebook' },
          { type: 'Tool', title: 'Jupyter Notebooks', url: '#', description: 'Interactive development environment' }
        ],
        estimated_duration: 540,
        week_number: 1
      };
      break;
    default:
      result = {
        module_title: "Sample Learning Module",
        learning_objectives: ["Objective 1", "Objective 2"],
        key_concepts: ["Concept 1", "Concept 2"],
        estimated_duration: 120,
        prerequisites: ["Basic knowledge"],
        resources: [],
        assessment_criteria: ["Criteria 1"]
      };
  }
  
  return {
    shouldPersist: true,
    data: result
  }
}

async function handleSocraticAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement Gemini API call with Socratic prompt
  console.log('Socratic Agent called with action:', action)
  
  let result;
  switch (action) {
    case 'START_SESSION':
      result = {
        session_id: crypto.randomUUID(),
        question: "What do you think is the fundamental difference between machine learning and traditional programming?",
        level: 1,
        topic: payload.topic || 'Machine Learning Fundamentals'
      };
      break;
    case 'CONTINUE_SESSION':
      result = {
        question: "Can you give me a concrete example of how you would apply this concept in practice?",
        level: 3,
        feedback: "Good understanding of the basics. Let's dive deeper into application."
      };
      break;
    case 'ASSESS_MASTERY':
      result = {
        mastery_level: 4,
        next_question: "What are the potential limitations or weaknesses of this approach?",
        level: 5,
        is_mastered: false
      };
      break;
    default:
      result = {
        question: "What do you think about this concept?",
        conversation_id: payload.sessionId || crypto.randomUUID()
      };
  }
  
  return {
    shouldPersist: false,
    data: result
  }
}

async function handleAlexAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement Gemini API call with Alex prompt
  console.log('Alex Agent called with action:', action)
  
  let result;
  switch (action) {
    case 'REVIEW_CODE':
      result = {
        repository_url: payload.repositoryUrl,
        analysis_summary: "Code analysis complete - good structure with room for improvement",
        code_quality_score: 85,
        recommendations: [
          "Add comprehensive error handling",
          "Implement input validation",
          "Consider adding unit tests"
        ],
        technical_debt_items: [
          "Hardcoded configuration values",
          "Missing documentation"
        ],
        best_practices_followed: [
          "Clean code structure",
          "Good separation of concerns"
        ],
        areas_for_improvement: [
          "Error handling",
          "Testing coverage",
          "Documentation"
        ]
      };
      break;
    case 'DEPTH_ADVISOR':
      result = {
        recommendation: "STANDARD",
        reasoning: "Code shows intermediate complexity, standard review depth is appropriate",
        estimated_review_time: "15-20 minutes"
      };
      break;
    default:
      result = {
        repository_url: payload.repositoryUrl,
        analysis_summary: "Code analysis complete",
        code_quality_score: 85,
        recommendations: [],
        technical_debt_items: [],
        best_practices_followed: [],
        areas_for_improvement: []
      };
  }
  
  return {
    shouldPersist: true,
    data: result
  }
}

async function handleBrandAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement Gemini API call with Brand prompt
  console.log('Brand Agent called with action:', action)
  
  let result;
  switch (action) {
    case 'SUBMIT_BRIEFING':
      result = {
        content_themes: [
          "Machine Learning Fundamentals",
          "Practical Application",
          "Continuous Learning"
        ],
        kpi_metrics: [
          { metric: "Learning Progress", value: "75%", trend: "↑" },
          { metric: "Concept Mastery", value: "8/10", trend: "→" },
          { metric: "Project Completion", value: "3/5", trend: "↑" }
        ],
        social_content_suggestions: [
          "Share your ML learning journey on LinkedIn",
          "Post about the practical project you completed",
          "Tweet about key insights from today's session"
        ],
        brand_voice_analysis: "Professional and engaging, showing technical expertise while remaining approachable",
        engagement_strategies: [
          "Share weekly learning milestones",
          "Post code snippets with explanations",
          "Engage with the ML community"
        ]
      };
      break;
    case 'CONTENT_OPTIMIZER':
      result = {
        top_format: "LinkedIn post with visual",
        tweak_suggestion: "Add a personal story about your learning challenge",
        engagement_prediction: "High engagement expected due to relatable content"
      };
      break;
    default:
      result = {
        content_themes: ["Theme 1", "Theme 2"],
        kpi_metrics: [],
        social_content_suggestions: [],
        brand_voice_analysis: "Professional and engaging",
        engagement_strategies: []
      };
  }
  
  return {
    shouldPersist: true,
    data: result
  }
}

async function persistAgentResult(supabaseClient: any, userId: string, agent: string, data: any) {
  const currentWeek = Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))
  
  const updateField = `${agent === 'alex' ? 'lead_engineer' : agent}_${agent === 'clo' ? 'briefing_note' : agent === 'brand' ? 'strategy_package' : 'conversation'}`
  
  const { error } = await supabaseClient
    .from('weekly_notes')
    .upsert({
      user_id: userId,
      week_number: currentWeek,
      [updateField]: data,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,week_number'
    })

  if (error) {
    console.error('Failed to persist agent result:', error)
  }
}
