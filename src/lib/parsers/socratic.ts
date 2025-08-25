// Socratic method response parser
// Extracts Socratic_Briefing_Note and concept graphs from Socratic agent responses

export interface SocraticBriefingNote {
  topic: string;
  objectives: string[];
  questions: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration?: number;
  prerequisites?: string[];
  resources?: string[];
}

export interface ConceptGraph {
  nodes: Array<{
    id: string;
    label: string;
    type: 'concept' | 'question' | 'example' | 'prerequisite';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }>;
  edges: Array<{
    source: string;
    target: string;
    relationship: 'prerequisite' | 'leads_to' | 'example_of' | 'related_to';
  }>;
}

export interface ParsedSocratic {
  briefingNote?: SocraticBriefingNote;
  conceptGraph?: ConceptGraph;
  metadata: {
    hasBriefingNote: boolean;
    hasConceptGraph: boolean;
    isComplete: boolean;
    topic?: string;
  };
}

/**
 * Parse Socratic response into structured data
 */
export function parseSocraticResponse(content: string): ParsedSocratic {
  const briefingNote = extractBriefingNote(content);
  const conceptGraph = extractConceptGraph(content);
  const topic = extractTopic(content);
  
  return {
    briefingNote,
    conceptGraph,
    metadata: {
      hasBriefingNote: !!briefingNote,
      hasConceptGraph: !!conceptGraph,
      isComplete: !!briefingNote && !!conceptGraph,
      topic
    }
  };
}

/**
 * Extract Socratic_Briefing_Note from response
 */
function extractBriefingNote(content: string): SocraticBriefingNote | undefined {
  // Look for JSON code block
  const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = jsonBlockPattern.exec(content)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      if (parsed.Socratic_Briefing_Note) {
        return parsed.Socratic_Briefing_Note;
      }
    } catch (error) {
      // Not valid JSON, continue
    }
  }

  // Look for inline JSON
  const inlinePattern = /Socratic_Briefing_Note\s*[:=]\s*(\{[\s\S]*?\})/i;
  const inlineMatch = content.match(inlinePattern);
  if (inlineMatch) {
    try {
      return JSON.parse(inlineMatch[1]);
    } catch (error) {
      console.warn('Failed to parse inline Socratic_Briefing_Note:', error);
    }
  }

  return undefined;
}

/**
 * Extract concept graph from response
 */
function extractConceptGraph(content: string): ConceptGraph | undefined {
  // Look for concept graph in JSON blocks
  const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = jsonBlockPattern.exec(content)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      if (parsed.concept_graph || parsed.ConceptGraph) {
        return parsed.concept_graph || parsed.ConceptGraph;
      }
    } catch (error) {
      // Not valid JSON, continue
    }
  }

  // Look for concept graph in text format
  const graphSection = extractGraphFromText(content);
  if (graphSection) {
    return graphSection;
  }

  return undefined;
}

/**
 * Extract concept graph from text format
 */
function extractGraphFromText(content: string): ConceptGraph | undefined {
  const nodes: ConceptGraph['nodes'] = [];
  const edges: ConceptGraph['edges'] = [];
  
  // Look for node definitions
  const nodePattern = /(?:^|\n)([A-Z][^:\n]+):\s*(.+?)(?=\n[A-Z][^:\n]+:|$)/gi;
  let match;
  
  while ((match = nodePattern.exec(content)) !== null) {
    const label = match[1].trim();
    const description = match[2].trim();
    
    // Determine node type
    let type: ConceptGraph['nodes'][0]['type'] = 'concept';
    if (description.toLowerCase().includes('question')) type = 'question';
    if (description.toLowerCase().includes('example')) type = 'example';
    if (description.toLowerCase().includes('prerequisite')) type = 'prerequisite';
    
    // Determine difficulty
    let difficulty: ConceptGraph['nodes'][0]['difficulty'] | undefined;
    if (description.toLowerCase().includes('beginner')) difficulty = 'beginner';
    if (description.toLowerCase().includes('intermediate')) difficulty = 'intermediate';
    if (description.toLowerCase().includes('advanced')) difficulty = 'advanced';
    
    nodes.push({
      id: label.toLowerCase().replace(/\s+/g, '_'),
      label,
      type,
      difficulty
    });
  }
  
  // Look for relationships
  const relationshipPattern = /([A-Z][^:\n]+)\s+(?:leads to|prerequisite for|example of|related to)\s+([A-Z][^:\n]+)/gi;
  while ((match = relationshipPattern.exec(content)) !== null) {
    const source = match[1].trim().toLowerCase().replace(/\s+/g, '_');
    const target = match[2].trim().toLowerCase().replace(/\s+/g, '_');
    
    // Determine relationship type
    let relationship: ConceptGraph['edges'][0]['relationship'] = 'related_to';
    const relationshipText = match[0].toLowerCase();
    if (relationshipText.includes('leads to')) relationship = 'leads_to';
    if (relationshipText.includes('prerequisite')) relationship = 'prerequisite';
    if (relationshipText.includes('example')) relationship = 'example_of';
    
    edges.push({ source, target, relationship });
  }
  
  return nodes.length > 0 ? { nodes, edges } : undefined;
}

/**
 * Extract topic from response
 */
function extractTopic(content: string): string | undefined {
  // Look for topic indicators
  const topicPatterns = [
    /topic\s*[:=]\s*["']?([^"\n]+)["']?/i,
    /Topic\s*[:=]\s*["']?([^"\n]+)["']?/i,
    /(?:^|\n)([A-Z][^:\n]+):\s*(.+?)(?=\n[A-Z][^:\n]+:|$)/i
  ];
  
  for (const pattern of topicPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

/**
 * Check if Socratic response is complete
 */
export function isSocraticComplete(parsed: ParsedSocratic): boolean {
  return parsed.metadata.isComplete;
}

/**
 * Get questions from Socratic response
 */
export function getQuestions(parsed: ParsedSocratic): string[] {
  if (parsed.briefingNote?.questions) {
    return parsed.briefingNote.questions;
  }
  
  // Fallback: extract questions from text
  const questionPattern = /(?:^|\n)(\d+\.\s*[^?\n]+\?)/gi;
  const questions: string[] = [];
  let match;
  
  while ((match = questionPattern.exec(parsed.metadata.topic || '')) !== null) {
    questions.push(match[1].trim());
  }
  
  return questions;
}

/**
 * Get learning objectives from Socratic response
 */
export function getObjectives(parsed: ParsedSocratic): string[] {
  return parsed.briefingNote?.objectives || [];
}

/**
 * Get difficulty level from Socratic response
 */
export function getDifficultyLevel(parsed: ParsedSocratic): string | undefined {
  return parsed.briefingNote?.difficulty_level;
}
