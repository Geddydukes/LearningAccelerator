import React, { useState } from 'react';
import { useProgression } from '../../hooks/useProgression';

interface TrackPreferencesProps {
  trackLabel: string;
  onPreferencesUpdated?: () => void;
}

export function TrackPreferences({ trackLabel, onPreferencesUpdated }: TrackPreferencesProps) {
  const { progressState, updateTrack } = useProgression(trackLabel);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    timePerWeek: 15,
    learningStyle: 'mixed',
    hardwareSpecs: '',
    budget: 0
  });

  React.useEffect(() => {
    if (progressState?.track?.prefs_json) {
      setFormData({
        timePerWeek: progressState.track.prefs_json.timePerWeek || 15,
        learningStyle: progressState.track.prefs_json.learningStyle || 'mixed',
        hardwareSpecs: progressState.track.prefs_json.hardwareSpecs || '',
        budget: progressState.track.prefs_json.budget || 0
      });
    }
  }, [progressState?.track?.prefs_json]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateTrack({
        prefs_json: formData
      });
      setIsEditing(false);
      onPreferencesUpdated?.();
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  const handleCancel = () => {
    // Reset form data to current values
    if (progressState?.track?.prefs_json) {
      setFormData({
        timePerWeek: progressState.track.prefs_json.timePerWeek || 15,
        learningStyle: progressState.track.prefs_json.learningStyle || 'mixed',
        hardwareSpecs: progressState.track.prefs_json.hardwareSpecs || '',
        budget: progressState.track.prefs_json.budget || 0
      });
    }
    setIsEditing(false);
  };

  if (!progressState?.track) {
    return null;
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Track Preferences</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Time per week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time per week (hours)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={formData.timePerWeek}
              onChange={(e) => setFormData(prev => ({ ...prev, timePerWeek: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Learning style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning Style
            </label>
            <select
              value={formData.learningStyle}
              onChange={(e) => setFormData(prev => ({ ...prev, learningStyle: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="visual">Visual</option>
              <option value="verbal">Verbal</option>
              <option value="kinesthetic">Kinesthetic</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          {/* Hardware specs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hardware Specifications
            </label>
            <textarea
              value={formData.hardwareSpecs}
              onChange={(e) => setFormData(prev => ({ ...prev, hardwareSpecs: e.target.value }))}
              placeholder="Describe your hardware setup..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget ($)
            </label>
            <input
              type="number"
              min="0"
              max="10000"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Time per week:</span>
            <span className="text-sm font-medium text-gray-900">{formData.timePerWeek} hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Learning style:</span>
            <span className="text-sm font-medium text-gray-900 capitalize">{formData.learningStyle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Budget:</span>
            <span className="text-sm font-medium text-gray-900">${formData.budget}</span>
          </div>
          {formData.hardwareSpecs && (
            <div>
              <span className="text-sm text-gray-600">Hardware:</span>
              <p className="text-sm text-gray-900 mt-1">{formData.hardwareSpecs}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
