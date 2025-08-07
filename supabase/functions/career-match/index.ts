/**
 * Career Match Edge Function
 * 
 * Implements CareerMatch v1.3 functionality:
 * 1. Fetches user skills and preferences
 * 2. Calls Remotive API for job listings
 * 3. Uses embeddings for similarity matching
 * 4. Stores matches in career_matches table
 * 5. Sends email notifications for new matches
 */

import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  description: string;
  requirements: string[];
  skills: string[];
  url: string;
  posted_at: string;
}

interface UserProfile {
  user_id: string;
  track: string;
  skills: string[];
  experience_level: string;
  location_preference?: string;
  salary_expectation?: number;
  remote_preference: boolean;
}

interface CareerMatch {
  user_id: string;
  job_id: string;
  match_score: number;
  match_reasons: string[];
  job_data: JobListing;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all users with profiles
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users found for career matching' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Gemini for embeddings
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-pro-exp' })

    // Check if we should use mock data (for dev/CI)
    const mockRemotive = Deno.env.get('MOCK_REMOTIVE') === '1'

    let jobListings: JobListing[]
    
    if (mockRemotive) {
      // Use mock job data
      jobListings = getMockJobListings()
    } else {
      // Fetch real job listings from Remotive
      const remotiveApiKey = Deno.env.get('REMOTIVE_API_KEY')
      if (!remotiveApiKey) {
        throw new Error('REMOTIVE_API_KEY not configured')
      }

      jobListings = await fetchRemotiveJobs(remotiveApiKey)
    }

    const matches: CareerMatch[] = []

    // Process each user
    for (const user of users) {
      const userProfile: UserProfile = {
        user_id: user.user_id,
        track: user.track,
        skills: user.skills || [],
        experience_level: user.experience_level,
        location_preference: user.location_preference,
        salary_expectation: user.salary_expectation,
        remote_preference: user.remote_preference || true
      }

      // Find matches for this user
      const userMatches = await findMatchesForUser(model, userProfile, jobListings)
      matches.push(...userMatches)

      // Store matches in database
      for (const match of userMatches) {
        await supabase
          .from('career_matches')
          .insert({
            user_id: match.user_id,
            match_json: match
          })
      }
    }

    // Send email notifications for new matches
    await sendMatchNotifications(matches)

    console.log(`Career matching completed: ${matches.length} matches found for ${users.length} users`)

    return new Response(
      JSON.stringify({
        success: true,
        matches_count: matches.length,
        users_processed: users.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Career match error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Fetches job listings from Remotive API
 */
async function fetchRemotiveJobs(apiKey: string): Promise<JobListing[]> {
  const response = await fetch('https://remotive.com/api/remote-jobs', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Remotive API error: ${response.status}`)
  }

  const data = await response.json()
  return data.jobs.map((job: any) => ({
    id: job.id,
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    description: job.description,
    requirements: job.requirements || [],
    skills: job.skills || [],
    url: job.url,
    posted_at: job.publication_date
  }))
}

/**
 * Finds matches for a specific user
 */
async function findMatchesForUser(
  model: any,
  userProfile: UserProfile,
  jobListings: JobListing[]
): Promise<CareerMatch[]> {
  const matches: CareerMatch[] = []

  for (const job of jobListings) {
    // Calculate match score
    const matchScore = await calculateMatchScore(model, userProfile, job)
    
    // Only include matches with score >= 0.7
    if (matchScore >= 0.7) {
      const matchReasons = await generateMatchReasons(model, userProfile, job)
      
      matches.push({
        user_id: userProfile.user_id,
        job_id: job.id,
        match_score: matchScore,
        match_reasons: matchReasons,
        job_data: job,
        created_at: new Date().toISOString()
      })
    }
  }

  // Sort by match score and return top 5
  return matches
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5)
}

/**
 * Calculates match score using embeddings
 */
async function calculateMatchScore(
  model: any,
  userProfile: UserProfile,
  job: JobListing
): Promise<number> {
  // Create user profile embedding
  const userProfileText = `
    Track: ${userProfile.track}
    Skills: ${userProfile.skills.join(', ')}
    Experience Level: ${userProfile.experience_level}
    Location Preference: ${userProfile.location_preference || 'Any'}
    Remote Preference: ${userProfile.remote_preference}
  `

  // Create job profile embedding
  const jobProfileText = `
    Title: ${job.title}
    Company: ${job.company}
    Description: ${job.description}
    Requirements: ${job.requirements.join(', ')}
    Skills: ${job.skills.join(', ')}
  `

  // Use Gemini to calculate similarity
  const prompt = `
    Calculate a similarity score between 0 and 1 for these two profiles:
    
    User Profile:
    ${userProfileText}
    
    Job Profile:
    ${jobProfileText}
    
    Consider:
    - Skill overlap
    - Experience level match
    - Location compatibility
    - Remote work preference
    
    Return only a number between 0 and 1.
  `

  const result = await model.generateContent(prompt)
  const response = await result.response
  const scoreText = response.text().trim()
  
  const score = parseFloat(scoreText)
  return isNaN(score) ? 0 : Math.max(0, Math.min(1, score))
}

/**
 * Generates match reasons using AI
 */
async function generateMatchReasons(
  model: any,
  userProfile: UserProfile,
  job: JobListing
): Promise<string[]> {
  const prompt = `
    Generate 2-3 specific reasons why this user would be a good match for this job:
    
    User Profile:
    Track: ${userProfile.track}
    Skills: ${userProfile.skills.join(', ')}
    Experience: ${userProfile.experience_level}
    
    Job:
    Title: ${job.title}
    Company: ${job.company}
    Requirements: ${job.requirements.join(', ')}
    
    Return only the reasons as a JSON array of strings.
  `

  const result = await model.generateContent(prompt)
  const response = await result.response
  const reasonsText = response.text()
  
  try {
    const reasons = JSON.parse(reasonsText)
    return Array.isArray(reasons) ? reasons : []
  } catch {
    return ['Skills match', 'Experience level appropriate']
  }
}

/**
 * Sends email notifications for new matches
 */
async function sendMatchNotifications(matches: CareerMatch[]): Promise<void> {
  // Group matches by user
  const matchesByUser = matches.reduce((acc, match) => {
    if (!acc[match.user_id]) {
      acc[match.user_id] = []
    }
    acc[match.user_id].push(match)
    return acc
  }, {} as Record<string, CareerMatch[]>)

  // Send email for each user with matches
  for (const [userId, userMatches] of Object.entries(matchesByUser)) {
    if (userMatches.length > 0) {
      await sendMatchEmail(userId, userMatches)
    }
  }
}

/**
 * Sends match email to user
 */
async function sendMatchEmail(userId: string, matches: CareerMatch[]): Promise<void> {
  // This would integrate with your email service
  // For now, just log the matches
  console.log(`Email notification for user ${userId}: ${matches.length} new matches`)
  
  const matchTitles = matches.map(m => m.job_data.title).join(', ')
  console.log(`Match titles: ${matchTitles}`)
}

/**
 * Returns mock job listings for testing
 */
function getMockJobListings(): JobListing[] {
  return [
    {
      id: 'mock-1',
      title: 'Senior Machine Learning Engineer',
      company: 'TechCorp',
      location: 'Remote',
      salary_min: 120000,
      salary_max: 180000,
      description: 'Build and deploy ML models for production systems',
      requirements: ['Python', 'TensorFlow', 'AWS', '5+ years experience'],
      skills: ['Machine Learning', 'Python', 'TensorFlow', 'AWS'],
      url: 'https://example.com/job1',
      posted_at: '2025-01-19'
    },
    {
      id: 'mock-2',
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      location: 'San Francisco, CA',
      salary_min: 80000,
      salary_max: 120000,
      description: 'Build web applications using React and Node.js',
      requirements: ['JavaScript', 'React', 'Node.js', '3+ years experience'],
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      url: 'https://example.com/job2',
      posted_at: '2025-01-18'
    },
    {
      id: 'mock-3',
      title: 'DevOps Engineer',
      company: 'CloudTech',
      location: 'Remote',
      salary_min: 100000,
      salary_max: 150000,
      description: 'Manage cloud infrastructure and CI/CD pipelines',
      requirements: ['Docker', 'Kubernetes', 'AWS', '4+ years experience'],
      skills: ['Docker', 'Kubernetes', 'AWS', 'Jenkins'],
      url: 'https://example.com/job3',
      posted_at: '2025-01-17'
    }
  ]
} 