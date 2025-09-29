// Alex (Lead Engineer) response parser
// Extracts Lead_Engineer_Briefing_Note and METRICS_SUMMARY from Alex agent responses

export interface LeadEngineerBriefingNote {
  repository_url?: string;
  week_number: number;
  technical_focus: string;
  code_quality_target: number;
  review_priorities: string[];
  architecture_decisions: string[];
  technical_debt_items: string[];
  performance_metrics: {
    build_time?: number;
    test_coverage?: number;
    code_complexity?: number;
    security_scan_score?: number;
  };
}

export interface MetricsSummary {
  lines_of_code: number;
  files_changed: number;
  commits: number;
  pull_requests: number;
  code_review_score: number;
  test_coverage: number;
  build_status: 'passing' | 'failing' | 'pending';
  deployment_status: 'success' | 'failed' | 'in_progress';
}

export interface ParsedAlex {
  briefingNote?: LeadEngineerBriefingNote;
  metricsSummary?: MetricsSummary;
  metadata: {
    hasBriefingNote: boolean;
    hasMetricsSummary: boolean;
    isComplete: boolean;
    weekNumber?: number;
  };
}

/**
 * Parse Alex response into structured data
 */
export function parseAlexResponse(content: string): ParsedAlex {
  const briefingNote = extractBriefingNote(content);
  const metricsSummary = extractMetricsSummary(content);
  const weekNumber = extractWeekNumber(content);
  
  return {
    briefingNote,
    metricsSummary,
    metadata: {
      hasBriefingNote: !!briefingNote,
      hasMetricsSummary: !!metricsSummary,
      isComplete: !!briefingNote,
      weekNumber
    }
  };
}

/**
 * Extract Lead_Engineer_Briefing_Note from response
 */
function extractBriefingNote(content: string): LeadEngineerBriefingNote | undefined {
  // Look for JSON code block
  const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = jsonBlockPattern.exec(content)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      if (parsed.Lead_Engineer_Briefing_Note) {
        return parsed.Lead_Engineer_Briefing_Note;
      }
    } catch (error) {
      // Not valid JSON, continue
    }
  }

  // Look for inline JSON
  const inlinePattern = /Lead_Engineer_Briefing_Note\s*[:=]\s*(\{[\s\S]*?\})/i;
  const inlineMatch = content.match(inlinePattern);
  if (inlineMatch) {
    try {
      return JSON.parse(inlineMatch[1]);
    } catch (error) {
      console.warn('Failed to parse inline Lead_Engineer_Briefing_Note:', error);
    }
  }

  return undefined;
}

/**
 * Extract METRICS_SUMMARY from response
 */
function extractMetricsSummary(content: string): MetricsSummary | undefined {
  // Look for JSON code block
  const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = jsonBlockPattern.exec(content)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      if (parsed.METRICS_SUMMARY) {
        return parsed.METRICS_SUMMARY;
      }
    } catch (error) {
      // Not valid JSON, continue
    }
  }

  // Look for inline JSON
  const inlinePattern = /METRICS_SUMMARY\s*[:=]\s*(\{[\s\S]*?\})/i;
  const inlineMatch = content.match(inlinePattern);
  if (inlineMatch) {
    try {
      return JSON.parse(inlineMatch[1]);
    } catch (error) {
      console.warn('Failed to parse inline METRICS_SUMMARY:', error);
    }
  }

  return undefined;
}

/**
 * Extract week number from response
 */
function extractWeekNumber(content: string): number | undefined {
  // Look for week patterns
  const weekPatterns = [
    /week\s*(\d+)/i,
    /Week\s*(\d+)/i,
    /W(\d+)/i
  ];
  
  for (const pattern of weekPatterns) {
    const match = content.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  return undefined;
}

/**
 * Extract repository URL from response
 */
export function extractRepositoryUrl(content: string): string | undefined {
  // Look for URL patterns
  const urlPatterns = [
    /(https?:\/\/[^\s]+)/i,
    /github\.com\/[^\s]+/i,
    /gitlab\.com\/[^\s]+/i,
    /bitbucket\.org\/[^\s]+/i
  ];
  
  for (const pattern of urlPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return undefined;
}

/**
 * Extract technical focus areas from response
 */
export function extractTechnicalFocus(content: string): string[] {
  const focusAreas: string[] = [];
  
  // Look for technical focus patterns
  const focusPatterns = [
    /(?:focus|priority|focusing on)[:\.]\s*(.+?)(?=\n|$)/gi,
    /(?:technical|engineering|development)\s+(?:focus|priority)[:\.]\s*(.+?)(?=\n|$)/gi
  ];
  
  for (const pattern of focusPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const focus = match[1].trim();
      if (focus && !focusAreas.includes(focus)) {
        focusAreas.push(focus);
      }
    }
  }
  
  return focusAreas;
}

/**
 * Extract code quality metrics from response
 */
export function extractCodeQualityMetrics(content: string): Record<string, number> {
  const metrics: Record<string, number> = {};
  
  // Look for metric patterns
  const metricPatterns = [
    /(?:coverage|test coverage)[:\.]\s*(\d+)%/i,
    /(?:complexity|cyclomatic complexity)[:\.]\s*(\d+)/i,
    /(?:build time|build duration)[:\.]\s*(\d+)\s*(?:min|seconds?)/i,
    /(?:security score|security scan)[:\.]\s*(\d+)/i
  ];
  
  for (const pattern of metricPatterns) {
    const match = content.match(pattern);
    if (match) {
      const metricName = pattern.source.includes('coverage') ? 'test_coverage' :
                        pattern.source.includes('complexity') ? 'code_complexity' :
                        pattern.source.includes('build') ? 'build_time' :
                        pattern.source.includes('security') ? 'security_scan_score' : 'unknown';
      
      if (metricName !== 'unknown') {
        metrics[metricName] = parseInt(match[1], 10);
      }
    }
  }
  
  return metrics;
}

/**
 * Check if Alex response is complete
 */
export function isAlexComplete(parsed: ParsedAlex): boolean {
  return parsed.metadata.isComplete;
}

/**
 * Get technical debt items
 */
export function getTechnicalDebtItems(parsed: ParsedAlex): string[] {
  return parsed.briefingNote?.technical_debt_items || [];
}

/**
 * Get review priorities
 */
export function getReviewPriorities(parsed: ParsedAlex): string[] {
  return parsed.briefingNote?.review_priorities || [];
}

/**
 * Get architecture decisions
 */
export function getArchitectureDecisions(parsed: ParsedAlex): string[] {
  return parsed.briefingNote?.architecture_decisions || [];
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(parsed: ParsedAlex): Record<string, number> {
  return parsed.briefingNote?.performance_metrics || {};
}

/**
 * Check if metrics indicate good health
 */
export function isCodebaseHealthy(parsed: ParsedAlex): boolean {
  if (!parsed.metricsSummary) return false;
  
  const metrics = parsed.metricsSummary;
  
  return (
    metrics.test_coverage >= 80 &&
    metrics.code_review_score >= 7 &&
    metrics.build_status === 'passing' &&
    metrics.deployment_status === 'success'
  );
}

/**
 * Get code quality score (0-10)
 */
export function getCodeQualityScore(parsed: ParsedAlex): number {
  if (!parsed.metricsSummary) return 0;
  
  const metrics = parsed.metricsSummary;
  let score = 0;
  
  // Test coverage (0-3 points)
  if (metrics.test_coverage >= 90) score += 3;
  else if (metrics.test_coverage >= 80) score += 2;
  else if (metrics.test_coverage >= 70) score += 1;
  
  // Code review score (0-3 points)
  if (metrics.code_review_score >= 9) score += 3;
  else if (metrics.code_review_score >= 7) score += 2;
  else if (metrics.code_review_score >= 5) score += 1;
  
  // Build status (0-2 points)
  if (metrics.build_status === 'passing') score += 2;
  
  // Deployment status (0-2 points)
  if (metrics.deployment_status === 'success') score += 2;
  
  return score;
}
