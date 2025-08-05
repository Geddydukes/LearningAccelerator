import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, BookOpen, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../hooks/useDatabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface UserSetupProps {
  onComplete: () => void;
}

export const UserSetup: React.FC<UserSetupProps> = ({ onComplete }) => {
  const { user: authUser } = useAuth();
  const { updateUserProfile } = useDatabase();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    difficulty_level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    focus_areas: ['full-stack-development'],
    learning_pace: 'normal' as 'slow' | 'normal' | 'fast',
    preferred_interaction_style: 'mixed' as 'text' | 'voice' | 'mixed'
  });

  const handleSavePreferences = async () => {
    if (!authUser) return;

    setLoading(true);
    try {
      await updateUserProfile({
        learning_preferences: preferences
      });
      toast.success('Preferences saved successfully!');
      onComplete();
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const focusAreaOptions = [
    { id: 'full-stack-development', label: 'Full-Stack Development', icon: BookOpen },
    { id: 'frontend', label: 'Frontend Development', icon: User },
    { id: 'backend', label: 'Backend Development', icon: Settings },
    { id: 'devops', label: 'DevOps & Infrastructure', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome, {authUser?.user_metadata?.name || 'Learner'}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Let's personalize your learning experience
            </p>
          </div>

          <div className="space-y-6">
            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What's your current skill level?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setPreferences(prev => ({ ...prev, difficulty_level: level }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preferences.difficulty_level === level
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium capitalize">{level}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What areas interest you most?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {focusAreaOptions.map((area) => {
                  const Icon = area.icon;
                  const isSelected = preferences.focus_areas.includes(area.id);
                  return (
                    <button
                      key={area.id}
                      onClick={() => {
                        setPreferences(prev => ({
                          ...prev,
                          focus_areas: isSelected
                            ? prev.focus_areas.filter(id => id !== area.id)
                            : [...prev.focus_areas, area.id]
                        }));
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {area.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Learning Pace */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What's your preferred learning pace?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['slow', 'normal', 'fast'] as const).map((pace) => (
                  <button
                    key={pace}
                    onClick={() => setPreferences(prev => ({ ...prev, learning_pace: pace }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preferences.learning_pace === pace
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium capitalize">{pace}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interaction Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                How do you prefer to interact?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['text', 'voice', 'mixed'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setPreferences(prev => ({ ...prev, preferred_interaction_style: style }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preferences.preferred_interaction_style === style
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium capitalize">{style}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={onComplete}>
              Skip for now
            </Button>
            <Button onClick={handleSavePreferences} loading={loading}>
              Save & Continue
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};