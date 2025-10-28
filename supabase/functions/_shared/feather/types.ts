export type FeatherPhaseId =
  | 'lecture'
  | 'comprehension'
  | 'practice'
  | 'reflection'
  | 'planning'
  | 'analysis';

export type FeatherRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface FeatherRunRequest {
  userId: string;
  action: string;
  payload?: Record<string, unknown>;
  instructorModifications?: Record<string, unknown>;
}

export interface FeatherArtifact<T = unknown> {
  id: string;
  kind: string;
  label?: string;
  data: T;
  meta?: Record<string, unknown>;
  createdAt?: string;
}

export interface FeatherPhase<TArtifacts extends FeatherArtifact = FeatherArtifact> {
  id: FeatherPhaseId | string;
  label: string;
  status: FeatherRunStatus;
  summary?: string;
  artifacts: TArtifacts[];
  meta?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
}

export interface FeatherRunResult<TPhase extends FeatherPhase = FeatherPhase> {
  runId: string;
  agentId: string;
  status: FeatherRunStatus;
  startedAt: string;
  completedAt?: string;
  action: string;
  phases: TPhase[];
  state?: Record<string, unknown>;
  instructorModifications?: Record<string, unknown>;
}

export interface FeatherTaskContext {
  request: FeatherRunRequest;
  phase: FeatherPhase;
  supabase: any;
  state: Record<string, unknown>;
  log: (message: string, meta?: Record<string, unknown>) => void;
  emitArtifact: (artifact: FeatherArtifact) => void;
  setPhaseMeta: (meta: Record<string, unknown>) => void;
  setPhaseSummary: (summary: string) => void;
}

export interface FeatherTaskDefinition {
  id: string;
  phaseId: FeatherPhase['id'];
  label?: string;
  description?: string;
  run: (ctx: FeatherTaskContext) => Promise<void>;
}

export interface FeatherRuntimeConfig {
  agentId: string;
  label: string;
  tasks: FeatherTaskDefinition[];
  corsHeaders?: Record<string, string>;
  getSupabaseClient?: () => any;
}
