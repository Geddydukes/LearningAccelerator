/**
 * Onboarder Agent Proxy Handler
 * 
 * Handles onboarding quiz generation for new learners:
 * 1. Loads onboarder prompt from storage
 * 2. Injects dynamic placeholders (track, goals, hardware)
 * 3. Calls Gemini API for quiz generation
 * 4. Returns structured quiz JSON with 10 questions
 * 5. Validates 4-4-2 difficulty distribution
 */

import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface OnboarderRequest {
  cmd: string;
  track: string;
  goals: string;
  hardware: string;
  learningStyle?: string;
  experienceLevel?: string;
}

interface OnboarderResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface QuizQuestion {
  id: number;
  type: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  question: string;
  options?: string[];
  correct_answer?: string;
  explanation: string;
  hardware_relevance: 'low' | 'medium' | 'high';
  learning_style: 'visual' | 'auditory' | 'kinesthetic';
}

interface QuizData {
  quiz_id: string;
  track: string;
  difficulty: string;
  hardware_compatibility: string;
  questions: QuizQuestion[];
  hardware_assessment: {
    compatibility_score: 'high' | 'medium' | 'low';
    recommendations: string[];
    fallback_options: string[];
  };
  learning_recommendations: {
    style: string;
    resources: string[];
    pace: 'accelerated' | 'standard' | 'gradual';
  };
}

export async function handleOnboarderAgent(
  model: any,
  prompt: string,
  action: string,
  payload: OnboarderRequest,
  userId: string
): Promise<OnboarderResponse> {
  try {
    // Validate required fields
    if (!payload.track || !payload.goals || !payload.hardware) {
      return {
        success: false,
        error: 'Missing required fields: track, goals, hardware'
      }
    }

    // Inject placeholders into prompt
    const resolvedPrompt = prompt
      .replace(/{{TRACK_LABEL}}/g, payload.track)
      .replace(/{{LEARNER_GOALS}}/g, payload.goals)
      .replace(/{{HARDWARE_SPECS}}/g, payload.hardware)
      .replace(/{{LEARNING_STYLE}}/g, payload.learningStyle || 'visual')
      .replace(/{{EXPERIENCE_LEVEL}}/g, payload.experienceLevel || 'beginner')

    // Add START command to trigger quiz generation
    const fullPrompt = `${resolvedPrompt}\n\n**START**`

    // Generate quiz using Gemini
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const quizText = response.text()

    // Parse JSON from response
    let quizData: QuizData
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = quizText.match(/```json\s*([\s\S]*?)\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : quizText
      quizData = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', parseError)
      return {
        success: false,
        error: 'Failed to parse quiz response'
      }
    }

    // Validate quiz structure
    const validationResult = validateQuizData(quizData)
    if (!validationResult.valid) {
      return {
        success: false,
        error: `Quiz validation failed: ${validationResult.error}`
      }
    }

    // Store quiz in database for tracking
    await storeQuizData(userId, quizData)

    return {
      success: true,
      data: quizData
    }

  } catch (error) {
    console.error('Onboarder agent error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Validates quiz data structure and difficulty distribution
 */
function validateQuizData(quizData: QuizData): { valid: boolean; error?: string } {
  // Check required fields
  if (!quizData.quiz_id || !quizData.track || !quizData.questions) {
    return { valid: false, error: 'Missing required quiz fields' }
  }

  // Validate question count
  if (quizData.questions.length !== 10) {
    return { valid: false, error: 'Quiz must have exactly 10 questions' }
  }

  // Validate difficulty distribution (4-4-2)
  const difficultyCounts = quizData.questions.reduce((counts, question) => {
    counts[question.difficulty] = (counts[question.difficulty] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  if (difficultyCounts.foundational !== 4) {
    return { valid: false, error: 'Quiz must have exactly 4 foundational questions' }
  }

  if (difficultyCounts.intermediate !== 4) {
    return { valid: false, error: 'Quiz must have exactly 4 intermediate questions' }
  }

  if (difficultyCounts.advanced !== 2) {
    return { valid: false, error: 'Quiz must have exactly 2 advanced questions' }
  }

  // Validate question structure
  for (const question of quizData.questions) {
    if (!question.id || !question.type || !question.question || !question.explanation) {
      return { valid: false, error: 'Invalid question structure' }
    }

    if (question.type === 'multiple_choice') {
      if (!question.options || question.options.length !== 4 || !question.correct_answer) {
        return { valid: false, error: 'Multiple choice questions must have 4 options and correct answer' }
      }
    }
  }

  return { valid: true }
}

/**
 * Stores quiz data in database for tracking
 */
async function storeQuizData(userId: string, quizData: QuizData): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    await supabase
      .from('onboarding_quizzes')
      .insert({
        user_id: userId,
        quiz_id: quizData.quiz_id,
        track: quizData.track,
        quiz_data: quizData,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to store quiz data:', error)
    // Don't fail the request if storage fails
  }
} 