#!/usr/bin/env ts-node --transpile-only

import { readFileSync } from 'fs';
import { join } from 'path';

// Define the agents data (same as in buildAgentsManifest.ts)
const AGENTS = {
  clo: { id: "clo", promptPath: "prompts/base/clo_v3_1.yml" },
  socratic: { id: "socratic", promptPath: "prompts/base/socratic_v3.yml" },
  alex: { id: "alex", promptPath: "prompts/base/alex_v3.yml" },
  brand: { id: "brand", promptPath: "prompts/base/brand_strategist_v3.yml" },
  onboarder: { id: "onboarder", promptPath: "prompts/base/onboarder_v2.yml" },
  ta: { id: "ta", promptPath: "prompts/base/taagent_v1_4.yml" },
  career_match: { id: "career_match", promptPath: "prompts/base/career_match_v1_3.yml" },
  portfolio_curator: { id: "portfolio_curator", promptPath: "prompts/base/portfolio_v1_8.yml" },
  instructor: { id: "instructor", promptPath: "prompts/base/instructor_v2_2.yml" },
  clarifier: { id: "clarifier", promptPath: "prompts/base/clarifier_v3.yml" }
};

function checkManifestDrift(): void {
  console.log('🔍 Checking for manifest drift...');
  
  try {
    // Read the generated manifest
    const manifestPath = join(process.cwd(), 'build', 'agents.manifest.json');
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    
    console.log(`📋 Loaded manifest with ${Object.keys(manifest).length} agents`);
    
    let driftDetected = false;
    
    // Check that all registry agents are in manifest
    for (const [agentId, agentData] of Object.entries(AGENTS)) {
      if (!manifest[agentId]) {
        console.error(`❌ Agent '${agentId}' missing from manifest`);
        driftDetected = true;
        continue;
      }
      
      const manifestAgent = manifest[agentId];
      const expectedPromptPath = agentData.promptPath.split('/').pop();
      
      if (manifestAgent.promptPath !== expectedPromptPath) {
        console.error(`❌ Agent '${agentId}' prompt path mismatch:`);
        console.error(`   Registry: ${expectedPromptPath}`);
        console.error(`   Manifest: ${manifestAgent.promptPath}`);
        driftDetected = true;
      }
      
      if (manifestAgent.id !== agentId) {
        console.error(`❌ Agent '${agentId}' ID mismatch in manifest: ${manifestAgent.id}`);
        driftDetected = true;
      }
    }
    
    // Check for unexpected agents in manifest
    for (const manifestAgentId of Object.keys(manifest)) {
      if (!AGENTS[manifestAgentId as keyof typeof AGENTS]) {
        console.error(`❌ Unexpected agent '${manifestAgentId}' in manifest`);
        driftDetected = true;
      }
    }
    
    if (driftDetected) {
      console.error('💥 Manifest drift detected! Registry and manifest are out of sync.');
      process.exit(1);
    } else {
      console.log('✅ No manifest drift detected');
    }
    
  } catch (error) {
    console.error('❌ Failed to check manifest drift:', error.message);
    process.exit(1);
  }
}

// Run the check
checkManifestDrift();
