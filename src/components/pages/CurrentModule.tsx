import React from 'react';
import { useProgression } from '../../hooks/useProgression';
import { ProgressTracker, TrackPreferences } from '../progression';
import { SafeMarkdown } from '../ui/SafeMarkdown';

interface CurrentModuleProps {
  trackLabel: string;
}

export function CurrentModule({ trackLabel }: CurrentModuleProps) {
  const { progressState, loading, error } = useProgression(trackLabel);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading module: {error}</p>
        </div>
      </div>
    );
  }

  if (!progressState?.track) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700">No active track found. Please select a learning track to begin.</p>
        </div>
      </div>
    );
  }

  const { track, currentModule } = progressState;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {track.track_label} - Week {track.current_week}, Day {track.current_day}
        </h1>
        <p className="text-gray-600 mt-2">
          Track started {new Date(track.start_date).toLocaleDateString()}
        </p>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressTracker 
          trackLabel={trackLabel}
          onAgentComplete={(agent) => {
            console.log(`${agent} agent marked complete`);
          }}
          onAdvance={(week, day) => {
            console.log(`Advanced to Week ${week}, Day ${day}`);
          }}
        />
        
        <TrackPreferences 
          trackLabel={trackLabel}
          onPreferencesUpdated={() => {
            console.log('Preferences updated');
          }}
        />
      </div>

      {/* Current Module Status */}
      {currentModule && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Module Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{currentModule.week}</div>
              <div className="text-sm text-gray-600">Week</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{currentModule.day}</div>
              <div className="text-sm text-gray-600">Day</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 capitalize">
                {currentModule.phase.replace('_', ' ')}
              </div>
              <div className="text-sm text-gray-600">Phase</div>
            </div>
          </div>

          {/* Agent Flags */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Agent Completion</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(currentModule.agent_flags_json).map(([agent, completed]) => (
                <div key={agent} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {agent} Agent
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    completed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {completed ? 'Complete' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Hash */}
          {currentModule.plan_hash && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-2">Plan Reference</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm text-gray-700 font-mono">
                  {currentModule.plan_hash}
                </code>
              </div>
            </div>
          )}

          {/* Completion Data */}
          {Object.keys(currentModule.completion_json).length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Completion Data</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(currentModule.completion_json, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Current Module */}
      {!currentModule && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 9.246 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.523 18.246 19 16.5 19c-1.746 0-3.332-.477-4.5-1.253" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">Ready to Start Learning?</h3>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            You don't have an active learning module yet. Start your learning journey by creating a personalized plan 
            or exploring self-guided learning options.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/home/workspace"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
            >
              🚀 Start Learning Workspace
            </a>
            <a
              href="/home/self-guided"
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-lg"
            >
              🧭 Self-Guided Learning
            </a>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Choose from structured learning tracks or create your own custom learning path</p>
          </div>
        </div>
      )}
    </div>
  );
}
