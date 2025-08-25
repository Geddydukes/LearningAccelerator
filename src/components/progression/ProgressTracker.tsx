import React from 'react';
import { useProgression } from '../../hooks/useProgression';
import type { AgentFlags } from '../../types/progression';

interface ProgressTrackerProps {
  trackLabel: string;
  onAgentComplete?: (agent: keyof AgentFlags) => void;
  onAdvance?: (week: number, day: number) => void;
}

export function ProgressTracker({ trackLabel, onAgentComplete, onAdvance }: ProgressTrackerProps) {
  const {
    progressState,
    loading,
    error,
    markAgentComplete,
    advanceProgress
  } = useProgression(trackLabel);

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!progressState) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-sm">No progress data available</p>
      </div>
    );
  }

  const { track, currentModule, progress, canAdvance, requiredFlags, completedFlags } = progressState;

  const handleAgentComplete = async (agent: keyof AgentFlags) => {
    try {
      await markAgentComplete(agent);
      onAgentComplete?.(agent);
    } catch (err) {
      console.error(`Failed to mark ${agent} complete:`, err);
    }
  };

  const handleAdvance = async () => {
    try {
      const { week, day } = await advanceProgress();
      onAdvance?.(week, day);
    } catch (err) {
      console.error('Failed to advance progress:', err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {track.track_label} - Week {track.current_week}, Day {track.current_day}
        </h3>
        
        {/* Progress Ring */}
        <div className="flex items-center space-x-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600 transition-all duration-300"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${progress}, 100`}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-900">{progress}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Overall Progress</p>
            <p className="text-lg font-semibold text-gray-900">{progress}% Complete</p>
          </div>
        </div>
      </div>

      {/* Agent Status */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Agent Completion Status</h4>
        <div className="space-y-3">
          {Object.entries(requiredFlags).map(([agent, required]) => {
            const completed = completedFlags[agent as keyof AgentFlags];
            const canMark = currentModule && currentModule.phase !== 'day_complete';
            
            return (
              <div key={agent} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'bg-white border-gray-300'
                  }`}>
                    {completed && (
                      <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {agent} Agent
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {completed ? (
                    <span className="text-sm text-green-600 font-medium">Complete</span>
                  ) : (
                    <>
                      <span className="text-sm text-gray-500">Pending</span>
                      {canMark && (
                        <button
                          onClick={() => handleAgentComplete(agent as keyof AgentFlags)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advance Button */}
      <div className="border-t pt-4">
        <button
          onClick={handleAdvance}
          disabled={!canAdvance}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            canAdvance
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canAdvance ? 'Advance to Next Day' : 'Complete All Agents to Advance'}
        </button>
        
        {!canAdvance && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            All agents must be complete before advancing
          </p>
        )}
      </div>
    </div>
  );
}
