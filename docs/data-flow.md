# 🚀 Learning Accelerator Data Flow v3.0 - Instructor-Centric Learning

## Overview

The Learning Accelerator orchestrator system manages the flow of data between users, AI agents, and learning sessions. This document describes the **instructor-centric learning flow** where the Instructor Agent operates as a classroom teacher, delivering lectures, checking comprehension, and preparing students for targeted practice sessions.

## System Architecture - Instructor-Centric Flow

```
User Interface (React SPA)
         │
         ▼
   Edge Functions
         │
         ▼
   Orchestrator v1.1
         │
         ▼
   Instructor-Centric Agent Ecosystem
         │
         ▼
   Supabase (Postgres + Storage)
```

## Instructor-Centric Learning Flow

### Daily Learning Session Flow

```
CLO Framework → Instructor Lecture → Comprehension Check → Practice Preparation
                     │                        │                    │
                     ▼                        ▼                    ▼
              Structured Content        Understanding Level    Modified Prompts
                     │                        │                    │
                     ▼                        ▼                    ▼
              User Engagement         Adaptive Teaching    TA/Socratic Practice
```

### Agent Interaction Patterns

#### 1. Lecture Delivery Phase
- **CLO Agent**: Provides daily lesson framework
- **Instructor Agent**: Delivers structured lecture content
- **User**: Receives organized, pedagogical instruction

#### 2. Comprehension Check Phase  
- **Instructor Agent**: Asks targeted questions
- **User**: Responds with understanding level
- **Instructor Agent**: Adapts teaching based on responses

#### 3. Practice Preparation Phase
- **Instructor Agent**: Modifies TA/Socratic prompts based on comprehension
- **User**: Chooses practice mode (TA coding or Socratic questioning)
- **TA/Socratic Agents**: Receive tailored prompts for targeted practice

#### 4. Weekly Assessment Loop
- **Alex Agent**: Grades weekly project submissions
- **CLO Agent**: Adjusts next week's curriculum based on Alex feedback

## Core Data Flow

### 1. Intent Creation & Sync

**Endpoint**: `POST /functions/v1/orchestrator/intent.sync`

**Flow**:
1. User submits learning intent (topic, depth, goal, time commitment)
2. System validates input parameters
3. Deactivates previous active intents for the user
4. Creates new active learning intent
5. Emits `intent_created` event
6. Returns intent details with confirmation

**Data Structure**:
```typescript
interface IntentSyncRequest {
  track_label?: string;
  topic: string;
  depth: 'surface' | 'informed' | 'expert';
  end_goal: string;
  time_per_day_min: number; // 20-180 minutes
  user_tz?: string;
  meta?: Record<string, any>;
}

interface IntentSyncResponse {
  intent_id: string;
  active: boolean;
  topic: string;
  depth: string;
  end_goal: string;
  time_per_day_min: number;
  user_tz: string;
  created_at: string;
}
```

### 2. Daily Learning Plan Generation

**Endpoint**: `POST /functions/v1/orchestrator/day.run`

**Flow**:
1. System retrieves user's active learning intent
2. Fetches agent signals in parallel (CLO, TA, Alex, Socratic)
3. Uses cached data when fresh (ETag-based freshness)
4. Aggregates signals into InstructorAgent payload
5. Calls InstructorAgent v2.1 to generate daily plan
6. Persists session and emits realtime events
7. Returns plan with execution metadata

**Data Structure**:
```typescript
interface DayRunRequest {
  week?: number;
  day?: number;
  force_refresh?: boolean;
}

interface DayRunResponse {
  session_id: string;
  plan_md: string;
  plan_json_summary: any;
  degraded_mode: boolean;
  cache_hits: number;
  cache_misses: number;
  signal_quality: Record<string, any>;
}
```

**InstructorAgent Payload**:
```typescript
{
  USER_ID: string;
  USER_TZ: string;
  TOPIC: string;
  DEPTH: string;
  END_GOAL: string;
  TIME_PER_DAY_MIN: number;
  WEEK: number;
  DAY: number;
  CLARIFIER_TOPIC_SPEC: Record<string, any>;
  JWT: string;
  SIGNALS: {
    CLO: any;
    ALEX: any;
    TA: any;
    SOCRATIC: any;
  };
  SIGNAL_QUALITY: Record<string, any>;
  CACHE_STATS: {
    hits: number;
    misses: number;
  };
}
```

### 3. Session Completion

**Endpoint**: `POST /functions/v1/orchestrator/day.done`

**Flow**:
1. User completes daily learning session
2. System records completion time, confidence, and notes
3. Updates session status and completion data
4. Generates personalized next-day hints
5. Emits `instructor_plan_completed` event
6. Returns completion summary with guidance

**Data Structure**:
```typescript
interface DayDoneRequest {
  session_id: string;
  completion_time_min: number; // 1-480 minutes
  notes?: string;
  confidence?: number; // 1-10 scale
}

interface DayDoneResponse {
  ok: boolean;
  next_day_hint?: string;
  completion_summary: {
    session_id: string;
    completion_time_min: number;
    confidence: number;
    notes: string;
    completed_at: string;
  };
}
```

### 4. Status & Progress Tracking

**Endpoint**: `GET /functions/v1/orchestrator/status`

**Flow**:
1. System retrieves user's current learning state
2. Aggregates session history and statistics
3. Evaluates signal freshness across all agents
4. Calculates next scheduled run time
5. Returns comprehensive status overview

**Data Structure**:
```typescript
interface StatusResponse {
  user_id: string;
  active_intent: IntentSummary | null;
  latest_session: SessionSummary | null;
  signal_freshness: Record<string, AgentFreshness>;
  next_scheduled_run: ScheduledRun | null;
  learning_stats: LearningStatistics;
}
```

## Agent Signal Management

### Freshness Windows

Each agent has configurable freshness windows:

- **CLO**: 7 days (168 hours)
- **Alex**: 14 days (336 hours)  
- **TA**: 3 days (72 hours)
- **Socratic**: 7 days (168 hours)

### Caching Strategy

1. **ETag-based Validation**: Agents return ETags for cache validation
2. **304 Not Modified**: Reduces bandwidth when data hasn't changed
3. **Graceful Degradation**: Falls back to cached data when agents fail
4. **Parallel Fetching**: All agent signals fetched simultaneously

### Signal Quality Assessment

```typescript
interface SignalQuality {
  clo: { available: boolean; fresh: boolean; last_updated?: string };
  alex: { available: boolean; fresh: boolean; last_updated?: string };
  ta: { available: boolean; fresh: boolean; last_updated?: string };
  socratic: { available: boolean; fresh: boolean; last_updated?: string };
}
```

## Event System

### Realtime Events

All orchestrator actions emit realtime events via Supabase channels:

- **Channel**: `wisely.events`
- **Events**:
  - `intent_created`
  - `instructor_plan_created`
  - `instructor_plan_completed`
  - `orchestrator_signal_stale`
  - `orchestrator_agent_timeout`
  - `orchestrator_plan_failed`

### Event Payloads

Each event includes:
- User ID for filtering
- Timestamp for ordering
- Relevant data for UI updates
- No PII in public events

## Performance Characteristics

### Response Times

- **Intent Sync**: < 500ms
- **Day Run**: < 30s (including research), < 12s (research disabled)
- **Day Done**: < 200ms
- **Status**: < 100ms

### Cache Efficiency

- **Target**: ≥ 50% cache hit rate on repeat runs
- **Strategy**: ETag validation + freshness windows
- **Fallback**: Graceful degradation with cached data

### Scalability

- **Concurrent Users**: 1000+ simultaneous learners
- **Agent Calls**: Parallel execution with timeout protection
- **Database**: Optimized indexes for common queries

## Error Handling

### Retry Logic

- **429 Rate Limits**: Honor Retry-After headers
- **5xx Errors**: Exponential backoff (1s, 2s, 4s)
- **Timeouts**: 15s per agent call, 30s total for day.run

### Degraded Mode

When agents fail:
1. Use cached data when available
2. Generate fallback learning plans
3. Mark session as degraded
4. Continue user experience

### Error Codes

```typescript
type ErrorCode = 
  | 'TIMEOUT'
  | 'RATE_LIMIT' 
  | 'BAD_SCHEMA'
  | 'AGENT_ERROR'
  | 'NO_ACTIVE_INTENT'
  | 'SESSION_NOT_FOUND';
```

## Security & Privacy

### Authentication

- **JWT-based**: All endpoints require valid JWT
- **User Isolation**: Users can only access their own data
- **Service Role**: Internal calls use service role JWT

### Data Protection

- **RLS Policies**: Row-level security on all tables
- **No PII Logging**: Events exclude sensitive user information
- **Input Validation**: Strict validation of all user inputs

### Rate Limiting

- **Per-user Limits**: Configurable limits per user
- **Per-agent Limits**: Respect agent-specific rate limits
- **Token Bucket**: Efficient rate limiting algorithm

## Integration Points

### Frontend Integration

```typescript
// Example: Creating a learning intent
const response = await fetch('/functions/v1/orchestrator/intent.sync', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic: 'Machine Learning',
    depth: 'informed',
    end_goal: 'Build production ML models',
    time_per_day_min: 60,
    user_tz: 'America/New_York'
  })
});
```

### Agent Integration

All agent endpoints must:
- Accept `Authorization: Bearer <service_jwt>`
- Include `X-Idempotency-Key` header
- Return JSON with `ok: true|false`
- Support ETag headers for caching
- Handle 304 Not Modified responses

### Monitoring Integration

- **Metrics**: Response times, cache hit rates, error rates
- **Logging**: Structured logs for debugging and analytics
- **Alerts**: Notifications for system issues and degradations

## Future Enhancements

### Planned Features

- **Dynamic Workflows**: Runtime workflow modification
- **Conditional Logic**: If/then workflow patterns
- **Advanced Caching**: Redis-based distributed caching
- **Metrics Dashboard**: Real-time system performance monitoring

### Integration Opportunities

- **Slack Notifications**: Job status updates
- **Grafana Dashboards**: Performance metrics visualization
- **Webhook Support**: External system integration
- **API Gateway**: Public workflow triggers

---

**Version**: 2.1  
**Last Updated**: January 2025  
**Maintainer**: Learning Accelerator Team 