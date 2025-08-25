#!/usr/bin/env ts-node --transpile-only

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Define the agents data directly in the script to avoid import issues
const AGENTS = {
  clo: {
    id: "clo",
    title: "CLO",
    description: "Curriculum architect: weekly plans, objectives, handoffs.",
    entitlement: "core" as const,
    mode: "weekly" as const,
    route: "/home/workspace",
    icon: "GraduationCap",
    color: "indigo",
    promptPath: "prompts/base/clo_v3.yml",
    defaultPromptVersion: "3.0",
    persistsTo: "both" as const,
    rateLimitPerMin: 4,
    displayOrder: 10
  },
  socratic: {
    id: "socratic",
    title: "Socratic",
    description: "Question-only facilitator for concept mastery.",
    entitlement: "core" as const,
    mode: "weekly" as const,
    route: "/home/workspace",
    icon: "MessageCircleQuestion",
    color: "emerald",
    promptPath: "prompts/base/socratic_v3.yml",
    defaultPromptVersion: "3.0",
    persistsTo: "both" as const,
    rateLimitPerMin: 8,
    displayOrder: 20
  },
  alex: {
    id: "alex",
    title: "Lead Engineer",
    description: "Technical review, competency scoring, production readiness.",
    entitlement: "core" as const,
    mode: "weekly" as const,
    route: "/home/workspace",
    icon: "Wrench",
    color: "sky",
    promptPath: "prompts/base/alex_v3.yml",
    defaultPromptVersion: "3.0",
    persistsTo: "both" as const,
    rateLimitPerMin: 3,
    displayOrder: 30
  },
  brand: {
    id: "brand",
    title: "Brand Strategist",
    description: "Content package + KPI snapshot tied to weekly theme.",
    entitlement: "premium" as const,
    mode: "weekly" as const,
    route: "/home/brand-career",
    icon: "Megaphone",
    color: "amber",
    promptPath: "prompts/base/brand_strategist_v3.yml",
    defaultPromptVersion: "3.0",
    persistsTo: "weekly_notes" as const,
    rateLimitPerMin: 2,
    displayOrder: 90
  },
  onboarder: {
    id: "onboarder",
    title: "Onboarder",
    description: "Adaptive quiz + profile and starting plan.",
    entitlement: "core" as const,
    mode: "adhoc" as const,
    route: "/setup",
    icon: "ClipboardCheck",
    color: "violet",
    promptPath: "prompts/base/onboarder_v2.yml",
    defaultPromptVersion: "2.0",
    persistsTo: "agent_results" as const,
    rateLimitPerMin: 2,
    displayOrder: 5
  },
  ta: {
    id: "ta",
    title: "TA Agent",
    description: "Daily micro-coach + sandbox prep and blockers.",
    entitlement: "core" as const,
    mode: "weekly" as const,
    route: "/home/workspace",
    icon: "Lightbulb",
    color: "teal",
    promptPath: "prompts/base/taagent_v1_4.yml",
    defaultPromptVersion: "1.4",
    persistsTo: "both" as const,
    rateLimitPerMin: 6,
    displayOrder: 40
  },
  career_match: {
    id: "career_match",
    title: "Career Match",
    description: "Job fit scoring, gap analysis, market targets.",
    entitlement: "premium" as const,
    mode: "adhoc" as const,
    route: "/home/brand-career",
    icon: "Target",
    color: "rose",
    promptPath: "prompts/base/career_match_v1_3.yml",
    defaultPromptVersion: "1.3",
    persistsTo: "agent_results" as const,
    rateLimitPerMin: 2,
    displayOrder: 100
  },
  portfolio_curator: {
    id: "portfolio_curator",
    title: "Portfolio",
    description: "Static site curation and build status.",
    entitlement: "premium" as const,
    mode: "adhoc" as const,
    route: "/home/brand-career",
    icon: "FolderGit2",
    color: "cyan",
    promptPath: "prompts/base/portfolio_v1_8.yml",
    defaultPromptVersion: "1.8",
    persistsTo: "agent_results" as const,
    rateLimitPerMin: 1,
    displayOrder: 110
  },
  instructor: {
    id: "instructor",
    title: "Instructor",
    description: "Daily driver plan: integrates CLO/Socratic/TA/Alex + research.",
    entitlement: "core" as const,
    mode: "weekly" as const,
    route: "/home/workspace",
    icon: "BookOpenCheck",
    color: "blue",
    promptPath: "prompts/base/instructor_v2_1.yml",
    defaultPromptVersion: "2.1",
    persistsTo: "agent_results" as const,
    rateLimitPerMin: 4,
    displayOrder: 15
  },
  clarifier: {
    id: "clarifier",
    title: "Clarifier",
    description: "Turns vague goals into concrete, track-ready intents.",
    entitlement: "core" as const,
    mode: "adhoc" as const,
    route: "/home/workspace",
    icon: "Sparkles",
    color: "fuchsia",
    promptPath: "prompts/base/clarifier_v3.yml",
    defaultPromptVersion: "3.0",
    persistsTo: "agent_results" as const,
    rateLimitPerMin: 6,
    displayOrder: 12
  }
};

type AgentId = keyof typeof AGENTS;

type AgentManifestItem = {
  id: string;
  promptPath: string;              // e.g. "clo_v3.yml"
  defaultPromptVersion?: string;   // e.g. "3.0"
  entitlement: "core" | "premium";
  mode: "weekly" | "adhoc";
};

function buildAgentsManifest(): void {
  console.log('🔨 Building agents manifest...');
  
  const manifest: Record<string, AgentManifestItem> = {};
  
  // Process each agent from the registry
  Object.entries(AGENTS).forEach(([id, agent]) => {
    // Extract just the filename from the full promptPath
    const promptPath = agent.promptPath.split('/').pop() || '';
    
    manifest[id] = {
      id,
      promptPath,
      defaultPromptVersion: agent.defaultPromptVersion,
      entitlement: agent.entitlement,
      mode: agent.mode
    };
    
    console.log(`  ✅ ${id}: ${promptPath} (${agent.entitlement}/${agent.mode})`);
  });
  
  // Ensure build directory exists
  const buildDir = join(process.cwd(), 'build');
  mkdirSync(buildDir, { recursive: true });
  
  // Write manifest to build directory
  const manifestPath = join(buildDir, 'agents.manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`📄 Manifest written to: ${manifestPath}`);
  console.log(`📊 Total agents: ${Object.keys(manifest).length}`);
  
  console.log('✅ Manifest built successfully');
}

// Run the function
buildAgentsManifest();
