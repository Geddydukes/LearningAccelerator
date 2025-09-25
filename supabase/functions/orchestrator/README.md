# 🚀 Wisely Orchestrator v1.1

A production-ready orchestrator system that manages AI agent workflows, caching, and learning session orchestration for the Wisely platform.

## 🏗️ Architecture

The orchestrator provides four main endpoints that work together to create a seamless learning experience:

1. **Intent Sync** - Manage learning intents and goals
2. **Day Run** - Generate daily learning plans with agent aggregation
3. **Day Done** - Complete learning sessions and track progress
4. **Status** - Get comprehensive learning status and progress

## 📋 Endpoints

### 1. Intent Sync

Creates or updates a user's learning intent.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/intent.sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-User-ID: user-uuid-here" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Machine Learning",
    "depth": "informed",
    "end_goal": "Build production ML models",
    "time_per_day_min": 60,
    "user_tz": "America/New_York",
    "meta": {
      "learning_style": "project-first",
      "hardware_specs": "M4 Mac Mini 24GB"
    }
  }'
```

**Response**:
```json
{
  "intent_id": "uuid-here",
  "active": true,
  "topic": "Machine Learning",
  "depth": "informed",
  "end_goal": "Build production ML models",
  "time_per_day_min": 60,
  "user_tz": "America/New_York",
  "created_at": "2025-01-19T10:00:00Z"
}
```

### 2. Day Run

Generates a daily learning plan by aggregating signals from all AI agents.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/day.run \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-User-ID: user-uuid-here" \
  -H "Content-Type: application/json" \
  -d '{
    "week": 1,
    "day": 3,
    "force_refresh": false
  }'
```

**Response**:
```json
{
  "session_id": "session-uuid-here",
  "plan_md": "# Daily Learning Plan\n\n## Today's Focus: Neural Network Fundamentals...",
  "plan_json_summary": {
    "title": "Neural Network Fundamentals",
    "description": "Deep dive into neural network architecture",
    "steps": ["Review basics", "Implement simple NN", "Test with data"]
  },
  "degraded_mode": false,
  "cache_hits": 3,
  "cache_misses": 1,
  "signal_quality": {
    "clo": {"available": true, "fresh": true},
    "alex": {"available": true, "fresh": true},
    "ta": {"available": true, "fresh": false},
    "socratic": {"available": true, "fresh": true}
  }
}
```

### 3. Day Done

Marks a learning session as complete and provides next-day guidance.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/day.done \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-User-ID: user-uuid-here" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-uuid-here",
    "completion_time_min": 45,
    "confidence": 7,
    "notes": "Struggled with backpropagation but got the basic concept"
  }'
```

**Response**:
```json
{
  "ok": true,
  "next_day_hint": "Good time investment! For day 4, focus on reinforcing concepts to build confidence.",
  "completion_summary": {
    "session_id": "session-uuid-here",
    "completion_time_min": 45,
    "confidence": 7,
    "notes": "Struggled with backpropagation but got the basic concept",
    "completed_at": "2025-01-19T15:30:00Z"
  }
}
```

### 4. Status

Gets comprehensive learning status and progress information.

```bash
curl -X GET https://your-project.supabase.co/functions/v1/orchestrator/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-User-ID: user-uuid-here"
```

**Response**:
```json
{
  "user_id": "user-uuid-here",
  "active_intent": {
    "id": "intent-uuid-here",
    "topic": "Machine Learning",
    "depth": "informed",
    "end_goal": "Build production ML models",
    "time_per_day_min": 60,
    "user_tz": "America/New_York",
    "created_at": "2025-01-19T10:00:00Z"
  },
  "latest_session": {
    "id": "session-uuid-here",
    "week": 1,
    "day": 3,
    "topic": "Machine Learning",
    "plan_title": "Neural Network Fundamentals",
    "degraded_mode": false,
    "created_at": "2025-01-19T10:00:00Z",
    "completion": {
      "completion_time_min": 45,
      "confidence": 7,
      "notes": "Struggled with backpropagation but got the basic concept",
      "completed_at": "2025-01-19T15:30:00Z"
    }
  },
  "signal_freshness": {
    "clo": {"available": true, "fresh": true, "last_updated": "2025-01-19T10:00:00Z"},
    "alex": {"available": true, "fresh": true, "last_updated": "2025-01-19T10:00:00Z"},
    "ta": {"available": true, "fresh": false, "last_updated": "2025-01-18T10:00:00Z"},
    "socratic": {"available": true, "fresh": true, "last_updated": "2025-01-19T10:00:00Z"}
  },
  "next_scheduled_run": {
    "week": 1,
    "day": 4,
    "estimated_time": "2025-01-20T12:00:00Z",
    "timezone": "America/New_York"
  },
  "learning_stats": {
    "total_sessions": 3,
    "completed_sessions": 3,
    "total_time_min": 180,
    "average_confidence": 7.3,
    "current_streak_days": 3
  }
}
```

## 🔧 Setup & Configuration

### Environment Variables

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EDGE_BASE_URL=https://your-project.supabase.co
EDGE_SERVICE_JWT=your-service-role-jwt

# Optional (with defaults)
SUPABASE_ANON_KEY=your-anon-key
```

### Database Migration

Run the orchestrator migration to create required tables:

```bash
supabase db reset
# or
supabase migration up
```

### Deploy Functions

```bash
# Deploy all orchestrator functions
supabase functions deploy orchestrator

# Deploy individual functions
supabase functions deploy orchestrator/intent.sync
supabase functions deploy orchestrator/day.run
supabase functions deploy orchestrator/day.done
supabase functions deploy orchestrator/status
```

## 🧪 Testing

### Unit Tests

Run the test suite:

```bash
npm test test/unit/orchestrator.test.ts
```

### Integration Tests

Test the full flow:

```bash
# 1. Create intent
INTENT_RESPONSE=$(curl -s -X POST https://your-project.supabase.co/functions/v1/orchestrator/intent.sync \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "X-User-ID: test-user" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Test Topic","depth":"surface","end_goal":"Test Goal","time_per_day_min":30}')

INTENT_ID=$(echo $INTENT_RESPONSE | jq -r '.intent_id')

# 2. Generate day plan
DAY_RESPONSE=$(curl -s -X POST https://your-project.supabase.co/functions/v1/orchestrator/day.run \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "X-User-ID: test-user" \
  -H "Content-Type: application/json" \
  -d '{"week":1,"day":1}')

SESSION_ID=$(echo $DAY_RESPONSE | jq -r '.session_id')

# 3. Complete day
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/day.done \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "X-User-ID: test-user" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"completion_time_min\":25,\"confidence\":8}"

# 4. Check status
curl -s https://your-project.supabase.co/functions/v1/orchestrator/status \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "X-User-ID: test-user" | jq '.'
```

## 📊 Monitoring & Observability

### Performance Metrics

- **Response Times**: Track endpoint performance
- **Cache Hit Rates**: Monitor caching efficiency
- **Error Rates**: Track system reliability
- **Agent Timeouts**: Monitor agent health

### Logging

All functions log structured data:

```json
{
  "level": "info",
  "timestamp": "2025-01-19T10:00:00Z",
  "function": "day.run",
  "user_id": "user-uuid",
  "execution_time_ms": 2500,
  "cache_hits": 3,
  "cache_misses": 1,
  "degraded_mode": false
}
```

### Realtime Events

Monitor events via Supabase Realtime:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

supabase
  .channel('wisely.events')
  .on('broadcast', { event: 'instructor_plan_created' }, (payload) => {
    console.log('New plan created:', payload)
  })
  .subscribe()
```

## 🚨 Error Handling

### Common Error Codes

- **401**: Missing or invalid authorization
- **400**: Invalid request parameters
- **409**: No active learning intent
- **404**: Session not found
- **500**: Internal server error

### Retry Logic

The system automatically retries failed agent calls:

- **429 Rate Limits**: Honor Retry-After headers
- **5xx Errors**: Exponential backoff (1s, 2s, 4s)
- **Timeouts**: 15s per agent call

### Degraded Mode

When agents fail, the system:

1. Uses cached data when available
2. Generates fallback learning plans
3. Marks sessions as degraded
4. Continues user experience

## 🔒 Security

### Authentication

- All endpoints require valid JWT tokens
- User ID extracted from JWT or X-User-ID header
- Service role JWT for internal calls

### Data Protection

- Row-level security (RLS) on all tables
- Users can only access their own data
- No PII logged in events or responses

### Rate Limiting

- Per-user rate limits
- Per-agent rate limits
- Token bucket algorithm

## 🚀 Performance

### Response Time Targets

- **Intent Sync**: < 500ms
- **Day Run**: < 30s (with research), < 12s (without)
- **Day Done**: < 200ms
- **Status**: < 100ms

### Caching Strategy

- **ETag-based validation**
- **Freshness windows per agent**
- **Graceful degradation**
- **Target: ≥ 50% cache hit rate**

### Scalability

- **1000+ concurrent users**
- **Parallel agent execution**
- **Optimized database queries**

## 🔄 Integration

### Frontend Integration

```typescript
class LearningOrchestrator {
  constructor(private supabase: SupabaseClient) {}

  async createIntent(intent: IntentSyncRequest): Promise<IntentSyncResponse> {
    const { data, error } = await this.supabase.functions.invoke('orchestrator/intent.sync', {
      body: intent
    })
    
    if (error) throw error
    return data
  }

  async generateDayPlan(week: number, day: number): Promise<DayRunResponse> {
    const { data, error } = await this.supabase.functions.invoke('orchestrator/day.run', {
      body: { week, day }
    })
    
    if (error) throw error
    return data
  }

  async completeDay(sessionId: string, completion: DayDoneRequest): Promise<DayDoneResponse> {
    const { data, error } = await this.supabase.functions.invoke('orchestrator/day.done', {
      body: { session_id: sessionId, ...completion }
    })
    
    if (error) throw error
    return data
  }

  async getStatus(): Promise<StatusResponse> {
    const { data, error } = await this.supabase.functions.invoke('orchestrator/status')
    
    if (error) throw error
    return data
  }
}
```

### Agent Integration

All agent endpoints must support:

```typescript
interface AgentEndpoint {
  // Required headers
  headers: {
    'Authorization': 'Bearer <service_jwt>'
    'X-Idempotency-Key': string
    'Content-Type': 'application/json'
  }
  
  // Response format
  response: {
    ok: boolean
    data?: any
    error?: string
    code?: string
  }
  
  // ETag support
  etag?: string
  'If-None-Match'?: string
}
```

## 📚 Additional Resources

- [Data Flow Documentation](../docs/data-flow.md)
- [Database Schema](../migrations/)
- [Agent Client Library](../_shared/agentClients.ts)
- [Unit Tests](../../test/unit/orchestrator.test.ts)

## 🆘 Support

For issues or questions:

1. Check the logs in Supabase Dashboard
2. Review the unit tests for expected behavior
3. Verify environment variables are set correctly
4. Check database migration status

---

**Version**: 1.1  
**Last Updated**: January 2025  
**Maintainer**: Wisely Team 