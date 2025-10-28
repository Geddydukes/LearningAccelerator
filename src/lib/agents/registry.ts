export type AgentId =
  | "clo"
  | "socratic"
  | "alex"
  | "brand"
  | "onboarder"
  | "ta"
  | "career_match"
  | "portfolio_curator"
  | "instructor"
  | "clarifier";

/**
 * Subscription entitlements:
 * - "core": included in Pro & Enterprise
 * - "premium": included in Enterprise only (or Pro+AddOn if you enable add-ons)
 */
export type Entitlement = "core" | "premium";

/**
 * Orchestration mode:
 * - "weekly": produces week/day-scoped artifacts (feeds weekly_notes)
 * - "adhoc": produces on-demand artifacts (e.g., clarifier intent)
 */
export type OrchestrationMode = "weekly" | "adhoc";

import type { FeatherPhaseId } from '../feather-agent';

export type AgentMeta = {
  id: AgentId;
  title: string;                 // Short human label
  description: string;           // One-liner for tooltips
  entitlement: Entitlement;      // Gating
  mode: OrchestrationMode;       // Weekly vs Ad-hoc
  route: string;                 // Primary UI surface
  icon?: string;                 // Optional lucide/react icon name
  color?: string;                // Tailwind semantic (e.g., "indigo")
  promptPath: string;            // prompts/base/<file>.yml|md
  defaultPromptVersion?: string; // e.g. "v3.0"
  persistsTo: "agent_results" | "weekly_notes" | "both";
  rateLimitPerMin?: number;      // Soft client limit
  displayOrder: number;          // For menus/grids
  phases?: FeatherPhaseId[];     // Feather-agent phase identifiers
};

export const AGENTS: Record<AgentId, AgentMeta> = {
  clo: {
    id: "clo",
    title: "CLO",
    description: "Curriculum architect: weekly plans, objectives, handoffs.",
    entitlement: "core",
    mode: "weekly",
    route: "/home/workspace",
    icon: "GraduationCap",
    color: "indigo",
    promptPath: "prompts/base/clo_v3_1.yml",
    defaultPromptVersion: "3.1",
    persistsTo: "both",
    rateLimitPerMin: 4,
    displayOrder: 10,
    phases: ["lecture", "comprehension", "practice"],
  },
  socratic: {
    id: "socratic",
    title: "Socratic",
    description: "Question-only facilitator for concept mastery.",
    entitlement: "core",
    mode: "weekly",
    route: "/home/workspace",
    icon: "MessageCircleQuestion",
    color: "emerald",
    promptPath: "prompts/base/socratic_v3_1.yml",
    defaultPromptVersion: "3.1",
    persistsTo: "both",
    rateLimitPerMin: 8,
    displayOrder: 20,
    phases: ["comprehension", "reflection"],
  },
  alex: {
    id: "alex",
    title: "Lead Engineer",
    description: "Technical review, competency scoring, production readiness.",
    entitlement: "core",
    mode: "weekly",
    route: "/home/workspace",
    icon: "Wrench",
    color: "sky",
    promptPath: "prompts/base/alex_v3_1.yml",
    defaultPromptVersion: "3.1",
    persistsTo: "both",
    rateLimitPerMin: 3,
    displayOrder: 30
  },
  brand: {
    id: "brand",
    title: "Brand Strategist",
    description: "Content package + KPI snapshot tied to weekly theme.",
    entitlement: "premium",
    mode: "weekly",
    route: "/home/brand-career",
    icon: "Megaphone",
    color: "amber",
    promptPath: "prompts/base/brand_strategist_v3.yml",
    defaultPromptVersion: "3.0",
    persistsTo: "weekly_notes",
    rateLimitPerMin: 2,
    displayOrder: 90
  },
  onboarder: {
    id: "onboarder",
    title: "Onboarder",
    description: "Adaptive quiz + profile and starting plan.",
    entitlement: "core",
    mode: "adhoc",
    route: "/setup",
    icon: "ClipboardCheck",
    color: "violet",
    promptPath: "prompts/base/onboarder_v2_4.yml",
    defaultPromptVersion: "2.4",
    persistsTo: "agent_results",
    rateLimitPerMin: 2,
    displayOrder: 5
  },
  ta: {
    id: "ta",
    title: "TA Agent",
    description: "Daily micro-coach + sandbox prep and blockers.",
    entitlement: "core",
    mode: "weekly",
    route: "/home/workspace",
    icon: "Lightbulb",
    color: "teal",
    promptPath: "prompts/base/taagent_v1_5.yml",
    defaultPromptVersion: "1.5",
    persistsTo: "both",
    rateLimitPerMin: 6,
    displayOrder: 40,
    phases: ["practice", "reflection"],
  },
  career_match: {
    id: "career_match",
    title: "Career Match",
    description: "Job fit scoring, gap analysis, market targets.",
    entitlement: "premium",
    mode: "adhoc",
    route: "/home/brand-career",
    icon: "Target",
    color: "rose",
    promptPath: "prompts/base/careermatch_v1_3.yml",
    defaultPromptVersion: "1.3",
    persistsTo: "agent_results",
    rateLimitPerMin: 2,
    displayOrder: 100
  },
  portfolio_curator: {
    id: "portfolio_curator",
    title: "Portfolio",
    description: "Static site curation and build status.",
    entitlement: "premium",
    mode: "adhoc",
    route: "/home/brand-career",
    icon: "FolderGit2",
    color: "cyan",
    promptPath: "prompts/base/portfolio_v1_8.yml",
    defaultPromptVersion: "1.3",
    persistsTo: "agent_results",
    rateLimitPerMin: 1,
    displayOrder: 110
  },
  instructor: {
    id: "instructor",
    title: "Instructor",
    description: "Daily driver plan: integrates CLO/Socratic/TA/Alex + research.",
    entitlement: "core",
    mode: "weekly",
    route: "/home/workspace",
    icon: "BookOpenCheck",
    color: "blue",
    promptPath: "prompts/base/instructor_v2_2.yml",
    defaultPromptVersion: "2.2",
    persistsTo: "agent_results",
    rateLimitPerMin: 4,
    displayOrder: 15,
    phases: ["lecture", "comprehension", "practice"],
  },
  clarifier: {
    id: "clarifier",
    title: "Clarifier",
    description: "Turns vague goals into concrete, track-ready intents.",
    entitlement: "core",
    mode: "adhoc",
    route: "/home/workspace",
    icon: "Sparkles",
    color: "fuchsia",
    promptPath: "prompts/base/clarifier_v3_1.yml",
    defaultPromptVersion: "3.1",
    persistsTo: "agent_results",
    rateLimitPerMin: 6,
    displayOrder: 12
  }
};

/** Helpers */
export const isPremium = (id: AgentId) => AGENTS[id].entitlement === "premium";
export const byDisplayOrder = (a: AgentId, b: AgentId) =>
  AGENTS[a].displayOrder - AGENTS[b].displayOrder;

export const CORE_AGENTS = (Object.keys(AGENTS) as AgentId[])
  .filter(id => AGENTS[id].entitlement === "core")
  .sort(byDisplayOrder);

export const PREMIUM_AGENTS = (Object.keys(AGENTS) as AgentId[])
  .filter(id => AGENTS[id].entitlement === "premium")
  .sort(byDisplayOrder);

// Variable schemas for validation (requires zod)
// Note: Import zod where this is used to avoid bundling issues
export const variableSchemas = {
  clo: {
    TRACK_LABEL: { type: 'string', required: true, min: 2 },
    TIME_PER_WEEK: { type: 'number', required: true, min: 1, max: 60 },
    END_GOAL: { type: 'string', required: true, min: 4, max: 200 },
    LEARNING_STYLE: { type: 'enum', required: true, values: ['visual', 'verbal', 'kinesthetic', 'mixed'] },
    WEEK_NUMBER: { type: 'number', required: false, min: 1, max: 52 },
    BUDGET: { type: 'number', required: false, min: 0, max: 10000 },
    HARDWARE_SPECS: { type: 'string', required: false, max: 500 }
  },
  socratic: {
    LEARNING_OBJECTIVES: { type: 'array', required: true, minItems: 1, maxItems: 10 },
    CURRENT_PROGRESS: { type: 'number', required: false, min: 0, max: 1 },
    WEEK_NUMBER: { type: 'number', required: true, min: 1, max: 52 },
    DIFFICULTY_LEVEL: { type: 'enum', required: false, values: ['beginner', 'intermediate', 'advanced'] }
  },
  alex: {
    REPOSITORY_URL: { type: 'string', required: false, pattern: '^https?://' },
    WEEK_NUMBER: { type: 'number', required: true, min: 1, max: 52 },
    TECHNICAL_FOCUS: { type: 'string', required: false, max: 200 },
    CODE_QUALITY_TARGET: { type: 'number', required: false, min: 1, max: 10 }
  },
  brand: {
    WEEK_THEME: { type: 'string', required: true, min: 5, max: 100 },
    TARGET_AUDIENCE: { type: 'string', required: false, max: 200 },
    CONTENT_PILLARS: { type: 'array', required: false, minItems: 1, maxItems: 5 },
    WEEK_NUMBER: { type: 'number', required: true, min: 1, max: 52 }
  },
  ta: {
    DAILY_TASKS: { type: 'array', required: true, minItems: 1, maxItems: 10 },
    WEEK_NUMBER: { type: 'number', required: true, min: 1, max: 52 },
    DIFFICULTY_LEVEL: { type: 'enum', required: false, values: ['beginner', 'intermediate', 'advanced'] }
  },
  instructor: {
    INTEGRATION_CONTEXT: { type: 'string', required: false, max: 1000 },
    WEEK_NUMBER: { type: 'number', required: true, min: 1, max: 52 },
    RESEARCH_TOPICS: { type: 'array', required: false, maxItems: 5 }
  },
  clarifier: {
    VAGUE_GOAL: { type: 'string', required: true, min: 10, max: 500 },
    USER_CONTEXT: { type: 'string', required: false, max: 1000 }
  },
  onboarder: {
    USER_BACKGROUND: { type: 'string', required: false, max: 500 },
    CAREER_GOALS: { type: 'string', required: false, max: 300 },
    TIME_COMMITMENT: { type: 'number', required: false, min: 1, max: 40 }
  },
  career_match: {
    JOB_DESCRIPTIONS: { type: 'array', required: false, maxItems: 5 },
    SKILLS_INVENTORY: { type: 'array', required: false, maxItems: 20 },
    CAREER_LEVEL: { type: 'enum', required: false, values: ['entry', 'mid', 'senior', 'lead'] }
  },
  portfolio_curator: {
    PROJECT_URLS: { type: 'array', required: false, maxItems: 10 },
    TECH_STACK: { type: 'array', required: false, maxItems: 15 },
    PORTFOLIO_THEME: { type: 'string', required: false, max: 100 }
  }
} as const;
