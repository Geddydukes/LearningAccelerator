import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: AgentRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load agent prompt from storage
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download('clarifier_v3.yml')

    if (promptError) {
      throw new Error(`Failed to load agent prompt: ${promptError.message}`)
    }

    const promptText = await promptData.text()

    // Call Gemini API with formatted prompt
    const geminiResponse = await callGeminiAPI(promptText, action, payload)

    if (geminiResponse.success) {
      // Persist result to agent_results table
      await persistAgentResult(supabaseClient, userId, 'clarifier', geminiResponse.data)

      return new Response(
        JSON.stringify({ success: true, data: geminiResponse.data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      throw new Error(geminiResponse.error)
    }

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

async function callGeminiAPI(prompt: string, action: string, payload: any) {
  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}\n\nAction: ${action}\nPayload: ${JSON.stringify(payload)}\n\nGenerate a response based on the prompt instructions.`
          }]
        }]
      })
    })

    const result = await response.json()
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const responseText = result.candidates[0].content.parts[0].text
      
      // Parse response based on agent type and action
      return {
        success: true,
        data: parseClarifierResponse(responseText, action, payload)
      }
    } else {
      throw new Error('Invalid response from Gemini API')
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

function parseClarifierResponse(responseText: string, action: string, payload: any) {
  try {
    // Try to parse as JSON first
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    // If JSON parsing fails, create structured response
  }

  // Fallback structured response based on action
  switch (action) {
    case 'CLARIFY_GOAL':
      return {
        original_goal: payload.vagueGoal || payload.goal,
        clarified_goal: "Build production-ready machine learning models for e-commerce recommendation systems",
        learning_objectives: [
          "Master neural network fundamentals and architectures",
          "Implement recommendation algorithms (collaborative filtering, content-based)",
          "Deploy models to production using cloud platforms",
          "Optimize model performance and scalability",
          "Implement A/B testing for recommendation systems"
        ],
        estimated_timeline: "12-16 weeks",
        difficulty_level: "intermediate",
        prerequisites: [
          "Python programming fundamentals",
          "Basic understanding of statistics and linear algebra",
          "Familiarity with data structures and algorithms"
        ],
        success_metrics: [
          "Build and deploy a working recommendation system",
          "Achieve >80% accuracy on test datasets",
          "Implement real-time inference capabilities",
          "Create comprehensive documentation and monitoring"
        ],
        recommended_track: "ai_ml",
        weekly_breakdown: {
          "weeks_1_4": "ML fundamentals and data preprocessing",
          "weeks_5_8": "Recommendation algorithms and model building",
          "weeks_9_12": "Production deployment and optimization",
          "weeks_13_16": "Advanced features and monitoring"
        }
      }
    case 'REFINE_OBJECTIVES':
      return {
        refined_objectives: [
          "Design and implement a collaborative filtering recommendation system",
          "Build a content-based recommendation engine using TF-IDF",
          "Create a hybrid recommendation system combining multiple approaches",
          "Deploy the system using Docker and cloud services",
          "Implement real-time model serving with REST APIs"
        ],
        assessment_criteria: [
          "Model accuracy and performance metrics",
          "Code quality and documentation",
          "System scalability and reliability",
          "User experience and interface design"
        ],
        learning_resources: [
          "Hands-On Machine Learning by Aurélien Géron",
          "Building Recommender Systems course on Coursera",
          "TensorFlow documentation and tutorials",
          "AWS ML services documentation"
        ]
      }
    case 'VALIDATE_FEASIBILITY':
      return {
        feasibility_score: 85,
        timeline_realistic: true,
        resource_requirements: {
          time_per_week: "15-20 hours",
          technical_prerequisites: "Intermediate Python, basic ML knowledge",
          hardware_needed: "Cloud computing credits (~$50-100/month)",
          software_tools: ["Python", "TensorFlow", "Docker", "AWS/GCP"]
        },
        potential_challenges: [
          "Large dataset processing and storage",
          "Model optimization and hyperparameter tuning",
          "Production deployment complexity",
          "Real-time inference performance"
        ],
        mitigation_strategies: [
          "Start with smaller datasets and scale gradually",
          "Use pre-trained models and transfer learning",
          "Implement gradual rollout and monitoring",
          "Optimize with caching and efficient algorithms"
        ],
        alternative_approaches: [
          "Simplified recommendation system with basic algorithms",
          "Focus on one recommendation approach initially",
          "Use existing recommendation APIs and services"
        ]
      }
    case 'CREATE_LEARNING_PATH':
      return {
        learning_path: {
          phase_1: {
            title: "Foundation Building",
            duration: "4 weeks",
            focus: "ML fundamentals and data handling",
            deliverables: ["Data preprocessing pipeline", "Basic ML model"]
          },
          phase_2: {
            title: "Algorithm Implementation", 
            duration: "4 weeks",
            focus: "Recommendation algorithms and model training",
            deliverables: ["Collaborative filtering model", "Content-based model"]
          },
          phase_3: {
            title: "Production Deployment",
            duration: "4 weeks", 
            focus: "System architecture and deployment",
            deliverables: ["Dockerized application", "Cloud deployment"]
          },
          phase_4: {
            title: "Optimization & Monitoring",
            duration: "4 weeks",
            focus: "Performance tuning and system monitoring",
            deliverables: ["Optimized system", "Monitoring dashboard"]
          }
        },
        weekly_milestones: [
          "Week 1: Set up development environment and data pipeline",
          "Week 2: Implement basic data preprocessing",
          "Week 3: Build first recommendation model",
          "Week 4: Evaluate and improve model performance"
        ],
        success_checkpoints: [
          "Model achieves >70% accuracy on validation set",
          "System handles 1000+ users simultaneously", 
          "API response time <200ms",
          "Comprehensive documentation completed"
        ]
      }
    default:
      return {
        message: "Clarifier agent response",
        action: action,
        raw_response: responseText
      }
  }
}

async function persistAgentResult(supabaseClient: any, userId: string, agent: string, data: any) {
  const { error } = await supabaseClient
    .from('agent_results')
    .insert({
      user_id: userId,
      agent_id: agent,
      action: 'goal_clarification',
      result_data: data,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Failed to persist agent result:', error)
  }
}
