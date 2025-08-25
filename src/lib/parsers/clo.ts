// CLO (Chief Learning Officer) response parser
// Extracts structured sections and final JSON from CLO agent responses

export interface CLOSection {
  title: string;
  content: string;
  order: number;
}

export interface CLOAppendix {
  CLO_Briefing_Note?: any;
  CLO_Assessor_Directive?: any;
  version?: string;
}

export interface ParsedCLO {
  sections: CLOSection[];
  appendix: CLOAppendix;
  version: 'v2' | 'v3' | 'unknown';
  metadata: {
    totalSections: number;
    hasAppendix: boolean;
    isComplete: boolean;
  };
}

/**
 * Parse CLO response into structured sections and appendix
 */
export function parseCLOResponse(content: string): ParsedCLO {
  const sections = extractSections(content);
  const appendix = extractAppendix(content);
  const version = detectVersion(content);
  
  return {
    sections,
    appendix,
    version,
    metadata: {
      totalSections: sections.length,
      hasAppendix: Object.keys(appendix).length > 0,
      isComplete: sections.length >= 8 && Object.keys(appendix).length > 0
    }
  };
}

/**
 * Extract the 10 main sections from CLO response
 */
function extractSections(content: string): CLOSection[] {
  const sections: CLOSection[] = [];
  
  // Common CLO section patterns
  const sectionPatterns = [
    /(?:^|\n)(?:##\s*)?(?:Section\s+)?(\d+)[:\.]\s*(.+?)(?=\n(?:##\s*)?(?:Section\s+)?\d+[:\.]|$)/gis,
    /(?:^|\n)(?:##\s*)?([A-Z][^:\n]+):\s*(.+?)(?=\n(?:##\s*)?[A-Z][^:\n]+:|$)/gis,
    /(?:^|\n)(?:##\s*)?(\d+\.\s*[^:\n]+):\s*(.+?)(?=\n(?:##\s*)?\d+\.\s*[^:\n]+:|$)/gis
  ];

  for (const pattern of sectionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const order = parseInt(match[1]) || sections.length + 1;
      const title = match[1].trim();
      const content = match[2]?.trim() || '';
      
      if (content && !sections.some(s => s.title === title)) {
        sections.push({ title, content, order });
      }
    }
  }

  // If no structured sections found, try to split by headers
  if (sections.length === 0) {
    const headerPattern = /(?:^|\n)(?:##\s*)?([^:\n]+):\s*(.+?)(?=\n(?:##\s*)?[^:\n]+:|$)/gis;
    let match;
    let order = 1;
    
    while ((match = headerPattern.exec(content)) !== null) {
      const title = match[1].trim();
      const content = match[2]?.trim() || '';
      
      if (content && !sections.some(s => s.title === title)) {
        sections.push({ title, content, order: order++ });
      }
    }
  }

  // Sort by order and remove duplicates
  return sections
    .sort((a, b) => a.order - b.order)
    .filter((section, index, arr) => 
      arr.findIndex(s => s.title === section.title) === index
    );
}

/**
 * Extract JSON appendix from CLO response
 */
function extractAppendix(content: string): CLOAppendix {
  const appendix: CLOAppendix = {};
  
  // Look for CLO_Briefing_Note
  const briefingPattern = /CLO_Briefing_Note\s*[:=]\s*(\{)/i;
  const briefingMatch = content.match(briefingPattern);
  if (briefingMatch) {
    const startIndex = briefingMatch.index! + briefingMatch[0].length;
    const jsonStart = startIndex - 1; // Start from the opening brace
    
    // Find the matching closing brace by counting braces
    let braceCount = 0;
    let endIndex = jsonStart;
    
    for (let i = jsonStart; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    
    if (endIndex > jsonStart) {
      const jsonString = content.substring(jsonStart, endIndex);
      try {
        appendix.CLO_Briefing_Note = JSON.parse(jsonString);
      } catch (error) {
        console.warn('Failed to parse CLO_Briefing_Note JSON:', error);
      }
    }
  }

  // Look for CLO_Assessor_Directive
  const directivePattern = /CLO_Assessor_Directive\s*[:=]\s*(\{)/i;
  const directiveMatch = content.match(directivePattern);
  if (directiveMatch) {
    const startIndex = directiveMatch.index! + directiveMatch[0].length;
    const jsonStart = startIndex - 1; // Start from the opening brace
    
    // Find the matching closing brace by counting braces
    let braceCount = 0;
    let endIndex = jsonStart;
    
    for (let i = jsonStart; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    
    if (endIndex > jsonStart) {
      const jsonString = content.substring(jsonStart, endIndex);
      try {
        appendix.CLO_Assessor_Directive = JSON.parse(jsonString);
      } catch (error) {
        console.warn('Failed to parse CLO_Assessor_Directive JSON:', error);
      }
    }
  }

  // Look for version information
  const versionPattern = /version\s*[:=]\s*["']?([^"\s]+)["']?/i;
  const versionMatch = content.match(versionPattern);
  if (versionMatch) {
    appendix.version = versionMatch[1];
  }

  return appendix;
}

/**
 * Detect CLO response version
 */
function detectVersion(content: string): 'v2' | 'v3' | 'unknown' {
  if (content.includes('CLO_Briefing_Note') && content.includes('CLO_Assessor_Directive')) {
    return 'v3';
  } else if (content.includes('CLO_Briefing_Note')) {
    return 'v2';
  }
  return 'unknown';
}

/**
 * Get section by title (case-insensitive)
 */
export function getSectionByTitle(parsed: ParsedCLO, title: string): CLOSection | undefined {
  return parsed.sections.find(section => 
    section.title.toLowerCase().includes(title.toLowerCase())
  );
}

/**
 * Get section by order number
 */
export function getSectionByOrder(parsed: ParsedCLO, order: number): CLOSection | undefined {
  return parsed.sections.find(section => section.order === order);
}

/**
 * Check if CLO response is complete
 */
export function isCLOComplete(parsed: ParsedCLO): boolean {
  return parsed.metadata.isComplete;
}

/**
 * Get learning plan from CLO response
 */
export function getLearningPlan(parsed: ParsedCLO): any {
  if (parsed.appendix.CLO_Briefing_Note?.learning_plan) {
    return parsed.appendix.CLO_Briefing_Note.learning_plan;
  }
  
  // Fallback: look for learning plan in sections
  const planSection = getSectionByTitle(parsed, 'learning plan');
  if (planSection) {
    return { content: planSection.content };
  }
  
  return null;
}

/**
 * Get weekly breakdown from CLO response
 */
export function getWeeklyBreakdown(parsed: ParsedCLO): any[] {
  if (parsed.appendix.CLO_Briefing_Note?.weekly_breakdown) {
    return parsed.appendix.CLO_Briefing_Note.weekly_breakdown;
  }
  
  // Fallback: look for weekly breakdown in sections
  const weeklySection = getSectionByTitle(parsed, 'weekly');
  if (weeklySection) {
    // Try to extract structured data from text
    const weekPattern = /Week\s+(\d+)[:\.]\s*(.+?)(?=Week\s+\d+[:\.]|$)/gis;
    const weeks: any[] = [];
    let match;
    
    while ((match = weekPattern.exec(weeklySection.content)) !== null) {
      weeks.push({
        week: parseInt(match[1]),
        content: match[2].trim()
      });
    }
    
    return weeks;
  }
  
  return [];
}
