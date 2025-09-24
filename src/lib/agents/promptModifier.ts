export interface ComprehensionResult {
  questions: Array<{
    question: string;
    userAnswer: string;
    understandingLevel: 'mastered' | 'needs_work' | 'not_understood';
  }>;
  overallUnderstanding: Record<string, 'mastered' | 'needs_work' | 'not_understood'>;
}

export interface ModifiedPrompts {
  ta: {
    basePrompt: string;
    userUnderstanding: Record<string, string>;
    instructorNotes: string;
    practiceFocus: string[];
  };
  socratic: {
    basePrompt: string;
    userUnderstanding: Record<string, string>;
    instructorNotes: string;
    socraticFocus: string[];
  };
}

export interface InstructorModifications {
  userUnderstanding: Record<string, string>;
  instructorNotes: string;
  practiceFocus: string[];
}

/**
 * Modifies prompts for practice sessions based on comprehension results
 */
export async function modifyPromptsForPractice(
  basePrompt: string,
  comprehensionResults: ComprehensionResult
): Promise<ModifiedPrompts> {
  try {
    // Call instructor agent to modify prompts
    const response = await fetch('/functions/v1/instructor-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        action: 'MODIFY_PRACTICE_PROMPTS',
        payload: {
          basePrompt,
          comprehensionResults
        },
        userId: getCurrentUserId()
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        ta: {
          basePrompt: result.data.ta_prompt,
          userUnderstanding: comprehensionResults.overallUnderstanding,
          instructorNotes: result.data.instructor_notes || '',
          practiceFocus: result.data.practice_focus || []
        },
        socratic: {
          basePrompt: result.data.socratic_prompt,
          userUnderstanding: comprehensionResults.overallUnderstanding,
          instructorNotes: result.data.instructor_notes || '',
          socraticFocus: result.data.socratic_focus || []
        }
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to modify prompts:', error);
    // Return fallback prompts
    return createFallbackPrompts(basePrompt, comprehensionResults);
  }
}

/**
 * Creates fallback prompts when the instructor agent is unavailable
 */
function createFallbackPrompts(
  basePrompt: string, 
  comprehensionResults: ComprehensionResult
): ModifiedPrompts {
  const needsWorkAreas = Object.entries(comprehensionResults.overallUnderstanding)
    .filter(([_, level]) => level === 'needs_work')
    .map(([area, _]) => area);

  const masteredAreas = Object.entries(comprehensionResults.overallUnderstanding)
    .filter(([_, level]) => level === 'mastered')
    .map(([area, _]) => area);

  return {
    ta: {
      basePrompt: `${basePrompt}\n\nFocus Areas: ${needsWorkAreas.join(', ')}\nStrengths: ${masteredAreas.join(', ')}`,
      userUnderstanding: comprehensionResults.overallUnderstanding,
      instructorNotes: 'Focus on areas that need work while reinforcing mastered concepts',
      practiceFocus: needsWorkAreas
    },
    socratic: {
      basePrompt: `${basePrompt}\n\nAreas needing clarification: ${needsWorkAreas.join(', ')}\nStrong areas: ${masteredAreas.join(', ')}`,
      userUnderstanding: comprehensionResults.overallUnderstanding,
      instructorNotes: 'Use Socratic questioning to deepen understanding in weak areas',
      socraticFocus: needsWorkAreas
    }
  };
}

/**
 * Analyzes comprehension results to determine practice focus
 */
export function analyzeComprehensionResults(comprehensionResults: ComprehensionResult): {
  strengths: string[];
  weaknesses: string[];
  recommendedFocus: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  Object.entries(comprehensionResults.overallUnderstanding).forEach(([area, level]) => {
    if (level === 'mastered') {
      strengths.push(area);
    } else if (level === 'needs_work' || level === 'not_understood') {
      weaknesses.push(area);
    }
  });

  return {
    strengths,
    weaknesses,
    recommendedFocus: weaknesses.length > 0 ? weaknesses : strengths
  };
}

/**
 * Formats instructor modifications for agent consumption
 */
export function formatInstructorModifications(modifications: InstructorModifications): string {
  return `
Instructor Modifications:
- User Understanding: ${JSON.stringify(modifications.userUnderstanding)}
- Instructor Notes: ${modifications.instructorNotes}
- Practice Focus: ${modifications.practiceFocus.join(', ')}
`;
}

/**
 * Validates comprehension results before processing
 */
export function validateComprehensionResults(results: ComprehensionResult): boolean {
  if (!results.questions || results.questions.length === 0) {
    return false;
  }
  
  if (!results.overallUnderstanding || Object.keys(results.overallUnderstanding).length === 0) {
    return false;
  }
  
  return results.questions.every(q => 
    q.question && 
    q.userAnswer && 
    ['mastered', 'needs_work', 'not_understood'].includes(q.understandingLevel)
  );
}

// Helper functions (these would typically be imported from auth utilities)
function getAuthToken(): string {
  // This should be implemented based on your auth system
  return localStorage.getItem('auth_token') || '';
}

function getCurrentUserId(): string {
  // This should be implemented based on your auth system
  return localStorage.getItem('user_id') || '';
}
