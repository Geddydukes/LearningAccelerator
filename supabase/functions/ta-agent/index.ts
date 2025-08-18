import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TARequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: TARequest = await req.json()

    // For now, return mock TA response based on action
    let result;
    switch (action) {
      case 'HELP_WITH_EXERCISE':
        result = {
          exercise_id: payload.exerciseId || 'ex-1',
          help_text: "Let me walk you through this step by step. First, let's understand what we're trying to accomplish...",
          hints: [
            "Start by identifying the input and output of your model",
            "Consider what type of learning this represents",
            "Think about how you would structure the data"
          ],
          solution_steps: [
            "Step 1: Data preparation",
            "Step 2: Model selection",
            "Step 3: Training and validation"
          ],
          is_completed: false
        };
        break;
      case 'REVIEW_CODE':
        result = {
          review_id: crypto.randomUUID(),
          feedback: "Your code shows good understanding of the concepts. Here are some areas for improvement:",
          suggestions: [
            "Consider adding error handling for edge cases",
            "The variable naming could be more descriptive",
            "Add comments to explain complex logic"
          ],
          score: 7,
          max_score: 10,
          next_steps: "Try implementing the suggested improvements and run the code again."
        };
        break;
      case 'EXPLAIN_CONCEPT':
        result = {
          concept: payload.concept || 'Machine Learning',
          explanation: "Machine Learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.",
          examples: [
            "Email spam detection",
            "Recommendation systems",
            "Image recognition"
          ],
          analogies: [
            "Like teaching a child to recognize animals by showing them many examples",
            "Similar to how you learn to ride a bike through practice"
          ]
        };
        break;
      default:
        throw new Error(`Unknown TA action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
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
