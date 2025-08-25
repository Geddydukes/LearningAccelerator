import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as progressionService from '../lib/progression';
import type { ProgressState, CreateTrackRequest, UpdateTrackRequest } from '../types/progression';

export function useProgression(trackLabel: string) {
  const { user } = useAuth();
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial progress state
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadProgressState();
  }, [user, trackLabel]);

  const loadProgressState = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const state = await progressionService.getProgressState(user.id, trackLabel);
      setProgressState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  }, [user, trackLabel]);

  const createOrUpdateTrack = useCallback(async (prefs?: Record<string, any>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const track = await progressionService.getOrCreateLearnerTrack(user.id, trackLabel, prefs);
      await loadProgressState(); // Reload state
      return track;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create/update track');
      throw err;
    }
  }, [user, trackLabel, loadProgressState]);

  const updateTrack = useCallback(async (updates: UpdateTrackRequest) => {
    if (!progressState?.track) throw new Error('No track found');

    try {
      const updatedTrack = await progressionService.updateLearnerTrack(progressState.track.id, updates);
      await loadProgressState(); // Reload state
      return updatedTrack;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update track');
      throw err;
    }
  }, [progressState?.track, loadProgressState]);

  const markAgentComplete = useCallback(async (agent: 'socratic' | 'ta' | 'alex') => {
    if (!progressState?.track || !progressState.currentModule) {
      throw new Error('No track or module found');
    }

    try {
      const updatedModule = await progressionService.markAgentComplete(
        progressState.track.id,
        progressState.currentModule.week,
        progressState.currentModule.day,
        agent
      );
      await loadProgressState(); // Reload state
      return updatedModule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark agent complete');
      throw err;
    }
  }, [progressState?.track, progressState?.currentModule, loadProgressState]);

  const advanceProgress = useCallback(async () => {
    if (!progressState?.track || !progressState.currentModule) {
      throw new Error('No track or module found');
    }

    if (!progressState.canAdvance) {
      throw new Error('Cannot advance - not all agents complete');
    }

    try {
      const { week, day } = await progressionService.advanceProgress(
        progressState.track.id,
        progressState.currentModule.week,
        progressState.currentModule.day
      );
      await loadProgressState(); // Reload state
      return { week, day };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance progress');
      throw err;
    }
  }, [progressState?.track, progressState?.currentModule, progressState?.canAdvance, loadProgressState]);

  const refresh = useCallback(() => {
    loadProgressState();
  }, [loadProgressState]);

  return {
    progressState,
    loading,
    error,
    createOrUpdateTrack,
    updateTrack,
    markAgentComplete,
    advanceProgress,
    refresh
  };
}
