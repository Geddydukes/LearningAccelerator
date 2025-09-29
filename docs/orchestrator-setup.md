# 🚀 Wisely Orchestrator

A lightweight, event-driven orchestrator built on Supabase that manages agent workflows without external dependencies.

## 🏗️ Architecture Overview

```
Client/UI ──▶ agent-proxy/*  (LLM business logic)
     │
     └─▶ intent_events (insert)
              │
              └─▶ orchestrator/dispatch (enqueue workflow jobs)
                          │
                          └─▶ job_queue (queued → leased → running → done|failed)
                                  ▲
                                  └─ Supabase Cron ▶ orchestrator/worker (every 30–60s)
```

## ✨ Core Features

- **Job Queue Management**: Lease-based job execution with retry logic
- **Workflow Orchestration**: YAML-defined workflows with dependencies
- **Rate Limiting**: Token bucket algorithm per user/agent
- **Idempotency**: Safe retries with unique keys
- **Observability**: Comprehensive logging and monitoring
- **Cron Integration**: Scheduled workflow execution

## 🗄️ Database Schema

### Tables

#### `job_queue`
- **job_id**: Unique job identifier
- **workflow_run_id**: Links to workflow execution
- **step_id**: Workflow step identifier
- **user_id**: User executing the workflow
- **intent_id**: Learning intent context
- **status**: queued|leased|running|success|failed|dead
- **priority**: Job priority (lower = higher priority)
- **attempts**: Current attempt count
- **max_attempts**: Maximum retry attempts
- **next_run_at**: When to retry failed jobs
- **payload**: JSON job configuration

#### `job_attempts`
- **attempt_id**: Unique attempt identifier
- **job_id**: Links to job_queue
- **started_at**: Attempt start time
- **finished_at**: Attempt completion time
- **success**: Whether attempt succeeded
- **status_code**: HTTP status code
- **error_text**: Error details
- **logs**: Structured execution logs

#### `workflow_runs`
- **workflow_run_id**: Unique workflow execution
- **workflow_key**: Workflow specification key
- **user_id**: User executing workflow
- **intent_id**: Learning intent context
- **status**: running|success|failed
- **trigger_event_id**: Event that triggered execution

#### `rate_limits`
- **rl_key**: Rate limit key (e.g., 'user:{uid}:agent:clo')
- **tokens**: Current available tokens
- **last_refill**: Last token refill time
- **refill_rate**: Tokens per second
- **capacity**: Maximum token capacity

#### `intent_events`
- **event_id**: Unique event identifier
- **user_id**: User who triggered event
- **intent_id**: Learning intent context
- **type**: Event type (e.g., 'clo_week_started')
- **payload**: Event data
- **created_at**: Event timestamp

## 🔧 Edge Functions

### `/functions/v1/orchestrator/worker`
- **Purpose**: Processes jobs from the queue
- **Trigger**: Cron job every 30-60 seconds
- **Function**: Leases jobs, executes them, logs results

### `/functions/v1/orchestrator/dispatch`
- **Purpose**: Creates workflow runs and enqueues jobs
- **Method**: POST
- **Input**: user_id, workflow_key, intent_id?, payload?

### `/functions/v1/orchestrator/http`
- **Purpose**: HTTP helper for internal calls
- **Features**: Service JWT auth, idempotency keys, timeouts

### `/functions/v1/orchestrator/rate_limit`
- **Purpose**: Rate limiting implementation
- **Algorithm**: Token bucket with configurable refill rates

### `/functions/v1/cron-orchestrator`
- **Purpose**: Cron-triggered workflow execution
- **Schedules**: Daily instructor (7 AM), Weekly seed (Sunday 6 PM)

## 📋 Workflow Definitions

### Daily Instructor (`daily_instructor_v1.yml`)
```yaml
key: daily_instructor_v1
trigger:
  type: cron_or_event
  event_types: [ "streak_ping", "user_start_day" ]
  cron: "0 7 * * *"
steps:
  - id: gather_signals
    call: "/functions/v1/agent-proxy/snapshot"
    method: "GET"
    timeout_ms: 8000
  - id: create_plan
    call: "/functions/v1/agent-proxy/instructor/daily"
    method: "POST"
    depends_on: [ "gather_signals" ]
  - id: notify
    call: "/functions/v1/agent-proxy/notify"
    method: "POST"
    depends_on: [ "create_plan" ]
```

### Weekly Seed (`weekly_seed_v1.yml`)
```yaml
key: weekly_seed_v1
trigger:
  type: cron
  cron: "0 18 * * SUN"
steps:
  - id: clo_begin_week
    call: "/functions/v1/agent-proxy/clo/begin-week"
  - id: ta_generate_week
    call: "/functions/v1/agent-proxy/ta/generate-week"
    depends_on: [ "clo_begin_week" ]
  - id: socratic_seed
    call: "/functions/v1/agent-proxy/socratic/seed"
    depends_on: [ "clo_begin_week" ]
  - id: brand_ingest
    call: "/functions/v1/agent-proxy/brand/update-briefing"
    depends_on: [ "ta_generate_week", "socratic_seed" ]
```

## 🚀 Setup Instructions

### 1. Database Migration
```bash
# Apply the orchestrator migration
supabase db reset
# or
supabase migration up
```

### 2. Storage Setup
```bash
# Create workflows bucket and upload YAML files
node scripts/setup-orchestrator.js
```

### 3. Deploy Edge Functions
```bash
# Deploy orchestrator functions
supabase functions deploy orchestrator

# Deploy cron function
supabase functions deploy cron-orchestrator
```

### 4. Environment Variables
```bash
# Required in your Supabase project
EDGE_BASE_URL=https://your-project.supabase.co
EDGE_SERVICE_JWT=your-service-role-jwt
```

### 5. Cron Configuration
In Supabase Dashboard → Database → Extensions → pg_cron:
```sql
-- Worker runs every 60 seconds
SELECT cron.schedule('orchestrator-worker', '*/60 * * * *', 'SELECT net.http_post(url:=''https://your-project.supabase.co/functions/v1/orchestrator/worker'', headers:=''{"Authorization": "Bearer your-service-role-key"}''::jsonb);');

-- Cron orchestrator runs every hour
SELECT cron.schedule('orchestrator-cron', '0 * * * *', 'SELECT net.http_post(url:=''https://your-project.supabase.co/functions/v1/cron-orchestrator'', headers:=''{"Authorization": "Bearer your-service-role-key"}''::jsonb);');
```

## 🧪 Testing

### Test Workflow Dispatch
```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/dispatch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-service-role-key" \
  -d '{
    "user_id": "test-user-id",
    "workflow_key": "daily_instructor_v1",
    "payload": {"test": true}
  }'
```

### Test Worker
```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/worker \
  -H "Authorization: Bearer your-service-role-key"
```

## 📊 Monitoring

### Admin Dashboard
Access `/admin/orchestrator` to view:
- Job queue status
- Execution attempts
- Workflow runs
- Manual workflow triggers

### Database Queries
```sql
-- Active jobs
SELECT * FROM job_queue WHERE status IN ('queued', 'leased', 'running');

-- Failed jobs
SELECT * FROM job_queue WHERE status = 'failed';

-- Job attempts with errors
SELECT * FROM job_attempts WHERE success = false;

-- Workflow success rate
SELECT 
  workflow_key,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
  ROUND(COUNT(*) FILTER (WHERE status = 'success')::decimal / COUNT(*) * 100, 2) as success_rate
FROM workflow_runs 
GROUP BY workflow_key;
```

## 🔒 Security

- **RLS Policies**: All orchestrator tables restricted to service role
- **JWT Authentication**: Internal calls use service role JWT
- **Idempotency**: Safe retry mechanism prevents duplicate execution
- **Rate Limiting**: Prevents abuse per user/agent

## 🚨 Error Handling

### Job Failure Modes
1. **Transient Errors**: Retry with exponential backoff
2. **Permanent Errors**: Mark as 'dead' after max attempts
3. **Timeout Errors**: Respect agent timeout limits
4. **Rate Limit Errors**: Honor agent rate limits

### Recovery Mechanisms
- **Automatic Retries**: Exponential backoff with jitter
- **Dead Letter Queue**: Failed jobs marked as 'dead'
- **Manual Intervention**: Admin can retry or reset jobs
- **Workflow Rollback**: Failed workflows can be restarted

## 🔄 Integration Points

### Agent Endpoints
All agent endpoints must accept:
- `Authorization: Bearer <service_jwt>`
- `X-Idempotency-Key: <unique_key>`
- Return JSON with `ok: true|false`

### Event Sources
- **User Actions**: Manual workflow triggers
- **Cron Jobs**: Scheduled execution
- **System Events**: Intent state changes
- **External APIs**: Webhook triggers

## 📈 Performance

### Benchmarks
- **Job Processing**: 10 jobs per batch
- **Lease Duration**: 30 seconds
- **Retry Limits**: 5 attempts maximum
- **Timeout**: 15 seconds per job
- **Rate Limits**: Configurable per agent

### Optimization
- **Batch Processing**: Multiple jobs per worker run
- **Connection Pooling**: Reuse Supabase connections
- **Async Execution**: Non-blocking job processing
- **Smart Retries**: Exponential backoff with jitter

## 🚀 Future Enhancements

### Planned Features
- **Dynamic Workflows**: Runtime workflow modification
- **Conditional Steps**: If/then workflow logic
- **Parallel Execution**: Fan-out/fan-in patterns
- **Workflow Templates**: Reusable workflow components
- **Advanced Monitoring**: Metrics and alerting

### Integration Opportunities
- **Slack Notifications**: Job status updates
- **Grafana Dashboards**: Performance metrics
- **Webhook Support**: External system integration
- **API Gateway**: Public workflow triggers

## 🆘 Troubleshooting

### Common Issues

#### Jobs Not Processing
1. Check worker cron job is running
2. Verify service role permissions
3. Check job_queue table for stuck jobs
4. Review worker logs for errors

#### Workflow Failures
1. Check agent endpoint availability
2. Verify agent authentication
3. Review job_attempts for error details
4. Check rate limiting configuration

#### Storage Issues
1. Verify workflows bucket exists
2. Check storage policies
3. Validate YAML file format
4. Review file permissions

### Debug Commands
```sql
-- Check job queue status
SELECT status, COUNT(*) FROM job_queue GROUP BY status;

-- Find stuck jobs
SELECT * FROM job_queue WHERE status = 'leased' AND lease_until < NOW();

-- Review recent errors
SELECT * FROM job_attempts WHERE success = false ORDER BY started_at DESC LIMIT 10;

-- Check workflow status
SELECT workflow_key, status, COUNT(*) FROM workflow_runs GROUP BY workflow_key, status;
```

## 📚 Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [PostgreSQL Cron Extension](https://github.com/citusdata/pg_cron)
- [Job Queue Patterns](https://en.wikipedia.org/wiki/Job_queue)
- [Rate Limiting Algorithms](https://en.wikipedia.org/wiki/Rate_limiting)

---

**Built with ❤️ for the Wisely team** 