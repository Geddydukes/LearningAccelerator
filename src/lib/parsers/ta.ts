// TA (Teaching Assistant) response parser
// Extracts TA_Session_Note, blockers, and sandbox notes from TA agent responses

export interface TASessionNote {
  session_id: string;
  topic: string;
  objectives: string[];
  activities: string[];
  duration: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  materials_needed?: string[];
}

export interface TABlocker {
  id: string;
  description: string;
  category: 'technical' | 'conceptual' | 'resource' | 'time' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggested_solutions: string[];
  resolved: boolean;
}

export interface TASandboxNote {
  exercise_name: string;
  description: string;
  setup_instructions: string[];
  expected_outcome: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  time_estimate: number;
  resources_required: string[];
}

export interface ParsedTA {
  sessionNote?: TASessionNote;
  blockers: TABlocker[];
  sandboxNotes: TASandboxNote[];
  metadata: {
    hasSessionNote: boolean;
    blockerCount: number;
    sandboxCount: number;
    isComplete: boolean;
  };
}

/**
 * Parse TA response into structured data
 */
export function parseTAResponse(content: string): ParsedTA {
  const sessionNote = extractSessionNote(content);
  const blockers = extractBlockers(content);
  const sandboxNotes = extractSandboxNotes(content);
  
  return {
    sessionNote,
    blockers,
    sandboxNotes,
    metadata: {
      hasSessionNote: !!sessionNote,
      blockerCount: blockers.length,
      sandboxCount: sandboxNotes.length,
      isComplete: !!sessionNote && blockers.length > 0
    }
  };
}

/**
 * Extract TA_Session_Note from response
 */
function extractSessionNote(content: string): TASessionNote | undefined {
  // Look for JSON code block
  const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = jsonBlockPattern.exec(content)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      if (parsed.TA_Session_Note) {
        return parsed.TA_Session_Note;
      }
    } catch (error) {
      // Not valid JSON, continue
    }
  }

  // Look for inline JSON
  const inlinePattern = /TA_Session_Note\s*[:=]\s*(\{[\s\S]*?\})/i;
  const inlineMatch = content.match(inlinePattern);
  if (inlineMatch) {
    try {
      return JSON.parse(inlineMatch[1]);
    } catch (error) {
      console.warn('Failed to parse inline TA_Session_Note:', error);
    }
  }

  return undefined;
}

/**
 * Extract blockers from response
 */
function extractBlockers(content: string): TABlocker[] {
  const blockers: TABlocker[] = [];
  
  // Look for JSON blocks with blockers
  const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = jsonBlockPattern.exec(content)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      if (parsed.blockers && Array.isArray(parsed.blockers)) {
        return parsed.blockers;
      }
    } catch (error) {
      // Not valid JSON, continue
    }
  }

  // Look for blockers in text format
  const blockerPattern = /(?:^|\n)(?:Blocker|Issue|Problem)\s+(\d+)[:\.]\s*(.+?)(?=\n(?:Blocker|Issue|Problem)\s+\d+[:\.]|$)/gis;
  let blockerMatch;
  let blockerId = 1;
  
  while ((blockerMatch = blockerPattern.exec(content)) !== null) {
    const description = blockerMatch[2].trim();
    
    // Determine category and severity from description
    const category = determineBlockerCategory(description);
    const severity = determineBlockerSeverity(description);
    const solutions = extractSuggestedSolutions(description);
    
    blockers.push({
      id: `blocker_${blockerId++}`,
      description,
      category,
      severity,
      suggested_solutions: solutions,
      resolved: false
    });
  }
  
  return blockers;
}

/**
 * Extract sandbox notes from response
 */
function extractSandboxNotes(content: string): TASandboxNote[] {
  const sandboxNotes: TASandboxNote[] = [];
  
  // Look for JSON blocks with sandbox notes
  const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = jsonBlockPattern.exec(content)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      if (parsed.sandbox_notes && Array.isArray(parsed.sandbox_notes)) {
        return parsed.sandbox_notes;
      }
    } catch (error) {
      // Not valid JSON, continue
    }
  }

  // Look for sandbox exercises in text format
  const exercisePattern = /(?:^|\n)(?:Exercise|Sandbox|Practice)\s+(\d+)[:\.]\s*(.+?)(?=\n(?:Exercise|Sandbox|Practice)\s+\d+[:\.]|$)/gis;
  let exerciseMatch;
  let exerciseId = 1;
  
  while ((exerciseMatch = exercisePattern.exec(content)) !== null) {
    const description = exerciseMatch[2].trim();
    
    // Extract exercise details
    const exerciseName = `Exercise ${exerciseId}`;
    const setupInstructions = extractSetupInstructions(description);
    const expectedOutcome = extractExpectedOutcome(description);
    const difficulty = determineExerciseDifficulty(description);
    const timeEstimate = extractTimeEstimate(description);
    const resourcesRequired = extractResourcesRequired(description);
    
    sandboxNotes.push({
      exercise_name: exerciseName,
      description,
      setup_instructions: setupInstructions,
      expected_outcome: expectedOutcome,
      difficulty,
      time_estimate: timeEstimate,
      resources_required: resourcesRequired
    });
    
    exerciseId++;
  }
  
  return sandboxNotes;
}

// Helper functions

function determineBlockerCategory(description: string): TABlocker['category'] {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('code') || lowerDesc.includes('error') || lowerDesc.includes('bug')) {
    return 'technical';
  }
  if (lowerDesc.includes('understand') || lowerDesc.includes('concept') || lowerDesc.includes('theory')) {
    return 'conceptual';
  }
  if (lowerDesc.includes('book') || lowerDesc.includes('video') || lowerDesc.includes('resource')) {
    return 'resource';
  }
  if (lowerDesc.includes('time') || lowerDesc.includes('schedule') || lowerDesc.includes('deadline')) {
    return 'time';
  }
  
  return 'other';
}

function determineBlockerSeverity(description: string): TABlocker['severity'] {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('critical') || lowerDesc.includes('blocking') || lowerDesc.includes('urgent')) {
    return 'critical';
  }
  if (lowerDesc.includes('high') || lowerDesc.includes('important') || lowerDesc.includes('major')) {
    return 'high';
  }
  if (lowerDesc.includes('medium') || lowerDesc.includes('moderate')) {
    return 'medium';
  }
  
  return 'low';
}

function extractSuggestedSolutions(description: string): string[] {
  const solutions: string[] = [];
  
  // Look for solution patterns
  const solutionPatterns = [
    /(?:solution|fix|resolve|try)[:\.]\s*(.+?)(?=\n|$)/gi,
    /(?:suggest|recommend)[:\.]\s*(.+?)(?=\n|$)/gi
  ];
  
  for (const pattern of solutionPatterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      solutions.push(match[1].trim());
    }
  }
  
  return solutions.length > 0 ? solutions : ['Review the issue and consult documentation'];
}

function extractSetupInstructions(description: string): string[] {
  const instructions: string[] = [];
  
  // Look for setup patterns
  const setupPattern = /(?:setup|install|configure)[:\.]\s*(.+?)(?=\n|$)/gi;
  let match;
  
  while ((match = setupPattern.exec(description)) !== null) {
    instructions.push(match[1].trim());
  }
  
  return instructions.length > 0 ? instructions : ['Follow the exercise description'];
}

function extractExpectedOutcome(description: string): string {
  // Look for outcome patterns
  const outcomePattern = /(?:outcome|result|goal)[:\.]\s*(.+?)(?=\n|$)/i;
  const match = description.match(outcomePattern);
  
  return match ? match[1].trim() : 'Complete the exercise successfully';
}

function determineExerciseDifficulty(description: string): TASandboxNote['difficulty'] {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('advanced') || lowerDesc.includes('expert')) {
    return 'advanced';
  }
  if (lowerDesc.includes('intermediate') || lowerDesc.includes('moderate')) {
    return 'intermediate';
  }
  
  return 'beginner';
}

function extractTimeEstimate(description: string): number {
  // Look for time patterns
  const timePattern = /(\d+)\s*(?:min|hour|day)/i;
  const match = description.match(timePattern);
  
  if (match) {
    const value = parseInt(match[1]);
    if (description.toLowerCase().includes('hour')) return value * 60;
    if (description.toLowerCase().includes('day')) return value * 1440;
    return value; // minutes
  }
  
  return 30; // default 30 minutes
}

function extractResourcesRequired(description: string): string[] {
  const resources: string[] = [];
  
  // Look for resource patterns
  const resourcePattern = /(?:need|require|use)[:\.]\s*(.+?)(?=\n|$)/gi;
  let match;
  
  while ((match = resourcePattern.exec(description)) !== null) {
    resources.push(match[1].trim());
  }
  
  return resources.length > 0 ? resources : ['Basic development environment'];
}

/**
 * Check if TA response is complete
 */
export function isTAComplete(parsed: ParsedTA): boolean {
  return parsed.metadata.isComplete;
}

/**
 * Get unresolved blockers
 */
export function getUnresolvedBlockers(parsed: ParsedTA): TABlocker[] {
  return parsed.blockers.filter(blocker => !blocker.resolved);
}

/**
 * Get blockers by severity
 */
export function getBlockersBySeverity(parsed: ParsedTA, severity: TABlocker['severity']): TABlocker[] {
  return parsed.blockers.filter(blocker => blocker.severity === severity);
}

/**
 * Get exercises by difficulty
 */
export function getExercisesByDifficulty(parsed: ParsedTA, difficulty: TASandboxNote['difficulty']): TASandboxNote[] {
  return parsed.sandboxNotes.filter(exercise => exercise.difficulty === difficulty);
}
