export interface LearnerTrack {
  id: string;
  user_id: string;
  track_label: string;
  start_date: string;
  current_week: number;
  current_day: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  prefs_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ModuleInstance {
  id: string;
  learner_track_id: string;
  week: number;
  day: number;
  phase: 'plan_approved' | 'socratic_complete' | 'ta_complete' | 'alex_complete' | 'day_complete';
  plan_hash?: string;
  agent_flags_json: {
    socratic?: boolean;
    ta?: boolean;
    alex?: boolean;
    [key: string]: any;
  };
  completion_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentFlags {
  socratic: boolean;
  ta: boolean;
  alex: boolean;
  [key: string]: boolean;
}

export interface ProgressState {
  track: LearnerTrack | null;
  currentModule: ModuleInstance | null;
  progress: number; // 0-100
  canAdvance: boolean;
  requiredFlags: AgentFlags;
  completedFlags: AgentFlags;
}

export interface CreateTrackRequest {
  track_label: string;
  prefs_json?: Record<string, any>;
}

export interface UpdateTrackRequest {
  current_week?: number;
  current_day?: number;
  status?: LearnerTrack['status'];
  prefs_json?: Record<string, any>;
}

export interface CreateModuleRequest {
  week: number;
  day: number;
  phase: ModuleInstance['phase'];
  plan_hash?: string;
  agent_flags_json?: Partial<AgentFlags>;
}

export interface UpdateModuleRequest {
  phase?: ModuleInstance['phase'];
  plan_hash?: string;
  agent_flags_json?: Partial<AgentFlags>;
  completion_json?: Record<string, any>;
}
