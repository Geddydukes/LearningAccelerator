import { supabase } from './supabase';
import type { 
  LearnerTrack, 
  ModuleInstance, 
  CreateTrackRequest, 
  UpdateTrackRequest, 
  CreateModuleRequest, 
  UpdateModuleRequest,
  AgentFlags,
  ProgressState
} from '../types/progression';

/**
 * Get or create a learner track for the current user
 */
export async function getOrCreateLearnerTrack(
  userId: string, 
  trackLabel: string,
  prefs?: Record<string, any>
): Promise<LearnerTrack> {
  // First try to get existing track
  const { data: existingTrack, error: selectError } = await supabase
    .from('learner_tracks')
    .select('*')
    .eq('user_id', userId)
    .eq('track_label', trackLabel)
    .single();

  if (existingTrack) {
    return existingTrack;
  }

  // Create new track if none exists
  const { data: newTrack, error: insertError } = await supabase
    .from('learner_tracks')
    .insert({
      user_id: userId,
      track_label: trackLabel,
      prefs_json: prefs || {}
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create learner track: ${insertError.message}`);
  }

  return newTrack;
}

/**
 * Update a learner track
 */
export async function updateLearnerTrack(
  trackId: string, 
  updates: UpdateTrackRequest
): Promise<LearnerTrack> {
  const { data, error } = await supabase
    .from('learner_tracks')
    .update(updates)
    .eq('id', trackId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update learner track: ${error.message}`);
  }

  return data;
}

/**
 * Get the current module instance for a track
 */
export async function getCurrentModuleInstance(
  trackId: string
): Promise<ModuleInstance | null> {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .select('*')
      .eq('learner_track_id', trackId)
      .order('week', { ascending: false })
      .order('day', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.warn(`Failed to get current module instance: ${error.message}`);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Error getting current module instance:', error);
    return null;
  }
}

/**
 * Create or update a module instance
 */
export async function createOrUpdateModuleInstance(
  trackId: string,
  week: number,
  day: number,
  updates: CreateModuleRequest
): Promise<ModuleInstance> {
  // Try to get existing instance
  const { data: existing, error: selectError } = await supabase
    .from('module_instances')
    .select('*')
    .eq('learner_track_id', trackId)
    .eq('week', week)
    .eq('day', day)
    .single();

  if (existing) {
    // Update existing instance
    const { data, error } = await supabase
      .from('module_instances')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update module instance: ${error.message}`);
    }

    return data;
  } else {
    // Create new instance
    const { data, error } = await supabase
      .from('module_instances')
      .insert({
        learner_track_id: trackId,
        week,
        day,
        ...updates
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create module instance: ${error.message}`);
    }

    return data;
  }
}

/**
 * Mark an agent as complete for the current module
 */
export async function markAgentComplete(
  trackId: string,
  week: number,
  day: number,
  agent: keyof AgentFlags
): Promise<ModuleInstance> {
  const currentInstance = await getCurrentModuleInstance(trackId);
  
  if (!currentInstance || currentInstance.week !== week || currentInstance.day !== day) {
    throw new Error('No current module instance found for this week/day');
  }

  const updatedFlags = {
    ...currentInstance.agent_flags_json,
    [agent]: true
  };

  // Determine next phase based on agent completion
  let nextPhase = currentInstance.phase;
  if (agent === 'socratic' && currentInstance.phase === 'plan_approved') {
    nextPhase = 'socratic_complete';
  } else if (agent === 'ta' && currentInstance.phase === 'socratic_complete') {
    nextPhase = 'ta_complete';
  } else if (agent === 'alex' && currentInstance.phase === 'ta_complete') {
    nextPhase = 'alex_complete';
  }

  return createOrUpdateModuleInstance(trackId, week, day, {
    phase: nextPhase,
    agent_flags_json: updatedFlags
  });
}

/**
 * Calculate progress for a module instance
 */
export function calculateModuleProgress(instance: ModuleInstance): number {
  const requiredFlags = ['socratic', 'ta', 'alex'];
  const completedFlags = requiredFlags.filter(flag => 
    instance.agent_flags_json[flag] === true
  );
  
  return Math.round((completedFlags.length / requiredFlags.length) * 100);
}

/**
 * Check if a module can advance to the next phase
 */
export function canAdvanceModule(instance: ModuleInstance): boolean {
  const requiredFlags = ['socratic', 'ta', 'alex'];
  return requiredFlags.every(flag => instance.agent_flags_json[flag] === true);
}

/**
 * Get complete progress state for a user
 */
export async function getProgressState(userId: string, trackLabel: string): Promise<ProgressState> {
  try {
    const track = await getOrCreateLearnerTrack(userId, trackLabel);
    const currentModule = await getCurrentModuleInstance(track.id);

    if (!currentModule) {
      // No module instance yet - this is normal for a new track
      return {
        track,
        currentModule: null,
        progress: 0,
        canAdvance: false,
        requiredFlags: { socratic: false, ta: false, alex: false },
        completedFlags: { socratic: false, ta: false, alex: false }
      };
    }

  const progress = calculateModuleProgress(currentModule);
  const canAdvance = canAdvanceModule(currentModule);
  
  const requiredFlags = { socratic: true, ta: true, alex: true };
  const completedFlags = {
    socratic: currentModule.agent_flags_json.socratic || false,
    ta: currentModule.agent_flags_json.ta || false,
    alex: currentModule.agent_flags_json.alex || false
  };

    return {
      track,
      currentModule,
      progress,
      canAdvance,
      requiredFlags,
      completedFlags
    };
  } catch (error) {
    console.error('Error getting progress state:', error);
    // Return a default state on error
    return {
      track: null,
      currentModule: null,
      progress: 0,
      canAdvance: false,
      requiredFlags: { socratic: false, ta: false, alex: false },
      completedFlags: { socratic: false, ta: false, alex: false }
    };
  }
}

/**
 * Advance to the next day or week
 */
export async function advanceProgress(
  trackId: string,
  currentWeek: number,
  currentDay: number
): Promise<{ week: number; day: number }> {
  let newWeek = currentWeek;
  let newDay = currentDay;

  if (currentDay < 5) { // Assuming 5 days per week
    newDay = currentDay + 1;
  } else {
    newWeek = currentWeek + 1;
    newDay = 1;
  }

  await updateLearnerTrack(trackId, {
    current_week: newWeek,
    current_day: newDay
  });

  return { week: newWeek, day: newDay };
}
