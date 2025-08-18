import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CLORequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: CLORequest = await req.json()

    // For now, return mock CLO response based on action
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
        throw new Error(`Unknown CLO action: ${action}`)
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
