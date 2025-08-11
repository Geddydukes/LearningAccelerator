export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  voice_preference?: string;
  learning_preferences?: LearningPreferences;
  xp?: number;
  created_at: string;
  updated_at: string;
}

export interface LearningPreferences {
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  focus_areas: string[];
  learning_pace: 'slow' | 'normal' | 'fast';
  preferred_interaction_style: 'text' | 'voice' | 'mixed';
}

export interface WeeklyNote {
  id: string;
  user_id: string;
  week_number: number;
  clo_briefing_note?: CLOBriefingNote;
  socratic_conversation?: SocraticConversation;
  lead_engineer_briefing_note?: LeadEngineerBriefingNote;
  brand_strategy_package?: BrandStrategyPackage;
  completion_status: CompletionStatus;
  created_at: string;
  updated_at: string;
}

export interface CLOBriefingNote {
  module_title: string;
  learning_objectives: string[];
  key_concepts: string[];
  estimated_duration: number;
  prerequisites: string[];
  resources: Resource[];
  assessment_criteria: string[];
  weekly_theme?: string;
  key_socratic_insight?: string;
  version?: string;
  // For handoff to Socratic agent
  socratic_prompts?: string[];
  focus_questions?: string[];
}

export interface SocraticConversation {
  session_id: string;
  messages: SocraticMessage[];
  total_questions: number;
  insights_generated: string[];
  voice_enabled: boolean;
  topic?: string;
  key_insight?: string;
  version?: string;
  // Summary for Brand agent
  learning_breakthrough?: string;
  engagement_level?: number;
}

export interface SocraticMessage {
  id: string;
  type: 'question' | 'response';
  content: string;
  audio_url?: string;
  timestamp: string;
}

export interface LeadEngineerBriefingNote {
  repository_url: string;
  analysis_summary: string;
  code_quality_score: number;
  recommendations: Recommendation[];
  technical_debt_items: TechnicalDebtItem[];
  best_practices_followed: string[];
  areas_for_improvement: string[];
  overall_competency_score?: number;
  key_areas_for_reinforcement?: string;
  version?: string;
  // Summary for Brand agent
  technical_highlights?: string[];
  skill_demonstration?: string;
}

export interface BrandStrategyPackage {
  content_themes: string[];
  kpi_metrics: KPIMetric[];
  social_content_suggestions: ContentSuggestion[];
  brand_voice_analysis: string;
  engagement_strategies: string[];
  version?: string;
  // Input from other agents
  weekly_intelligence_briefing?: {
    clo_briefing_note?: CLOBriefingNote;
    socratic_briefing_note?: SocraticConversation;
    lead_engineer_briefing_note?: LeadEngineerBriefingNote;
    personal_reflection?: string;
  };
}

export interface CompletionStatus {
  clo_completed: boolean;
  socratic_completed: boolean;
  alex_completed: boolean;
  brand_completed: boolean;
  overall_progress: number;
}

export interface Resource {
  title: string;
  type: 'article' | 'video' | 'exercise' | 'documentation';
  url: string;
  estimated_time: number;
}

export interface Recommendation {
  category: 'architecture' | 'performance' | 'security' | 'maintainability';
  priority: 'high' | 'medium' | 'low';
  description: string;
  implementation_steps: string[];
}

export interface TechnicalDebtItem {
  file_path: string;
  issue_type: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  suggested_fix: string;
}

export interface KPIMetric {
  name: string;
  current_value: number;
  target_value: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

export interface ContentSuggestion {
  platform: 'linkedin' | 'twitter' | 'blog' | 'youtube';
  content_type: 'post' | 'article' | 'video' | 'infographic';
  title: string;
  description: string;
  estimated_engagement: number;
}

export interface AgentStatus {
  name: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  last_interaction: string;
  progress: number;
}

export type Theme = 'light' | 'dark';