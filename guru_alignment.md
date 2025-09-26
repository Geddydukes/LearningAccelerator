# Guru Alignment – Unified Education Agent Plan

This document aligns on the unified Education Agent ("Guru") model, CLO Program Planning, state orchestration, and prompt contracts. It is production-oriented and defines explicit interfaces, modes, and data artifacts for end-to-end implementation.

## Identity and Scope

- Guru is the single UI/UX surface that orchestrates all other agents as tools
- Guru keeps the orchestration thin; each tool handles its own parsing/formatting
- Primary phases per day: planning → lecture → comprehension check → practice prep → practice → reflect → done
- Weekly loop: Alex grading → CLO adjustments → next week plan

## Agent Roles and Responsibilities

- CLO

  - Owns Program Plan (multi-week), Weekly Plans (derived), revisions and acceptance
  - Inputs: Intent, duration, constraints, performance telemetry
  - Outputs: `PROGRAM_PLAN`, `WEEKLY_PLAN`, with seeds for Instructor/TA/Socratic/Alex

- Instructor

  - Delivers lecture, runs comprehension checks, modifies practice prompts, logs hints for CLO
  - Inputs: Weekly Plan snapshot, learner profile, prior day results
  - Outputs: `lecture_md`, `checks[]`, `modified_prompts{ta,socratic}`, `instructor_hints_for_clo[]`

- TA

  - Generates exercises, hints, lightweight evaluation; reports blockers/mastery
  - Inputs: Instructor-modified TA prompt; Weekly seeds
  - Outputs: `exercises[]`, `hints[]`, `blockers[]`, `mastery_estimate`

- Socratic

  - Runs questioning dialogue and summarizes gaps
  - Inputs: Instructor-modified Socratic prompt; Weekly seeds
  - Outputs: `dialog_turns[]`, `gaps_per_concept`, `suggested_followups[]`

- Alex
  - Grades weekly deliverables; aligns to weekly rubric; provides prioritized gaps
  - Inputs: Submission (fs/artifacts), rubric
  - Outputs: `scorecard`, `feedback_md`, `prioritized_gaps[]`

## CLO Program Planning

Actions (modes):

- PROGRAM_PLAN_CREATE
- PROGRAM_PLAN_REVISE (optional)
- PROGRAM_PLAN_ACCEPT
- WEEKLY_PLAN_CREATE
- WEEKLY_PLAN_ADJUST (optional)

Inputs:

- `INTENT_OBJECT` { topic, depth, end_goal, constraints[], timeline_weeks_estimate? }
- `PROGRAM_DURATION_WEEKS` number
- `PROGRAM_PLAN_ID`, `PROGRAM_VERSION` (for derive/revise)
- `PRIOR_PERFORMANCE_SUMMARY` { instructor_hints[], socratic_mastery{}, ta_blockers[], alex_scorecard{}, time_used_min, degraded_days_count }

Outputs:

- PROGRAM_PLAN

  - `id`, `version` (semver)
  - `weeks[]`: { week, theme, objectives[], milestones[], deliverables[], ta_prereqs[], socratic_graph_seeds[], resources[], assessment_rubric_seed }
  - `pacing_guidelines`: { time_per_day_min, buffer_days?[] }
  - `adaptation_rules`[]
  - `acceptance_checklist`[]

- WEEKLY_PLAN
  - `program_plan_id`, `program_version`, `week`, `theme`, `objectives[]`
  - `ta_base_prompt`: { topic, exercises[], difficulty, prereqs[], constraints }
  - `socratic_base_prompt`: { topic, seed_questions[], expected_levels }
  - `alex_rubric`: { criteria[] { id, name, weight, descriptors } }
  - `adjustments_applied`: { instructor_hints_used[], socratic_gaps_addressed[], ta_blockers_mitigated[], alex_gaps_prioritized[], time_reallocation }
  - `risk_flags`[]
  - `references`: { from_program[] }

Contracts: all outputs include `json_output`, `markdown_output`, `metrics`, `etag`, `degraded_mode` flags.

## Education Agent (Guru) Orchestration

- Edge: `education-agent` handles event-driven state machine
- Tools are called via server-side `toolRegistry` (CLO, Instructor, TA, Socratic, Alex, Coding Workspace)
- Persist session state and artifacts to Supabase with ETags and idempotency keys

Daily Events: `start_day`, `lecture_done`, `check_done`, `practice_ready`, `practice_done`, `reflect_done`

Weekly Flow:

1. If new track or major change: CLO `PROGRAM_PLAN_CREATE` → learner accepts → `PROGRAM_PLAN_ACCEPT`
2. Each week: CLO `WEEKLY_PLAN_CREATE` with prior performance → feed to Instructor/TA/Socratic/Alex
3. Alex grading at week end → update telemetry → next week plan

## Coding Workspace Integration

- Functions: `coding-workspace/start`, `coding-workspace/run`, `coding-workspace/alex.final`
- Frontend: `CodingWorkspace` component uses Monaco, virtual FS; runs/tests; submit to Alex
- Parsing boundary: the coding tools accept structured inputs and return structured outputs; Guru only routes them

## Data Model (Supabase)

- `program_plans(id, user_id, version, intent_snapshot, duration_weeks, plan, accepted, created_at)`
- `weekly_plans(id, user_id, program_plan_id, program_version, week, plan, adjustments_applied, created_at)`
- `education_sessions(id, user_id, day, week, state, etag, created_at)`
- `education_artifacts(id, session_id, kind, data, created_at)`
- `coding_sessions(id, user_id, week, fs, task, created_at)`
- `coding_runs(id, session_id, fs, stdout, stderr, created_at)`
- `coding_reviews(id, session_id, scorecard, feedback_md, created_at)`

## Prompt Edits (Per File)

- `prompts/base/clo_v3.yml`

  - Add actions: PROGRAM_PLAN_CREATE, PROGRAM_PLAN_REVISE, PROGRAM_PLAN_ACCEPT, WEEKLY_PLAN_CREATE, WEEKLY_PLAN_ADJUST
  - Define strict JSON schemas and examples for PROGRAM_PLAN and WEEKLY_PLAN
  - Add placeholders: INTENT_OBJECT, PROGRAM_DURATION_WEEKS, PROGRAM_PLAN_ID, PROGRAM_VERSION, PRIOR_PERFORMANCE_SUMMARY
  - Add metadata contract: version, etag, idempotency_key, degraded_mode

- `prompts/base/instructor_v2_1.yml`

  - Add modes: DELIVER_LECTURE, CHECK_COMPREHENSION, MODIFY_PRACTICE_PROMPTS, DAILY_REFLECTION
  - Inputs include weekly_plan snapshot and learner profile
  - Outputs: lecture_md, checks[], modified_prompts{ta,socratic}, instructor_hints_for_clo[]

- `prompts/base/taagent_v1_4.yml`

  - Modes: PREP_EXERCISES, PROVIDE_HINT, EVALUATE_PRACTICE, FORWARD_BLOCKERS
  - Inputs: instructor-modified TA prompt, weekly seeds
  - Outputs: exercises[], hints[], blockers[], mastery_estimate

- `prompts/base/socratic_v3.yml`

  - Modes: START_DIALOG, CONTINUE_DIALOG, SUMMARIZE_GAPS
  - Inputs: instructor-modified Socratic prompt, weekly seeds
  - Outputs: dialog_turns[], gaps_per_concept, suggested_followups[]

- `prompts/base/alex_v3.yml`

  - Modes: PRECHECK (optional), FINAL_GRADE
  - Inputs: submission fs/artifacts, WEEKLY_PLAN.alex_rubric
  - Outputs: scorecard, feedback_md, prioritized_gaps[]

- `prompts/base/clarifier_v3.yml`

  - Output `INTENT_OBJECT`, constraints, risks, recommended_duration_weeks

- `prompts/base/onboarder_v2.yml`

  - Capture schedule/constraints/goals to seed `INTENT_OBJECT` and duration

- `prompts/base/brand_strategist_v3.yml`

  - Optional: tone/style fields for Instructor rendering

- `prompts/base/portfolio_v1_8.yml`

  - Accept Alex outputs; reference weekly deliverables

- `prompts/base/career_match_v1_3.yml`
  - Optionally leverage Program Plan themes for milestone suggestions

## Endpoints Summary

- Education Agent: `/functions/v1/education-agent`
- Agent Proxy: `/functions/v1/agent-proxy`
- CLO: `/functions/v1/clo/program.plan`, `/functions/v1/clo/program.accept`, `/functions/v1/clo/weekly.plan`
- Coding: `/functions/v1/coding-workspace/start`, `/functions/v1/coding-workspace/run`, `/functions/v1/coding-workspace/alex.final`

## Non-Functional Requirements

- Idempotency and ETag-based caching across all agent/tool calls
- Strict input/output schemas for stable parsing; embed examples in prompts
- Accessibility AA for Guru UI; responsive and offline-capable

## Implementation Progress

### ✅ Phase 1: Core Guru Interface (COMPLETED)

- **Guru V1 Prompt Created**: `/prompts/guru_v1.md` - Comprehensive prompt covering identity, agent coordination, user interaction patterns
- **Capability Verification**: `/docs/guru-capability-verification.md` - Detailed verification of 85% alignment with requirements
- **Starter Message**: "What can Guru help you learn?" implemented
- **Agent Coordination**: Clear routing patterns for CLO, Instructor, TA, Socratic, Alex

### 🔄 Phase 2: Agent Updates (IN PROGRESS)

- **CLO Agent**: Need to implement PROGRAM_PLAN_CREATE, WEEKLY_PLAN_CREATE actions
- **Instructor Agent**: Need to implement DELIVER_LECTURE, CHECK_COMPREHENSION modes
- **TA Agent**: Need to implement PREP_EXERCISES, PROVIDE_HINT modes
- **Socratic Agent**: Need to implement START_DIALOG, CONTINUE_DIALOG modes
- **Alex Agent**: Need to implement FINAL_GRADE mode

### ⏳ Phase 3: Database & Infrastructure (PENDING)

- **Database Schema**: Need to create program_plans, weekly_plans, education_sessions tables
- **Education Agent Edge Function**: Need to implement state machine for daily/weekly flows
- **Coding Workspace**: Need to create Monaco editor component with Alex integration

### ⏳ Phase 4: Integration & Testing (PENDING)

- **Guru Interface Component**: Need to create React chatbot component
- **End-to-End Integration**: Need to wire Guru → Agent routing
- **State Persistence**: Need to implement ETags and idempotency
- **Testing**: Need to test complete Guru workflow

## Issues and Challenges Identified

### Technical Gaps

1. **Coding Workspace Integration**: Guru prompt needs specific guidance for code review workflows
2. **Database Schema References**: Need to add specific table/field references to prompts
3. **ETag Implementation**: Need more specific technical details for state management
4. **Edge Function Patterns**: Need to reference specific Supabase Edge Function integration

### Implementation Considerations

1. **State Machine Complexity**: Daily/weekly flows need robust state management
2. **Agent Coordination**: Ensuring smooth handoffs between agents
3. **Error Handling**: Graceful degradation when agents are unavailable
4. **Performance**: Optimizing agent calls and response times

## Next Actions

1. ✅ **COMPLETED**: Create Guru V1 prompt and capability verification
2. 🔄 **IN PROGRESS**: Create Guru chatbot interface component
3. ⏳ **NEXT**: Update CLO agent with PROGRAM_PLAN_CREATE and WEEKLY_PLAN_CREATE actions
4. ⏳ **NEXT**: Update Instructor agent with DELIVER_LECTURE and CHECK_COMPREHENSION modes
5. ⏳ **NEXT**: Create Supabase database tables for program_plans and weekly_plans
6. ⏳ **NEXT**: Implement education-agent Edge Function for state orchestration
7. ⏳ **NEXT**: E2E smoke test of daily and weekly loops
