# Learning Accelerator

Multi-agent learning platform with a Supabase-backed orchestrator, PWA frontend, and versioned agent prompts. The app now centers on self-guided learning flows powered by scheduled workflows and secure agent proxying.

## 🏗️ Current Architecture

- **Frontend (PWA)**: React 18 + TypeScript, Vite, Tailwind, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Orchestrator**: Supabase Edge Functions with job queue, cron, and rate limiting
- **LLM**: Google Gemini (via server-side agent-proxy)
- **Voice**: ElevenLabs TTS (server-side integration)

See `docs/architecture.md` for C4 context and container diagrams.

## ✨ Key Capabilities

- **Education Agent UI - AKA Guru**: Unified interface and personality orchestrating all agents as tools
- **Instructor-Centric Learning**: Classroom-style teaching with structured lectures and comprehension checks
- **Adaptive Practice**: TA/Socratic agents receive instructor-modified prompts based on user understanding
- **Multi-Agent Support**: 10 specialized agents with instructor as central coordinator
- **CLO Program Planning**: Multi-week Program Plan with versioning → weekly plans adjusted by performance
- **Secure Prompt Injection**: Prompts are server-side only; never exposed in client
- **Daily Feedback Loops**: Practice results modify next day's learning plan
- **Weekly Assessment**: Alex grades tasks → CLO adjusts curriculum
- **Coding Workspace**: In-browser coding tasks with tests and Alex grading integration
- **PWA**: Offline-capable build, service worker, and web manifest
- **Analytics-Ready**: Progress and streak primitives with e2e coverage

## 🔒 Prompt Management (Versioned)

Prompts are treated as immutable, version-locked assets.

- Source prompts: `prompts/` and `prompts/base/*` (markdown and YAML)
- Sync helpers: `scripts/sync-prompts.sh`, `scripts/upload-prompts.js`, `scripts/uploadPrompts.js`
- Rules:
  - Stored server-side only (Supabase Storage or server bundle)
  - Never shipped to client
  - Access only via agent-proxy endpoints

## 🚀 Quick Start (Local Dev)

1. Create environment
   ```bash
   cp .env.example .env
   # Populate SUPABASE_URL, SUPABASE_ANON_KEY, EDGE_SERVICE_JWT, GEMINI_API_KEY, ELEVENLABS_API_KEY
   ```

2. Install
   ```bash
   npm install
   ```

3. Develop
   ```bash
   npm run dev
   ```

4. Preview production build
   ```bash
   npm run build && npm run preview
   ```

## 🧰 NPM Scripts

- `dev`: Start Vite dev server
- `build`: Production build (includes PWA assets)
- `preview`: Preview production build
- `build:manifest`: Generate `build/agents.manifest.json`
- `ci:drift-check`: Verify generated artifacts are in sync
- `lint`: ESLint across repo
- `test`: Unit tests (vitest)
- `test:watch`: Jest watch (legacy tests)
- `test:coverage`: Jest coverage (legacy)
- `test:e2e`: Playwright E2E headless
- `test:e2e:ui`: Playwright E2E with UI

## 🗄️ Orchestrator Overview

Edge functions coordinate workflows for daily and weekly learning plans with robust job management. The system implements an **instructor-centric learning flow** where the Instructor Agent operates as a classroom teacher.

Core endpoints (Supabase Edge Functions):

- `/functions/v1/orchestrator/dispatch` – enqueue workflow runs
- `/functions/v1/orchestrator/worker` – lease/execute jobs (cron-triggered)
- `/functions/v1/orchestrator/rate_limit` – token bucket
- `/functions/v1/cron-orchestrator` – cron workflows

Education Agent endpoints (state machine + tools):

- `/functions/v1/education-agent` – event-driven session flow (start_day → lecture → check → practice → reflect)
- `/functions/v1/agent-proxy` – secure proxy to individual agents

CLO planning endpoints:

- `/functions/v1/clo/program.plan` – create multi-week Program Plan (versioned)
- `/functions/v1/clo/program.accept` – accept/freeze Program Plan version
- `/functions/v1/clo/weekly.plan` – derive weekly plan from Program Plan + performance

Coding workspace endpoints:

- `/functions/v1/coding-workspace/start` – scaffold coding session (fs, brief, tests)
- `/functions/v1/coding-workspace/run` – execute tests/run code and capture output
- `/functions/v1/coding-workspace/alex.final` – grade submission and return scorecard

## 🎓 Learning Flow Architecture

### Daily Learning Session
1. **Instructor Lecture**: Structured content delivery from CLO framework
2. **Comprehension Check**: Real-time Q&A to gauge understanding
3. **Practice Preparation**: Instructor modifies TA/Socratic prompts based on comprehension
4. **Practice Sessions**: User chooses TA (coding) or Socratic (questioning) with tailored prompts

### Weekly Assessment Loop
1. **Program Plan Reference**: CLO maintains a versioned multi-week Program Plan
2. **Weekly Plan Creation**: CLO derives week N plan from Program Plan + prior performance
3. **Alex Assessment**: Grades weekly project submissions against the week’s rubric
4. **CLO Adjustment**: Updates next week's plan; revision bumps Program Plan version as needed
5. **Curriculum Evolution**: Learning objectives adapt to user progress

See `docs/agent-flow.md` for complete learning flow documentation.

Quick setup excerpt:

```bash
supabase db reset # or supabase migration up
node scripts/setup-orchestrator.js
supabase functions deploy orchestrator
supabase functions deploy cron-orchestrator
```

## 📱 PWA

- Build outputs are in `dist/` with `manifest.webmanifest`, `sw.js`, Workbox, and hashed assets
- Register service worker via `dist/registerSW.js`

## 📁 Project Structure (selected)

```
src/
├── components/            # UI modules and pages
├── contexts/              # Auth, theme, app state
├── hooks/                 # Reusable hooks
├── lib/                   # Supabase, LLM client, utilities
├── routes/                # App route config
├── App.tsx                # Root app
supabase/
├── functions/             # Edge functions (TS)
├── migrations/            # SQL migrations
design-system/             # Reusable DS and tokens
docs/                      # Architecture, SLOs, guides
scripts/                   # Orchestrator, prompts, seeding
src/components/education/  # Education Agent UI (unified)
src/components/coding/     # In-browser coding workspace
supabase/functions/education-agent/   # Session state machine
supabase/functions/coding-workspace/  # Coding tools (start/run/alex)
```

## 🧪 Testing

- Unit: `npm test` (vitest) and targeted jest suites where present
- E2E: `npm run test:e2e` (Playwright), UI mode via `npm run test:e2e:ui`
- Lighthouse config: `lighthouserc.json`

## 🔐 Security & Policies

- Supabase Auth (JWT) with protected routes
- API keys and prompts are server-side only
- Rate limiting and idempotency for agent/orchestrator endpoints
- RLS on orchestrator tables (see docs)

## 📈 Performance & SLOs

Targets and guidance are in `docs/slo.md` and `docs/perf-accessibility-playbook.md`.

## 📦 Deployment

- PWA static hosting compatible; `fly.prod.toml` included for Fly.io
- Ensure environment variables and Supabase Edge Functions are deployed

## 🗺️ Related Docs

- Architecture: `docs/architecture.md`
- Orchestrator: `docs/orchestrator-setup.md`
- UI Redesign: `docs/implementation-guide.md`
- Prompt system: `prompts/README.md` or `prompts/` directory

---

Built for robust, self-guided learning with secure multi-agent orchestration.