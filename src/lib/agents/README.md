# Agent Registry System

## Overview

The Agent Registry provides a single source of truth for all 10 AI agents in the Learning Accelerator platform. It centralizes agent metadata, entitlements, routing, and orchestration logic.

## Features

- **Type-safe agent access** with `AgentId` union types
- **Entitlement gating** for Pro vs Enterprise features
- **Dynamic navigation** generation from agent metadata
- **Orchestration hints** for weekly vs ad-hoc agents
- **Rate limiting** and persistence mode configuration
- **UI routing** and display order management

## Quick Start

```typescript
import { AGENTS, CORE_AGENTS, PREMIUM_AGENTS, isPremium } from '@/lib/agents/registry';

// Check if an agent is premium
if (isPremium('career_match') && user.tier !== 'enterprise') {
  // Show paywall
}

// Generate navigation menu
const menuItems = [...CORE_AGENTS, ...PREMIUM_AGENTS]
  .map(id => ({
    id,
    title: AGENTS[id].title,
    route: AGENTS[id].route,
    icon: AGENTS[id].icon
  }));
```

## Agent Types

### Core Agents (Pro + Enterprise)
- **CLO** - Curriculum architect for weekly plans
- **Socratic** - Question-only facilitator for concept mastery
- **Alex** - Lead Engineer for technical review and scoring
- **Onboarder** - Adaptive quiz and profile setup
- **TA Agent** - Daily micro-coaching and sandbox prep
- **Instructor** - Daily driver plan integration
- **Clarifier** - Goal clarification and intent creation

### Premium Agents (Enterprise Only)
- **Brand Strategist** - Content packages and KPI snapshots
- **Career Match** - Job fit scoring and gap analysis
- **Portfolio Curator** - Static site curation and build status

## Agent Metadata

Each agent includes:

```typescript
type AgentMeta = {
  id: AgentId;
  title: string;                 // Human-readable label
  description: string;           // One-liner description
  entitlement: "core" | "premium";
  mode: "weekly" | "adhoc";     // Orchestration mode
  route: string;                 // Primary UI surface
  icon?: string;                 // Lucide icon name
  color?: string;                // Tailwind color class
  promptPath: string;            // Prompt file path
  defaultPromptVersion?: string; // Version number
  persistsTo: "agent_results" | "weekly_notes" | "both";
  rateLimitPerMin?: number;      // Client rate limit
  displayOrder: number;          // Menu/grid ordering
};
```

## Orchestration Modes

### Weekly Mode
Agents that produce week/day-scoped artifacts:
- CLO, Socratic, Alex, TA, Brand, Instructor
- Feed into `weekly_notes` table
- Triggered by weekly learning cycles

### Ad-hoc Mode
Agents that produce on-demand artifacts:
- Clarifier, Onboarder, Career Match, Portfolio
- Feed into `agent_results` table
- Triggered by user requests

## Helper Functions

```typescript
// Check premium status
isPremium('career_match') // true

// Sort by display order
byDisplayOrder('clo', 'socratic') // -10

// Get filtered lists
CORE_AGENTS    // Array of core agent IDs
PREMIUM_AGENTS // Array of premium agent IDs
```

## Usage Examples

### 1. Premium Gating
```typescript
import { isPremium } from '@/lib/agents/registry';

function CareerHub() {
  if (isPremium('career_match') && user.tier !== 'enterprise') {
    return <PaywallModal feature="career_match" />;
  }
  
  return <CareerHubContent />;
}
```

### 2. Dynamic Navigation
```typescript
import { CORE_AGENTS, AGENTS } from '@/lib/agents/registry';

const navigationItems = CORE_AGENTS
  .filter(id => AGENTS[id].mode === 'weekly')
  .map(id => ({
    label: AGENTS[id].title,
    path: AGENTS[id].route,
    description: AGENTS[id].description
  }));
```

### 3. Agent Status Tracking
```typescript
import { AGENTS } from '@/lib/agents/registry';

// Build completion status dynamically
const completionStatus: any = {};
Object.keys(AGENTS).forEach(agentId => {
  completionStatus[`${agentId}_completed`] = false;
});
completionStatus.overall_progress = 0;
```

### 4. Rate Limiting
```typescript
import { AGENTS } from '@/lib/agents/registry';

function checkRateLimit(agentId: AgentId, userId: string) {
  const agent = AGENTS[agentId];
  const userRequests = getUserRequestCount(userId, agentId);
  
  if (userRequests >= (agent.rateLimitPerMin || 10)) {
    throw new Error(`Rate limit exceeded for ${agent.title}`);
  }
}
```

## Migration Guide

### From Hardcoded Agent Lists
**Before:**
```typescript
const AGENT_LIST = ['clo', 'socratic', 'alex', 'brand'];
const isPremiumAgent = (id: string) => ['brand'].includes(id);
```

**After:**
```typescript
import { Object.keys(AGENTS) as AgentId[], isPremium } from '@/lib/agents/registry';

const AGENT_LIST = Object.keys(AGENTS) as AgentId[];
const isPremiumAgent = (id: AgentId) => isPremium(id);
```

### From Static Navigation
**Before:**
```typescript
const NAV_ITEMS = [
  { id: 'clo', label: 'CLO', route: '/workspace' },
  { id: 'socratic', label: 'Socratic', route: '/workspace' }
];
```

**After:**
```typescript
import { CORE_AGENTS, AGENTS } from '@/lib/agents/registry';

const NAV_ITEMS = CORE_AGENTS
  .filter(id => AGENTS[id].mode === 'weekly')
  .map(id => ({
    id,
    label: AGENTS[id].title,
    route: AGENTS[id].route
  }));
```

## Benefits

1. **Single Source of Truth** - All agent metadata in one place
2. **Type Safety** - Compile-time checking of agent IDs and properties
3. **Dynamic Generation** - Navigation, entitlements, and routing generated from metadata
4. **Easy Maintenance** - Add/remove agents by updating the registry
5. **Consistent UI** - Standardized agent presentation across the app
6. **Scalable Architecture** - New agents automatically integrated into existing systems

## Future Enhancements

- **Dynamic Icon Loading** - Load Lucide icons from registry metadata
- **Agent Dependencies** - Define agent execution order and dependencies
- **Custom Agent Types** - Support for user-defined or third-party agents
- **A/B Testing** - Version different agent prompts for testing
- **Analytics Integration** - Track agent usage and performance metrics
