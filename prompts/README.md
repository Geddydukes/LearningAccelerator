# Agent Prompts Directory

This directory contains the immutable, version-locked prompts for the four specialized GPT agents used by the Learning Accelerator platform.

## Prompt Files

### Required Prompts
- `clo_v2_0.md` - CLO - Curriculum Architect v2.0
- `socratic_v2_0.md` - Socratic Inquisitor v2.0  
- `alex_v2_2.md` - Alex - Lead Engineer Advisor v2.2
- `brand_strategist_v2_1.md` - Brand Strategist v2.1

## Security Requirements

⚠️ **CRITICAL SECURITY NOTES:**

1. **Server-Side Only**: These prompts are NEVER exposed to the frontend
2. **Immutable Resources**: Application code cannot modify these prompts
3. **Version Locked**: Each prompt has a specific version that must not be changed
4. **Proxy Pattern**: All agent calls go through `/api/agent/*` endpoints that inject prompts server-side

## Usage

Prompts are loaded server-side by the agent proxy service:

```typescript
// Backend only - never expose to client
import fs from 'fs/promises';

export async function loadPrompt(name: string) {
  return fs.readFile(`./prompts/${name}.md`, 'utf-8');
}
```

## File Naming Convention

- Format: `{agent_name}_v{major}_{minor}.md`
- Examples:
  - `clo_v2_0.md` (CLO version 2.0)
  - `alex_v2_2.md` (Alex version 2.2)

## Prompt Management Rules

1. **No Client Access**: Prompts are never exposed to the frontend
2. **Immutable Resources**: Application code cannot modify these prompts  
3. **Version Locked**: Each prompt has a specific version that must not be changed
4. **Proxy Pattern**: All agent calls go through backend endpoints that inject prompts

## Integration

The prompts in this directory are loaded by:
- `src/lib/agents.ts` - Agent orchestration service
- `supabase/functions/agent-proxy/index.ts` - Supabase edge function proxy

Place the four required prompt files in this directory to complete the agent system setup.