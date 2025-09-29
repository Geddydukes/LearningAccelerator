-- Telemetry sanity check queries for prompt system
-- Run these in Supabase SQL editor to monitor system health

-- 1. Last 24h compilations by agent
SELECT 
  agent_id, 
  count(*) as compilation_count, 
  min(created_at) as first_compilation, 
  max(created_at) as last_compilation
FROM prompt_compilations
WHERE created_at > now() - interval '24 hours'
GROUP BY agent_id 
ORDER BY compilation_count DESC;

-- 2. Cache hit ratio by agent
SELECT 
  agent_id,
  sum(case when variables_fingerprint IN (
    SELECT variables_fingerprint 
    FROM prompt_compilations p2 
    WHERE p2.agent_id = prompt_compilations.agent_id 
    AND p2.created_at < prompt_compilations.created_at
  ) then 1 else 0 end)::float / count(*) as cache_hit_ratio,
  count(*) as total_compilations
FROM prompt_compilations
WHERE created_at > now() - interval '24 hours'
GROUP BY agent_id
ORDER BY cache_hit_ratio DESC;

-- 3. Invocation latency by agent (p50, p95)
SELECT 
  agent_id, 
  percentile_cont(0.5) within group(order by latency_ms) as p50_latency_ms,
  percentile_cont(0.95) within group(order by latency_ms) as p95_latency_ms,
  avg(latency_ms) as avg_latency_ms,
  count(*) as invocation_count
FROM prompt_invocations
WHERE created_at > now() - interval '24 hours'
GROUP BY agent_id
ORDER BY avg_latency_ms DESC;

-- 4. Success rate by agent
SELECT 
  agent_id,
  sum(case when success_bool then 1 else 0 end)::float / count(*) as success_rate,
  count(*) as total_invocations,
  count(case when not success_bool then 1 end) as error_count
FROM prompt_invocations
WHERE created_at > now() - interval '24 hours'
GROUP BY agent_id
ORDER BY success_rate DESC;

-- 5. Most common error codes
SELECT 
  agent_id,
  error_code,
  count(*) as error_count,
  max(created_at) as last_occurrence
FROM prompt_invocations
WHERE created_at > now() - interval '24 hours'
AND error_code IS NOT NULL
GROUP BY agent_id, error_code
ORDER BY error_count DESC;

-- 6. Token usage trends (when implemented)
SELECT 
  agent_id,
  sum(input_tokens) as total_input_tokens,
  sum(output_tokens) as total_output_tokens,
  avg(input_tokens) as avg_input_tokens,
  avg(output_tokens) as avg_output_tokens
FROM prompt_invocations
WHERE created_at > now() - interval '24 hours'
AND input_tokens > 0
GROUP BY agent_id
ORDER BY total_input_tokens DESC;

-- 7. Storage usage by agent (compiled prompts)
SELECT 
  agent_id,
  count(distinct hash) as unique_prompts,
  count(*) as total_compilations,
  count(distinct user_id) as unique_users
FROM prompt_compilations
WHERE created_at > now() - interval '7 days'
GROUP BY agent_id
ORDER BY unique_prompts DESC;

-- 8. User activity patterns
SELECT 
  user_id,
  count(distinct agent_id) as agents_used,
  count(*) as total_compilations,
  max(created_at) as last_activity
FROM prompt_compilations
WHERE created_at > now() - interval '7 days'
GROUP BY user_id
ORDER BY total_compilations DESC
LIMIT 10;

-- 9. Version distribution
SELECT 
  agent_id,
  version,
  count(*) as usage_count,
  max(created_at) as last_used
FROM prompt_compilations
WHERE created_at > now() - interval '7 days'
GROUP BY agent_id, version
ORDER BY agent_id, usage_count DESC;

-- 10. System health overview
SELECT 
  'compilations' as metric_type,
  count(*) as count_24h,
  count(distinct user_id) as unique_users_24h,
  count(distinct agent_id) as unique_agents_24h
FROM prompt_compilations
WHERE created_at > now() - interval '24 hours'

UNION ALL

SELECT 
  'invocations' as metric_type,
  count(*) as count_24h,
  count(distinct user_id) as unique_users_24h,
  count(distinct agent_id) as unique_agents_24h
FROM prompt_invocations
WHERE created_at > now() - interval '24 hours'

ORDER BY metric_type;
