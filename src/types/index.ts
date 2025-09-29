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
  instructor_lesson?: InstructorLesson;
  ta_session?: TASession;
  lead_engineer_briefing_note?: LeadEngineerBriefingNote;
  brand_strategy_package?: BrandStrategyPackage;
  clarifier_session?: ClarifierSession;
  onboarder_session?: OnboarderSession;
  career_match_session?: CareerMatchSession;
  portfolio_session?: PortfolioSession;
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

export interface InstructorLesson {
  lesson_id: string;
  title: string;
  objectives: string[];
  content: string;
  exercises: string[];
  estimated_duration: number;
  day_number: number;
  practice_options: Array<{
    type: 'socratic' | 'ta';
    title: string;
    description: string;
  }>;
  version?: string;
}

export interface TASession {
  session_id: string;
  exercise_id?: string;
  help_text: string;
  hints: string[];
  solution_steps: string[];
  is_completed: boolean;
  feedback?: string;
  suggestions?: string[];
  score?: number;
  max_score?: number;
  next_steps?: string;
  version?: string;
}

export interface ClarifierSession {
  session_id: string;
  user_goals: string[];
  requirements: string[];
  constraints: string[];
  priorities: string[];
  clarification_questions: string[];
  is_completed: boolean;
  version?: string;
}

export interface OnboarderSession {
  session_id: string;
  user_profile: {
    name: string;
    background: string;
    goals: string[];
    preferences: object;
  };
  learning_path: string[];
  initial_assessment: object;
  is_completed: boolean;
  version?: string;
}

export interface CareerMatchSession {
  session_id: string;
  career_opportunities: Array<{
    title: string;
    company: string;
    match_score: number;
    requirements: string[];
    benefits: string[];
  }>;
  skill_gaps: string[];
  recommendations: string[];
  is_completed: boolean;
  version?: string;
}

export interface PortfolioSession {
  session_id: string;
  portfolio_items: Array<{
    type: 'project' | 'article' | 'certification' | 'contribution';
    title: string;
    description: string;
    url?: string;
    skills_demonstrated: string[];
  }>;
  optimization_suggestions: string[];
  showcase_strategy: string[];
  is_completed: boolean;
  version?: string;
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
    instructor_lesson?: InstructorLesson;
    ta_session?: TASession;
    lead_engineer_briefing_note?: LeadEngineerBriefingNote;
    clarifier_session?: ClarifierSession;
    onboarder_session?: OnboarderSession;
    career_match_session?: CareerMatchSession;
    portfolio_session?: PortfolioSession;
    personal_reflection?: string;
  };
}

export interface CompletionStatus {
  clo_completed: boolean;
  socratic_completed: boolean;
  instructor_completed: boolean;
  ta_completed: boolean;
  alex_completed: boolean;
  brand_completed: boolean;
  clarifier_completed: boolean;
  onboarder_completed: boolean;
  career_match_completed: boolean;
  portfolio_completed: boolean;
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