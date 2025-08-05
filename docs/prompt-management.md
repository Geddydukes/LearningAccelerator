# Prompt Management - Learning Accelerator

## Overview

The Learning Accelerator platform uses four specialized, version-locked GPT agent prompts that are treated as **immutable external dependencies**. These prompts are never modified by the application and are stored securely on the server-side.

## Prompt Specifications

### Required Prompts

| Agent | File Name | Version | Purpose |
|-------|-----------|---------|---------|
| CLO - Curriculum Architect | `clo_v2_0.md` | v2.0 | Weekly learning module generation |
| Socratic Inquisitor | `socratic_v2_0.md` | v2.0 | Question-only dialogue facilitation |
| Alex - Lead Engineer | `alex_v2_2.md` | v2.2 | Code review and technical analysis |
| Brand Strategist | `brand_strategist_v2_1.md` | v2.1 | Social content and KPI synthesis |

## Storage Architecture

### Server-Side Storage Options

#### Option 1: Supabase Storage (Recommended)
```
supabase/storage/agent-prompts/
├── clo_v2_0.md
├── socratic_v2_0.md  
├── alex_v2_2.md
└── brand_strategist_v2_1.md
```

#### Option 2: Backend File System
```
backend/prompts/
├── clo_v2_0.md
├── socratic_v2_0.md
├── alex_v2_2.md
└── brand_strategist_v2_1.md
```

## Security Requirements

### Access Control
- ❌ **NEVER** expose prompts to frontend/client-side code
- ❌ **NEVER** include prompts in API responses
- ❌ **NEVER** store prompts in client-accessible locations
- ✅ **ALWAYS** load prompts server-side only
- ✅ **ALWAYS** inject prompts into LLM calls on backend

### Prompt Loader Implementation

```typescript
// Backend/Edge Function only
import { createClient } from '@supabase/supabase-js'

export async function loadPrompt(agentName: string): Promise<string> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key required
  )
  
  const { data, error } = await supabase.storage
    .from('agent-prompts')
    .download(`${agentName}_prompt.md`)
    
  if (error) {
    throw new Error(`Failed to load prompt for ${agentName}: ${error.message}`)
  }
  
  return await data.text()
}
```

## Agent Proxy Pattern

### API Endpoint Structure
```
/api/agent/clo/begin-week
/api/agent/socratic/ask-question  
/api/agent/alex/analyze-repo
/api/agent/brand/generate-strategy
```

### Request Flow
1. Frontend sends user input to agent endpoint
2. Backend loads appropriate prompt from secure storage
3. Backend combines prompt + user input for LLM call
4. Backend processes LLM response
5. Backend returns structured data to frontend
6. Backend persists results to database

### Example Implementation
```typescript
// /api/agent/clo/begin-week.ts
export default async function handler(req: Request) {
  try {
    // Load immutable prompt
    const prompt = await loadPrompt('clo_v2_0')
    
    // Extract user input
    const { weekNumber, userContext } = await req.json()
    
    // Combine prompt with user input
    const messages = [
      { role: 'system', content: prompt },
      { role: 'user', content: `BEGIN_WEEK ${weekNumber}\nContext: ${userContext}` }
    ]
    
    // Call Gemini API
    const response = await gemini.generateContent({
      model: 'gemini-1.5-pro',
      messages
    })
    
    // Parse structured response
    const cloNote = JSON.parse(response.text())
    
    // Persist to database
    await persistWeeklyNote(userId, weekNumber, 'clo_briefing_note', cloNote)
    
    return Response.json({ success: true, data: cloNote })
    
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
```

## Prompt Versioning

### Version Control
- Each prompt has a semantic version (e.g., v2.0, v2.1, v2.2)
- Version numbers are embedded in filenames
- No in-place updates - new versions create new files
- Application code references specific versions

### Upgrade Process
1. New prompt version provided by external team
2. Upload new prompt file with incremented version
3. Update application code to reference new version
4. Deploy with feature flag for gradual rollout
5. Monitor performance and rollback if needed

## Monitoring and Validation

### Prompt Integrity Checks
- File existence validation on startup
- Checksum verification for prompt files
- Version compatibility checks
- Fallback mechanisms for prompt loading failures

### Performance Monitoring
- Prompt loading time metrics
- Cache hit/miss ratios for prompt storage
- Agent response quality tracking
- Error rates by prompt version

## Deployment Checklist

### Pre-Deployment
- [ ] All four prompt files uploaded to secure storage
- [ ] Prompt loader function tested
- [ ] Agent proxy endpoints configured
- [ ] Database schema deployed
- [ ] Environment variables configured

### Post-Deployment
- [ ] Prompt loading functionality verified
- [ ] Agent endpoints responding correctly
- [ ] No prompt content in client-side code
- [ ] Security audit passed
- [ ] Performance metrics baseline established

## Troubleshooting

### Common Issues
1. **Prompt Not Found**: Check file path and storage permissions
2. **Access Denied**: Verify service role key permissions
3. **Parse Errors**: Validate prompt file format and encoding
4. **Version Mismatch**: Ensure application references correct prompt version

### Debug Commands
```bash
# Check prompt file existence
supabase storage ls agent-prompts

# Verify file permissions
supabase storage info agent-prompts/clo_v2_0.md

# Test prompt loading
curl -X POST /api/debug/load-prompt -d '{"agent": "clo"}'
```