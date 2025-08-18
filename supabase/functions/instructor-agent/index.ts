import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InstructorRequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: InstructorRequest = await req.json()

    // For now, return mock Instructor response based on action
    let result;
    switch (action) {
      case 'GET_DAILY_LESSON':
        result = {
          lesson_id: 'daily-1',
          title: 'Machine Learning Fundamentals - Day 1',
          objectives: [
            'Understand the difference between ML and traditional programming',
            'Learn about supervised vs unsupervised learning',
            'Complete the ML terminology quiz'
          ],
          content: 'Today we\'ll start with the basics of machine learning. We\'ll explore what makes ML different from traditional programming and understand the main categories of learning algorithms.',
          exercises: [
            'Complete the ML terminology quiz',
            'Read the introduction chapter',
            'Watch the concept explanation video'
          ],
          estimated_duration: 45,
          day_number: 1,
          practice_options: [
            { type: 'socratic', title: 'Socratic Practice', description: 'Deep dive through questioning' },
            { type: 'ta', title: 'TA Session', description: 'Get help with exercises' }
          ]
        };
        break;
      case 'GET_NEXT_LESSON':
        result = {
          lesson_id: 'daily-2',
          title: 'Supervised Learning Basics - Day 2',
          objectives: [
            'Understand supervised learning concepts',
            'Learn about training and testing data',
            'Practice with a simple dataset'
          ],
          content: 'Building on yesterday\'s foundation, we\'ll dive into supervised learning. This is where the magic happens - teaching computers to learn from examples.',
          exercises: [
            'Complete the supervised learning exercise',
            'Work with the sample dataset',
            'Build your first ML model'
          ],
          estimated_duration: 60,
          day_number: 2
        };
        break;
      default:
        throw new Error(`Unknown Instructor action: ${action}`)
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
