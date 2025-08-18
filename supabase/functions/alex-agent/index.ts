import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlexRequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: AlexRequest = await req.json()

    // For now, return mock Alex response based on action
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
        throw new Error(`Unknown Alex action: ${action}`)
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
