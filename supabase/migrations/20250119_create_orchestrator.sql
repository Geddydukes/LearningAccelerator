-- Create orchestrator tables and functions
-- Migration: 20250119_create_orchestrator

-- job_queue: one row per work unit (a workflow step)
create table if not exists job_queue (
  job_id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null,
  step_id text not null,
  user_id uuid not null,
  intent_id uuid,
  payload jsonb not null,
  status text not null default 'queued', -- queued|leased|running|success|failed|dead
  priority int not null default 100,
  lease_until timestamptz,
  attempts int not null default 0,
  max_attempts int not null default 5,
  next_run_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_run_id, step_id) -- idempotency per step
);

-- job_attempts: audit for retries
create table if not exists job_attempts (
  attempt_id uuid primary key default gen_random_uuid(),
  job_id uuid not null references job_queue(job_id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  success boolean,
  status_code int,
  error_text text,
  logs jsonb default '[]'::jsonb
);

-- workflow_runs: one per high-level flow (e.g., daily instructor)
create table if not exists workflow_runs (
  workflow_run_id uuid primary key default gen_random_uuid(),
  workflow_key text not null, -- e.g., 'daily_instructor_v1'
  user_id uuid not null,
  intent_id uuid,
  trigger_event_id uuid,
  status text not null default 'running', -- running|success|failed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- optional: simple token bucket RL per (user,agent)
create table if not exists rate_limits (
  rl_key text primary key,           -- e.g., 'user:{uid}:agent:clo'
  tokens numeric not null,
  last_refill timestamptz not null,
  refill_rate numeric not null,      -- tokens per second
  capacity numeric not null
);

-- light "outbox" of business events you already use
create table if not exists intent_events (
  event_id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  intent_id uuid,
  type text not null,                 -- e.g., 'clo_week_started'
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Add indexes for performance
create index on job_queue(next_run_at, status, priority);
create index on job_queue(workflow_run_id);
create index on job_attempts(job_id);
create index on workflow_runs(workflow_key, status);
create index on intent_events(user_id, type);

-- Add RLS policies
alter table job_queue enable row level security;
alter table job_attempts enable row level security;
alter table workflow_runs enable row level security;
alter table rate_limits enable row level security;
alter table intent_events enable row level security;

-- RLS policies (only service role can access orchestrator tables)
create policy "Service role only" on job_queue for all using (auth.role() = 'service_role');
create policy "Service role only" on job_attempts for all using (auth.role() = 'service_role');
create policy "Service role only" on workflow_runs for all using (auth.role() = 'service_role');
create policy "Service role only" on rate_limits for all using (auth.role() = 'service_role');

-- Users can read their own intent_events
create policy "Users can read own events" on intent_events for select using (auth.uid() = user_id);
create policy "Service role can insert events" on intent_events for insert using (auth.role() = 'service_role');

-- Function to lease jobs
create or replace function lease_jobs(p_now timestamptz, p_limit int)
returns setof job_queue
language plpgsql security definer as $$
begin
  return query
  with cte as (
    select job_id
    from job_queue
    where status in ('queued','failed') and next_run_at <= p_now
    order by priority asc, created_at asc
    limit p_limit
    for update skip locked
  )
  update job_queue j
  set status = 'leased',
      lease_until = p_now + interval '30 seconds',
      updated_at = p_now
  from cte
  where j.job_id = cte.job_id
  returning j.*;
end; $$;

-- Function to finish job attempts
create or replace function finish_job_attempt(
  p_job_id uuid,
  p_success boolean,
  p_status_code int,
  p_error text,
  p_attempt_started timestamptz
) returns void
language plpgsql security definer as $$
declare
  v_job job_queue%rowtype;
  v_attempts int;
  v_next timestamptz;
begin
  select * into v_job from job_queue where job_id = p_job_id for update;
  insert into job_attempts(job_id, started_at, finished_at, success, status_code, error_text)
  values (p_job_id, p_attempt_started, now(), p_success, p_status_code, p_error);

  if p_success then
    update job_queue set status='success', updated_at=now() where job_id = p_job_id;
  else
    v_attempts := v_job.attempts + 1;
    if v_attempts >= v_job.max_attempts then
      update job_queue set status='dead', attempts=v_attempts, updated_at=now() where job_id=p_job_id;
    else
      -- exponential backoff with jitter
      v_next := now() + make_interval(secs => power(2, v_attempts)) + (random() * interval '1 second');
      update job_queue
      set status='failed', attempts=v_attempts, next_run_at=v_next, updated_at=now()
      where job_id=p_job_id;
    end if;
  end if;
end; $$;

-- Function to update workflow run status
create or replace function update_workflow_status(p_workflow_run_id uuid)
returns void
language plpgsql security definer as $$
declare
  v_status text;
begin
  select 
    case 
      when count(*) filter (where status = 'failed' or status = 'dead') > 0 then 'failed'
      when count(*) filter (where status != 'success') > 0 then 'running'
      else 'success'
    end into v_status
  from job_queue 
  where workflow_run_id = p_workflow_run_id;
  
  update workflow_runs 
  set status = v_status, updated_at = now() 
  where workflow_run_id = p_workflow_run_id;
end; $$;

-- Trigger to update workflow status when jobs change
create or replace function trigger_update_workflow_status()
returns trigger as $$
begin
  perform update_workflow_status(new.workflow_run_id);
  return new;
end; $$ language plpgsql;

create trigger update_workflow_status_trigger
  after update on job_queue
  for each row
  execute function trigger_update_workflow_status(); 