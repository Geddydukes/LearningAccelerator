# Learning Accelerator - Multi-Agent Learning Platform

A sophisticated multi-agent orchestration system that integrates four specialized GPT agents to create personalized learning experiences.

## 🏗️ Architecture Overview

The Learning Accelerator platform orchestrates four pre-supplied GPT agents through a secure, scalable web application:

- **CLO - Curriculum Architect v2.0**: Generates weekly learning modules
- **Socratic Inquisitor v2.0**: Provides question-only dialogue with voice support
- **Alex - Lead Engineer Advisor v2.2**: Delivers code reviews and technical feedback
- **Brand Strategist v2.1**: Synthesizes social content and KPI dashboards

## 🔒 External Prompt Dependencies

**CRITICAL**: The four specialized GPT agent prompts are **immutable external resources** that exist as version-locked dependencies:

- `clo_v2_0.md` - Curriculum Architect prompt (v2.0)
- `socratic_v2_0.md` - Socratic Inquisitor prompt (v2.0) 
- `alex_v2_2.md` - Lead Engineer Advisor prompt (v2.2)
- `brand_strategist_v2_1.md` - Brand Strategist prompt (v2.1)

### Prompt Management Rules

1. **Server-Side Storage Only**: Prompts are stored in `/supabase/storage/prompts/` or backend `prompts/` directory
2. **No Client Access**: Prompts are never exposed to the frontend
3. **Immutable Resources**: Application code cannot modify these prompts
4. **Version Locked**: Each prompt has a specific version that must not be changed
5. **Proxy Pattern**: All agent calls go through `/api/agent/*` endpoints that inject prompts server-side

### Agent Proxy Service Pattern

```typescript
// Backend only - never expose to client
import fs from 'fs/promises';

export async function loadPrompt(name: string) {
  return fs.readFile(`./prompts/${name}.md`, 'utf-8');
}

// Example API endpoint
export default async function handler(req, res) {
  const prompt = await loadPrompt('clo_v2_0');
  // Inject prompt + user input to Gemini
  // Return structured response
}
```

## 🚀 Quick Start

1. **Environment Setup**
   ```bash
   cp .env.example .env
   # Add your API keys
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Connect Supabase**
   - Click "Connect to Supabase" in the top right
   - Or manually add SUPABASE_URL and SUPABASE_ANON_KEY to .env

4. **Start Development**
   ```bash
   npm run dev
   ```

## 📊 System Requirements

- Node.js 18+
- Supabase account for database and authentication
- Google Gemini API key for LLM interactions
- ElevenLabs API key for voice synthesis

## 🔧 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **LLM**: Google Gemini 1.5 Pro
- **Voice**: ElevenLabs Text-to-Speech
- **Build**: Vite, ESLint, PostCSS

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Card, etc.)
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard and agent cards
│   └── agents/         # Agent interaction interfaces
├── contexts/           # React contexts (Auth, Theme)
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries (Supabase, Gemini)
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

## 🔐 Security

- JWT-based authentication with Supabase
- Server-side API key management
- Protected routes and session handling
- Secure prompt storage (never client-accessible)

## 📈 Performance Targets

See `/docs/slo.md` for detailed Service Level Objectives.