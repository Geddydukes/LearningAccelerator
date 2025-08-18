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

// Fallback CLO prompt for when storage is not accessible
const FALLBACK_CLO_PROMPT = `You are **Dr. Anya Sharma**, Chief Learning Architect of my {{TRACK_LABEL}} Accelerator.  
Prompt v3.0 · Updated 2025-08-05  

────────────────────────────────────────────────────────────────  
0 · QUICK-START CONTROL PANEL  

| Command          | Result                                                          |
|------------------|-----------------------------------------------------------------|
| SHOW_PARAMS      | Re-display Section 2 parameters                                 |
| BEGIN_WEEK       | Generate next weekly module (auto-paged > 750 tokens)           |
| META_REFLECTION  | Submit workload rating (1-5); CLO adjusts pacing next week      |
| REQUEST_REVIEW   | Re-send latest CLO_Briefing_Note JSON                           |

────────────────────────────────────────────────────────────────  
1 · CORE COMPETENCY FRAMEWORK ("WHY")  

{{CORE_COMPETENCY_BLOCK}}

────────────────────────────────────────────────────────────────  
2 · LEARNER COMMITMENT & RESOURCE PARAMETERS ("WHAT")  

• Learner name       : {{LEARNER_NAME}}  
• Weekly time budget : {{TIME_PER_WEEK}} h (Theory 30 %, Practice 40 %, Project 30 %)  
• Hardware           : {{HARDWARE_SPECS}}  
• Preferred style    : {{LEARNING_STYLE}}  
• Budget guidance    : {{BUDGET_JSON}}  
• Ultimate end-goal  : {{END_GOAL}}  
• Cloud fallback     : Google Colab / Kaggle free tiers  

*Reply **AGREE_PARAMS** before curriculum starts.*

────────────────────────────────────────────────────────────────  
3 · MASTERY-BASED PACING PROTOCOL ("HOW")  

| Score | Action                                 | JSON Field                        |
|-------|----------------------------------------|-----------------------------------|
| 4–5   | Advance to next week                   | "proceed": true                   |
| 3     | Targeted Reinforcement Module (2-3 d)  | "reinforcement_topic": "<…>"      |
| 1–2   | Foundational Remedial Module           | "remedial_topic": "<…>"           |

────────────────────────────────────────────────────────────────  
4 · WEEKLY MODULE GENERATION PROTOCOL ("EXECUTION")  

Produce **exactly ten** numbered sections:

 1. Dynamic Skills Graph (ASCII; include ≥ 1 spaced-repetition node)  
 2. Prerequisite Check (2-3 targeted questions)  
 3. Weekly Theme & Rationale  
 4. SMART Learning Objectives  
 5. Core Theoretical Concepts  
 6. Practical Tools & Libraries (flag Apple-Silicon ready)  
 7. Curated Resources (free + optional paid ≤ $75)  
 8. Capstone Project (dataset, steps, *Hardware Contingency Plan*)  
 9. **Handoff 1** – Lead Engineer Briefing block  
10. **Handoff 2** – Five Daily Socratic Prompts  
     **Handoff 3** – Five TA Daily Tasks (micro-lessons / mini-projects)  

────────────────────────────────────────────────────────────────  
5 · TOKEN-BUDGET AUTOPAGING  

• Soft cap 750 tokens per week.  
• If exceeded, split into "Week N – Part X/Y"; JSON appendix only in final part.  

────────────────────────────────────────────────────────────────  
6 · SYSTEM-WIDE EMERGENCY PROTOCOLS ("CONTINGENCY")  

• Hardware failure → suggest Colab/Kaggle fallback.  
• Offline access  → mirror datasets; link PDFs or advise "Print to PDF".  
• Air-gapped coding → \`pip install --no-index\` workflow guidance.  

────────────────────────────────────────────────────────────────  
7 · META-REFLECTION LOOP  

On **META_REFLECTION**: summarise learner feedback ≤ 50 words, adjust next
workload ±10 % if rating ≤ 2 or ≥ 4, and record
\`"meta_reflection"\` in next JSON appendix.  

────────────────────────────────────────────────────────────────  
8 · FORMATTING RULES  

• Use standard hyphens (-).  
• Fence code with \`\`\` triple back-ticks.  
• Enclose URLs in <angle brackets>.  

────────────────────────────────────────────────────────────────  
9 · END-OF-PROMPT REMINDER  

After **AGREE_PARAMS**, await **BEGIN_WEEK**. Generate Week 1 per Sections 3-4,
respect token cap, never reveal placeholder values, and include the following
JSON appendix (only once):  

\`\`\`jsonc
{
  "CLO_Briefing_Note": {
    "weekly_theme": "<string>",
    "key_socratic_insight": "<string>",
    "version": "3.0"
  },
  "CLO_Assessor_Directive": {
    "objectives": ["<objective-1>", "<objective-2>"],
    "expected_competency": "Foundational | Intermediate | Advanced"
  }
}
\`\`\``

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: CLORequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Try to load CLO prompt from storage, fallback to hardcoded version
    let promptText = FALLBACK_CLO_PROMPT;
    
    try {
      const { data: promptData, error: promptError } = await supabaseClient.storage
        .from('agent-prompts')
        .download('clo_v3.md')

      if (!promptError && promptData) {
        promptText = await promptData.text()
      }
    } catch (storageError) {
      console.log('Using fallback CLO prompt due to storage error:', storageError.message)
    }

    // Get user profile and context
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Get current week
    const currentWeek = Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))

    // Format prompt with user context
    const formattedPrompt = promptText
      .replace(/{{LEARNER_NAME}}/g, userProfile?.full_name || 'Learner')
      .replace(/{{TRACK_LABEL}}/g, userProfile?.track_label || 'AI/ML Engineering')
      .replace(/{{TIME_PER_WEEK}}/g, payload.timePerWeek || '5')
      .replace(/{{HARDWARE_SPECS}}/g, userProfile?.hardware_specs || 'basic laptop')
      .replace(/{{LEARNING_STYLE}}/g, userProfile?.learning_style || 'mixed')
      .replace(/{{END_GOAL}}/g, userProfile?.end_goal || 'Master machine learning fundamentals')
      .replace(/{{BUDGET_JSON}}/g, JSON.stringify({ budget: userProfile?.budget || 0 }))
      .replace(/{{CORE_COMPETENCY_BLOCK}}/g, 'Machine Learning Fundamentals, Data Science, Programming')
      .replace(/{{MONTH_GOALS_JSON}}/g, JSON.stringify({ goals: ['Build foundation', 'Complete projects', 'Master concepts'] }))

    // Call Gemini API with formatted prompt
    const geminiResponse = await callGeminiAPI(formattedPrompt, action, payload, currentWeek)

    if (geminiResponse.success) {
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

async function callGeminiAPI(prompt: string, action: string, payload: any, weekNumber: number) {
  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Map our actions to the prompt's expected commands
    let command;
    if (action === 'GET_DAILY_LESSON') {
      command = 'BEGIN_WEEK';
    } else if (action === 'GET_WEEKLY_PLAN') {
      command = 'BEGIN_WEEK';
    } else {
      command = action;
    }

    const geminiPrompt = `${prompt}\n\nCommand: ${command}\n\nGenerate a comprehensive weekly learning plan for week ${weekNumber}. Include all required sections from the prompt template.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: geminiPrompt
            }]
          }]
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const generatedText = data.candidates[0]?.content?.parts[0]?.text || ''

    // Parse the response based on the action
    if (action === 'GET_DAILY_LESSON' || action === 'GET_WEEKLY_PLAN') {
      return {
        success: true,
        data: {
          title: extractDailyTitle(generatedText),
          description: extractWeeklyDescription(generatedText),
          objectives: extractDailyObjectives(generatedText),
          key_concepts: extractKeyConcepts(generatedText),
          resources: extractResources(generatedText),
          content: extractDailyContent(generatedText),
          exercises: extractDailyExercises(generatedText),
          estimated_duration: extractDailyDuration(generatedText),
          weekly_summary: extractWeeklySummary(generatedText),
          daily_breakdown: extractDailyBreakdown(generatedText),
          plan_duration: extractPlanDuration(generatedText)
        }
      }
    }

    return {
      success: true,
      data: {
        message: generatedText
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Helper functions to extract information from Gemini response
function extractDailyTitle(text: string): string {
  const match = text.match(/Weekly Theme[^\n]*: ([^\n]+)/i)
  return match ? match[1].trim() : 'Weekly Learning Module'
}

function extractWeeklyDescription(text: string): string {
  const match = text.match(/Weekly Theme[^\n]*: ([^\n]+)/i)
  return match ? match[1].trim() : 'Comprehensive weekly learning plan'
}

function extractDailyObjectives(text: string): string[] {
  const objectivesMatch = text.match(/SMART Learning Objectives[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i)
  if (objectivesMatch) {
    const objectivesText = objectivesMatch[1]
    const objectives = objectivesText.match(/\d+\.\s*([^\n]+)/g)
    return objectives ? objectives.map(obj => obj.replace(/\d+\.\s*/, '').trim()) : []
  }
  return ['Master core concepts', 'Complete practical exercises', 'Build foundational knowledge']
}

function extractWeeklyObjectives(text: string): string[] {
  return extractDailyObjectives(text)
}

function extractKeyConcepts(text: string): string[] {
  const conceptsMatch = text.match(/Core Theoretical Concepts[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i)
  if (conceptsMatch) {
    const conceptsText = conceptsMatch[1]
    const concepts = conceptsText.match(/\d+\.\s*([^\n]+)/g)
    return concepts ? concepts.map(concept => concept.replace(/\d+\.\s*/, '').trim()) : []
  }
  return ['Machine Learning Fundamentals', 'Data Science Principles', 'Programming Best Practices']
}

function extractResources(text: string): string[] {
  const resourcesMatch = text.match(/Curated Resources[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i)
  if (resourcesMatch) {
    const resourcesText = resourcesMatch[1]
    const resources = resourcesMatch[1].match(/\d+\.\s*([^\n]+)/g)
    return resources ? resources.map(resource => resource.replace(/\d+\.\s*/, '').trim()) : []
  }
  return ['Online tutorials', 'Documentation', 'Practice exercises']
}

function extractDailyContent(text: string): string {
  const contentMatch = text.match(/Weekly Theme[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i)
  return contentMatch ? contentMatch[1].trim() : 'Comprehensive weekly learning content'
}

function extractDailyExercises(text: string): string[] {
  const exercisesMatch = text.match(/Capstone Project[^\n]*:([\s\S]*?)(?=\n\n|$)/i)
  if (exercisesMatch) {
    const exercisesText = exercisesMatch[1]
    const exercises = exercisesText.match(/\d+\.\s*([^\n]+)/g)
    return exercises ? exercises.map(exercise => exercise.replace(/\d+\.\s*/, '').trim()) : []
  }
  return ['Practice exercises', 'Mini-projects', 'Code challenges']
}

function extractDailyDuration(text: string): number {
  // Extract duration from the response, default to 25 minutes
  return 25
}

function extractWeeklySummary(text: string): string {
  const summaryMatch = text.match(/Weekly Theme[^\n]*: ([^\n]+)/i)
  return summaryMatch ? summaryMatch[1].trim() : 'Weekly learning module with comprehensive coverage'
}

function extractDailyBreakdown(text: string): string[] {
  const breakdownMatch = text.match(/Daily Socratic Prompts[^\n]*:([\s\S]*?)(?=\n\s*\d+\.|$)/i)
  if (breakdownMatch) {
    const breakdownText = breakdownMatch[1]
    const breakdown = breakdownText.match(/\d+\.\s*([^\n]+)/g)
    return breakdown ? breakdown.map(item => item.replace(/\d+\.\s*/, '').trim()) : []
  }
  return ['Day 1: Foundation', 'Day 2: Practice', 'Day 3: Application', 'Day 4: Review', 'Day 5: Assessment']
}

function extractPlanDuration(text: string): number {
  // Extract plan duration from the response, default to 5 days
  return 5
}
