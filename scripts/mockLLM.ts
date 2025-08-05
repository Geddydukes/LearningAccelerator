#!/usr/bin/env ts-node

import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mock responses for different agents
const mockResponses = {
  clo: {
    success: true,
    data: {
      module_title: "Introduction to AI/ML Fundamentals",
      learning_objectives: [
        "Understand basic ML concepts",
        "Learn Python programming basics",
        "Complete first ML project"
      ],
      week_number: 1,
      agent_version: "v3.0"
    }
  },
  socratic: {
    success: true,
    data: {
      question: "What is the difference between supervised and unsupervised learning?",
      answer: "Supervised learning uses labeled data to make predictions, while unsupervised learning finds patterns in unlabeled data.",
      difficulty: 1,
      category: "fundamentals"
    }
  },
  alex: {
    success: true,
    data: {
      code_review: {
        score: 85,
        feedback: "Good code structure, consider adding more comments",
        suggestions: ["Add type hints", "Include error handling"]
      },
      week_number: 1,
      agent_version: "v3.0"
    }
  },
  brand: {
    success: true,
    data: {
      brand_strategy: {
        positioning: "AI/ML Learning Platform",
        target_audience: "Aspiring ML engineers",
        value_proposition: "Personalized learning with AI agents"
      },
      week_number: 1,
      agent_version: "v3.0"
    }
  },
  ta: {
    success: true,
    data: {
      daily_challenge: "Build a simple linear regression model",
      learning_tips: ["Start with scikit-learn", "Use real datasets"],
      progress_assessment: "You're making good progress on fundamentals"
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agent, userId, payload } = await req.json()

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Return mock response based on agent
    const mockResponse = mockResponses[agent as keyof typeof mockResponses]
    
    if (!mockResponse) {
      throw new Error(`Unknown agent: ${agent}`)
    }

    // Add some randomization to make responses more realistic
    const randomizedResponse = {
      ...mockResponse,
      data: {
        ...mockResponse.data,
        timestamp: new Date().toISOString(),
        request_id: Math.random().toString(36).substring(7)
      }
    }

    return new Response(
      JSON.stringify(randomizedResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Mock LLM error:', error)
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

console.log('🤖 Mock LLM server running on port 8000')
console.log('📝 Available agents: clo, socratic, alex, brand, ta')
console.log('🔧 Use VITE_FAKE_LLM=1 to enable mock responses') 