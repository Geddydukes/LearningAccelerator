// Shared manifest utility for Edge functions
// Loads agent manifest from storage or falls back to bundled copy

export type AgentManifestItem = {
  id: string;
  promptPath: string;              // e.g. "clo_v3.yml"
  defaultPromptVersion?: string;   // e.g. "3.0"
  entitlement: "core" | "premium";
  mode: "weekly" | "adhoc";
};

// Bundled manifest fallback (will be updated by CI)
const BUNDLED_MANIFEST: Record<string, AgentManifestItem> = {
  "clo": {
    "id": "clo",
    "promptPath": "clo_v3.yml",
    "defaultPromptVersion": "3.0",
    "entitlement": "core",
    "mode": "weekly"
  },
  "socratic": {
    "id": "socratic",
    "promptPath": "socratic_v3.yml",
    "defaultPromptVersion": "3.0",
    "entitlement": "core",
    "mode": "weekly"
  },
  "alex": {
    "id": "alex",
    "promptPath": "alex_v3.yml",
    "defaultPromptVersion": "3.0",
    "entitlement": "core",
    "mode": "weekly"
  },
  "brand": {
    "id": "brand",
    "promptPath": "brand_strategist_v3.yml",
    "defaultPromptVersion": "3.0",
    "entitlement": "premium",
    "mode": "weekly"
  },
  "onboarder": {
    "id": "onboarder",
    "promptPath": "onboarder_v2.yml",
    "defaultPromptVersion": "2.0",
    "entitlement": "core",
    "mode": "adhoc"
  },
  "ta": {
    "id": "ta",
    "promptPath": "taagent_v1_4.yml",
    "defaultPromptVersion": "1.4",
    "entitlement": "core",
    "mode": "weekly"
  },
  "career_match": {
    "id": "career_match",
    "promptPath": "career_match_v1_3.yml",
    "defaultPromptVersion": "1.3",
    "entitlement": "premium",
    "mode": "adhoc"
  },
  "portfolio_curator": {
    "id": "portfolio_curator",
    "promptPath": "portfolio_v1_8.yml",
    "defaultPromptVersion": "1.8",
    "entitlement": "premium",
    "mode": "adhoc"
  },
  "instructor": {
    "id": "instructor",
    "promptPath": "instructor_v2_1.yml",
    "defaultPromptVersion": "2.1",
    "entitlement": "core",
    "mode": "weekly"
  },
  "clarifier": {
    "id": "clarifier",
    "promptPath": "clarifier_v3.yml",
    "defaultPromptVersion": "3.0",
    "entitlement": "core",
    "mode": "adhoc"
  }
};

/**
 * Load agents manifest from storage or fall back to bundled copy
 */
export async function loadAgentsManifest(): Promise<Record<string, AgentManifestItem>> {
  try {
    // Try to fetch from storage first (no-cache for fresh data)
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/prompts-manifest/agents.manifest.json`,
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );
    
    if (response.ok) {
      const manifest = await response.json();
      console.log('📋 prompt_manifest_loaded from storage');
      return manifest;
    }
  } catch (error) {
    console.warn('⚠️ Failed to load manifest from storage, using bundled copy:', error.message);
  }
  
  // Fall back to bundled copy
  console.log('📋 prompt_manifest_loaded from bundled copy');
  return BUNDLED_MANIFEST;
}

/**
 * Resolve prompt specification for a specific agent
 */
export async function resolvePromptSpec(agentId: string): Promise<AgentManifestItem> {
  const manifest = await loadAgentsManifest();
  
  if (!manifest[agentId]) {
    throw new Error(`Agent '${agentId}' not found in manifest`);
  }
  
  return manifest[agentId];
}

/**
 * Get public URL for a base prompt file
 */
export function getBasePromptUrl(promptPath: string): string {
  return `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/prompts-base/${promptPath}`;
}

/**
 * Get public URL for a compiled prompt
 */
export function getCompiledPromptUrl(agentId: string, userId: string, hash: string): string {
  return `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/prompts-compiled/${agentId}/${userId}/${hash}.txt`;
}
