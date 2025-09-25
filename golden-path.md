# Guru V1 Golden Path

A fast, reproducible path to a credible public V1 demo. Tackle in order.

## 1) Fix docs discoverability (must-click from README)
- [ ] Verify `README.md` links (case-sensitive) to `docs/architecture.md` and `docs/agent-flow.md`
- [ ] Ensure both files exist and open in the UI
- [ ] Add above-the-fold tagline + GIF demo link in `README.md`

## 2) Guardrails (prove it in code, not prose)
- [ ] Add RLS snippets to `README.md` (short SQL excerpt)
- [ ] Ensure migrations include RLS for orchestrator tables
- [ ] Add token-bucket rate limit example inside one Edge Function
- [ ] Implement idempotency keys on POST with 60s dedupe window

## 3) Observability (corr_id + event log + timeline)
- [ ] Propagate `x-correlation-id` through `agent-proxy` and tool calls
- [ ] Create `agent_events` table (corr_id, agent, tool, started_at, ended_at, tokens_in/out, status, cost)
- [ ] Add logging helper to write events per tool call
- [ ] Build `/dev/timeline/:corr_id` page to visualize chains with durations

## 4) Golden path demo (seed + script)
- [ ] Seed: `seed-data/programs/datasci-week-1.yaml`
- [ ] Seed: `seed-data/weekly/datasci-week-1.yaml`
- [ ] Add `scripts/run-demo.js` that: creates a learner → calls education-agent (lecture → check → practice) → prints timeline
- [ ] Record a 120s screen capture (session timeline + UI); link at top of `README.md`

## 5) Tests that sell reliability
- [ ] Playwright: `education-agent-onboarding.spec.ts`
- [ ] Playwright: `lesson-lecture-to-check.spec.ts`
- [ ] Playwright: `practice-coding-and-alex-grade.spec.ts`
- [ ] Unit: forbid client imports from `prompts/` (server-only prompt loading)
- [ ] Add Lighthouse screenshot to docs

## 6) Secrets posture for contributors
- [ ] Add stub LLM + stub TTS mode (env-guarded) so PRs run without keys
- [ ] Add `npm run test:mock` to use stubs in CI

## 7) Release hygiene
- [ ] Consolidate to `scripts/prompt-sync.ts`; deprecate others in `README.md`
- [ ] Tag release `v0.1.0-edu` after demo works

## 8) Sample curriculum & security doc
- [ ] Add sample curriculum: "Math for ML" or "Python Fundamentals" week
- [ ] Create `docs/security.md` with explicit policy numbers (e.g., 30 calls/min/user, 200/day)

---

## Acceptance checklist (ship-ready)
- [ ] README top-matter: tagline + GIF + working doc links
- [ ] Demo script runs end-to-end and prints a readable timeline
- [ ] Timeline UI shows agent chain with durations and statuses
- [ ] RLS/rate-limit/idempotency present and minimally tested
- [ ] E2E tests green locally and in CI
- [ ] Release tag pushed and linked in README
