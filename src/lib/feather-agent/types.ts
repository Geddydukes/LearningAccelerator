export type FeatherPhaseId =
  | 'lecture'
  | 'comprehension'
  | 'practice'
  | 'reflection'
  | 'planning'
  | 'analysis';

export type FeatherRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface FeatherArtifact<T = unknown> {
  id: string;
  kind: string;
  label?: string;
  data: T;
  meta?: Record<string, unknown>;
  createdAt?: string;
}

export interface FeatherPhase<T = FeatherArtifact> {
  id: FeatherPhaseId | string;
  label: string;
  status: FeatherRunStatus;
  summary?: string;
  meta?: Record<string, unknown>;
  artifacts: T[];
  startedAt?: string;
  completedAt?: string;
}

export interface FeatherRun<TPhase extends FeatherPhase = FeatherPhase> {
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

export interface FeatherRunResponse<TPhase extends FeatherPhase = FeatherPhase> {
  success: boolean;
  data?: FeatherRun<TPhase>;
  error?: string;
}

export interface FeatherRunRequest {
  userId: string;
  action: string;
  payload?: Record<string, unknown>;
  instructorModifications?: Record<string, unknown>;
}
