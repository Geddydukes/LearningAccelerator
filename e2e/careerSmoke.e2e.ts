/**
 * Career Match E2E Smoke Test
 * 
 * Tests the complete career matching flow:
 * 1. Inserts sample user with skills
 * 2. Mocks Remotive API responses
 * 3. Invokes career-match function
 * 4. Verifies match results in database
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Career Match E2E', () => {
  let supabase: any;
  
  test.beforeEach(async () => {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://jclgmvbkrlkppecwnljv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';
    supabase = createClient(supabaseUrl, supabaseKey);
  });

  test('should generate career matches for user', async ({ request }) => {
    // 1. Insert sample user profile
    const testUserId = 'test-user-' + Date.now();
    const userProfile = {
      user_id: testUserId,
      track: 'ai_ml',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'AWS'],
      experience_level: 'intermediate',
      location_preference: 'Remote',
      salary_expectation: 120000,
      remote_preference: true,
      created_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(userProfile);

    expect(profileError).toBeNull();

    // 2. Mock Remotive API response
    const mockJobs = [
      {
        id: 'job-1',
        title: 'Senior Machine Learning Engineer',
        company_name: 'TechCorp',
        candidate_required_location: 'Remote',
        salary_min: 120000,
        salary_max: 180000,
        description: 'Build and deploy ML models for production systems',
        requirements: ['Python', 'TensorFlow', 'AWS', '5+ years experience'],
        skills: ['Machine Learning', 'Python', 'TensorFlow', 'AWS'],
        url: 'https://example.com/job1',
        publication_date: '2025-01-19'
      },
      {
        id: 'job-2',
        title: 'Data Scientist',
        company_name: 'DataCorp',
        candidate_required_location: 'San Francisco, CA',
        salary_min: 100000,
        salary_max: 150000,
        description: 'Analyze data and build predictive models',
        requirements: ['Python', 'SQL', 'Machine Learning', '3+ years experience'],
        skills: ['Python', 'SQL', 'Machine Learning', 'Pandas'],
        url: 'https://example.com/job2',
        publication_date: '2025-01-18'
      }
    ];

    // 3. Invoke career-match function with mock data
    const response = await request.post('/functions/v1/career-match', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      data: {
        mock_remotive: true,
        mock_jobs: mockJobs
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.matches_count).toBeGreaterThan(0);

    // 4. Verify matches in database
    const { data: matches, error: matchesError } = await supabase
      .from('career_matches')
      .select('*')
      .eq('user_id', testUserId);

    expect(matchesError).toBeNull();
    expect(matches).toBeDefined();
    expect(matches.length).toBeGreaterThan(0);

    // 5. Verify match structure
    const firstMatch = matches[0];
    expect(firstMatch.user_id).toBe(testUserId);
    expect(firstMatch.match_json).toBeDefined();
    expect(firstMatch.match_json.match_score).toBeGreaterThan(0.7);
    expect(firstMatch.match_json.job_data).toBeDefined();
    expect(firstMatch.match_json.match_reasons).toBeDefined();
    expect(Array.isArray(firstMatch.match_json.match_reasons)).toBe(true);

    // 6. Clean up test data
    await supabase
      .from('career_matches')
      .delete()
      .eq('user_id', testUserId);

    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', testUserId);
  });

  test('should handle empty user profiles gracefully', async ({ request }) => {
    // Clear all user profiles for this test
    await supabase
      .from('user_profiles')
      .delete()
      .neq('user_id', 'system');

    const response = await request.post('/functions/v1/career-match', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      data: {
        mock_remotive: true,
        mock_jobs: []
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.matches_count).toBe(0);
    expect(result.users_processed).toBe(0);
  });

  test('should respect match score threshold', async ({ request }) => {
    // Insert user with low-skill profile
    const testUserId = 'test-user-low-skill-' + Date.now();
    const lowSkillProfile = {
      user_id: testUserId,
      track: 'ai_ml',
      skills: ['Basic Python'], // Minimal skills
      experience_level: 'beginner',
      location_preference: 'Remote',
      salary_expectation: 50000,
      remote_preference: true,
      created_at: new Date().toISOString()
    };

    await supabase
      .from('user_profiles')
      .insert(lowSkillProfile);

    // Mock high-skill job
    const highSkillJob = {
      id: 'senior-job',
      title: 'Senior ML Engineer',
      company_name: 'TechCorp',
      candidate_required_location: 'Remote',
      salary_min: 150000,
      salary_max: 200000,
      description: 'Senior role requiring extensive ML experience',
      requirements: ['PhD in ML', '10+ years experience', 'Published papers'],
      skills: ['Advanced ML', 'Research', 'Leadership'],
      url: 'https://example.com/senior-job',
      publication_date: '2025-01-19'
    };

    const response = await request.post('/functions/v1/career-match', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      data: {
        mock_remotive: true,
        mock_jobs: [highSkillJob]
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    
    // Should not match due to skill mismatch
    const { data: matches } = await supabase
      .from('career_matches')
      .select('*')
      .eq('user_id', testUserId);

    expect(matches.length).toBe(0);

    // Clean up
    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', testUserId);
  });

  test('should generate appropriate match reasons', async ({ request }) => {
    // Insert user with good skill match
    const testUserId = 'test-user-match-' + Date.now();
    const matchingProfile = {
      user_id: testUserId,
      track: 'ai_ml',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'AWS'],
      experience_level: 'intermediate',
      location_preference: 'Remote',
      salary_expectation: 120000,
      remote_preference: true,
      created_at: new Date().toISOString()
    };

    await supabase
      .from('user_profiles')
      .insert(matchingProfile);

    // Mock matching job
    const matchingJob = {
      id: 'matching-job',
      title: 'ML Engineer',
      company_name: 'TechCorp',
      candidate_required_location: 'Remote',
      salary_min: 100000,
      salary_max: 140000,
      description: 'Build ML models with Python and TensorFlow',
      requirements: ['Python', 'TensorFlow', 'AWS', '2+ years experience'],
      skills: ['Python', 'TensorFlow', 'AWS', 'Machine Learning'],
      url: 'https://example.com/matching-job',
      publication_date: '2025-01-19'
    };

    const response = await request.post('/functions/v1/career-match', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      data: {
        mock_remotive: true,
        mock_jobs: [matchingJob]
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);

    // Verify match with reasons
    const { data: matches } = await supabase
      .from('career_matches')
      .select('*')
      .eq('user_id', testUserId);

    expect(matches.length).toBeGreaterThan(0);
    const match = matches[0];
    expect(match.match_json.match_reasons).toBeDefined();
    expect(Array.isArray(match.match_json.match_reasons)).toBe(true);
    expect(match.match_json.match_reasons.length).toBeGreaterThan(0);

    // Clean up
    await supabase
      .from('career_matches')
      .delete()
      .eq('user_id', testUserId);

    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', testUserId);
  });
}); 