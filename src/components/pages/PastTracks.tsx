import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { LearnerTrack } from '../../types/progression';

interface PastTracksProps {
  onResumeTrack?: (track: LearnerTrack) => void;
}

export function PastTracks({ onResumeTrack }: PastTracksProps) {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<LearnerTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPastTracks();
    }
  }, [user]);

  const loadPastTracks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from database first
      const { data, error: fetchError } = await supabase
        .from('learner_tracks')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['completed', 'paused', 'abandoned', 'active'])
        .order('updated_at', { ascending: false });

      if (fetchError) {
        console.warn('Database fetch failed, using mock data:', fetchError);
      }

      // If no data from database, use mock data for demonstration
      if (!data || data.length === 0) {
        const mockTracks = [
          {
            id: 'mock-1',
            user_id: user!.id,
            track_label: 'AI/ML Engineering',
            start_date: '2024-01-15',
            current_week: 8,
            current_day: 3,
            status: 'paused',
            prefs_json: { timePerWeek: 15, learningStyle: 'mixed' },
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-03-20T00:00:00Z'
          },
          {
            id: 'mock-2',
            user_id: user!.id,
            track_label: 'Full-Stack Web Development',
            start_date: '2023-11-01',
            current_week: 12,
            current_day: 5,
            status: 'completed',
            prefs_json: { timePerWeek: 20, learningStyle: 'visual' },
            created_at: '2023-11-01T00:00:00Z',
            updated_at: '2024-02-15T00:00:00Z'
          },
          {
            id: 'mock-3',
            user_id: user!.id,
            track_label: 'Cybersecurity Fundamentals',
            start_date: '2024-02-01',
            current_week: 4,
            current_day: 2,
            status: 'abandoned',
            prefs_json: { timePerWeek: 10, learningStyle: 'kinesthetic' },
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-03-10T00:00:00Z'
          }
        ];
        setTracks(mockTracks);
      } else {
        setTracks(data);
      }
    } catch (err) {
      console.warn('Error loading tracks, using mock data:', err);
      // Fallback to mock data
      const mockTracks = [
        {
          id: 'mock-fallback',
          user_id: user!.id,
          track_label: 'Sample Learning Track',
          start_date: '2024-01-01',
          current_week: 1,
          current_day: 1,
          status: 'paused',
          prefs_json: { timePerWeek: 15, learningStyle: 'mixed' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-03-01T00:00:00Z'
        }
      ];
      setTracks(mockTracks);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeTrack = async (track: LearnerTrack) => {
    try {
      // Update the track status to 'active' and set it as current
      const { error: updateError } = await supabase
        .from('learner_tracks')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', track.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh the data to show updated status
      await loadPastTracks();
      
      // Navigate to the current module page to continue learning
      window.location.href = '/home/module/current';
    } catch (err) {
      console.error('Failed to resume track:', err);
      alert('Failed to resume track. Please try again.');
    }
  };

  const handleStartNewTrack = async (track: LearnerTrack) => {
    try {
      // First, save any existing active track to past tracks
      const { data: existingActive } = await supabase
        .from('learner_tracks')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .single();

      if (existingActive) {
        // Save existing track to past tracks
        const { error: saveError } = await supabase
          .from('learner_tracks')
          .update({
            status: 'paused',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingActive.id);

        if (saveError) {
          console.error('Failed to save existing track:', saveError);
        }
      }

      // Reset weekly notes to start fresh onboarding
      const { error: resetError } = await supabase
        .from('weekly_notes')
        .delete()
        .eq('user_id', user!.id);

      if (resetError) {
        console.error('Failed to reset weekly notes:', resetError);
      }

      // Clear localStorage to ensure fresh start
      localStorage.removeItem(`learningState_${user!.id}`);
      localStorage.removeItem(`userTrack_${user!.id}`);
      localStorage.removeItem(`currentWeek_${user!.id}`);

      // Create new track instance starting from week 1
      const { error: createError } = await supabase
        .from('learner_tracks')
        .insert({
          user_id: user!.id,
          track_label: track.track_label,
          start_date: new Date().toISOString(),
          current_week: 1,
          current_day: 1,
          status: 'active',
          prefs_json: {},
          agent_flags_json: {},
          completion_json: {}
        });

      if (createError) {
        throw createError;
      }

      // Update user's learning preferences to reflect the new track
      const trackMapping: Record<string, string> = {
        'AI/ML Engineering': 'ai_ml',
        'Full-Stack Web Development': 'fullstack_web',
        'Cybersecurity': 'cybersecurity',
        'Data Engineering': 'data_eng',
        'DevOps & Cloud': 'devops',
        'Blockchain Development': 'blockchain',
        'Game Development': 'game_dev',
        'UX/UI Design': 'ux_design'
      };

      const newTrackKey = trackMapping[track.track_label] || 'fullstack_web';
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          learning_preferences: {
            focus_areas: [newTrackKey]
          }
        })
        .eq('id', user!.id);

      if (updateError) {
        console.error('Failed to update user preferences:', updateError);
      }

      // Refresh the data
      await loadPastTracks();
      
      // Navigate to the workspace to start fresh onboarding with force reset
      window.location.href = '/home/workspace?reset=true';
    } catch (err) {
      console.error('Failed to start new track:', err);
      alert('Failed to start new track. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'abandoned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'paused':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" clipRule="evenodd" />
          </svg>
        );
      case 'abandoned':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading past tracks: {error}</p>
          <button
            onClick={loadPastTracks}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning History</h1>
            <p className="text-gray-600 mt-2">
              Review your completed, paused, and abandoned learning tracks
            </p>
          </div>
          <div className="flex space-x-3">
            <a
              href="/home/workspace"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              🚀 Start New Track
            </a>
            <a
              href="/home/self-guided"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
            >
              🧭 Self-Guided
            </a>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {tracks.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {tracks.filter(t => t.status === 'paused').length}
          </div>
          <div className="text-sm text-gray-600">Paused</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {tracks.filter(t => t.status === 'abandoned').length}
          </div>
          <div className="text-sm text-gray-600">Abandoned</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {tracks.length}
          </div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      {/* Tracks List */}
      {tracks.length === 0 ? (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 text-center border border-blue-200">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 9.246 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.523 18.246 19 16.5 19c-1.746 0-3.332-.477-4.5-1.253" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">Ready to Start Learning?</h3>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            You haven't completed or paused any learning tracks yet. Start your learning journey by creating a personalized plan 
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
      ) : (
        <div className="space-y-4">
          {tracks.map((track) => (
            <div key={track.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {track.track_label}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(track.status)}`}>
                      {getStatusIcon(track.status)}
                      <span className="ml-1 capitalize">{track.status}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Started:</span> {formatDate(track.start_date)}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span> {formatDate(track.updated_at)}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {calculateDuration(track.start_date, track.updated_at)}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Progress:</span> Week {track.current_week}, Day {track.current_day}
                  </div>
                </div>
                
                                            <div className="flex space-x-2 ml-4">
                              {track.status === 'paused' && (
                                <button
                                  onClick={() => handleResumeTrack(track)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                                >
                                  Resume
                                </button>
                              )}
                              <button 
                                onClick={() => handleStartNewTrack(track)}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                              >
                                Start Track
                              </button>
                              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                                View Details
                              </button>
                            </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
