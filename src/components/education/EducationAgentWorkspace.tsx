import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { educationAgentClient, EducationSession } from '../../lib/educationAgentClient';
import { codingWorkspaceClient } from '../../lib/codingWorkspaceClient';
import { CodingWorkspace } from '../coding/CodingWorkspace';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../design-system/GlassCard';
import { RippleButton } from '../design-system/RippleButton';

interface EducationAgentWorkspaceProps {
  week?: number;
  day?: number;
  onComplete?: () => void;
}

type LearningPhase = 'planning' | 'lecture' | 'check' | 'practice_prep' | 'practice' | 'reflect' | 'completed';

export const EducationAgentWorkspace: React.FC<EducationAgentWorkspaceProps> = ({
  week = 1,
  day = 1,
  onComplete,
}) => {
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState<LearningPhase>('planning');
  const [session, setSession] = useState<EducationSession | null>(null);
  const [artifacts, setArtifacts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [practiceType, setPracticeType] = useState<'ta' | 'socratic' | 'coding' | null>(null);

  // Initialize session on mount
  useEffect(() => {
    if (user?.id) {
      initializeSession();
    }
  }, [user?.id, week, day]);

  const initializeSession = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Check if session already exists
      const existingSession = await educationAgentClient.getSession(user.id, week, day);
      
      if (existingSession) {
        setSession(existingSession);
        setCurrentPhase(existingSession.phase as LearningPhase);
        setArtifacts(existingSession.artifacts);
      } else {
        // Start new day
        const response = await educationAgentClient.startDay(user.id, week, day);
        
        if (response.success && response.data) {
          setCurrentPhase(response.data.phase as LearningPhase);
          setArtifacts(response.data.artifacts || {});
          
          // Update session state
          const newSession = await educationAgentClient.getSession(user.id, week, day);
          setSession(newSession);
        } else {
          setError(response.error || 'Failed to start learning session');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseTransition = async (event: string, payload?: Record<string, any>) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      let response;
      
      switch (event) {
        case 'lecture_done':
          response = await educationAgentClient.lectureDone(user.id, week, day, payload);
          break;
        case 'check_done':
          response = await educationAgentClient.checkDone(user.id, week, day, payload);
          break;
        case 'practice_ready':
          response = await educationAgentClient.practiceReady(user.id, practiceType!, week, day, payload);
          break;
        case 'practice_done':
          response = await educationAgentClient.practiceDone(user.id, week, day, payload);
          break;
        case 'reflect_done':
          response = await educationAgentClient.reflectDone(user.id, week, day, payload);
          break;
        default:
          throw new Error(`Unknown event: ${event}`);
      }

      if (response.success && response.data) {
        setCurrentPhase(response.data.phase as LearningPhase);
        setArtifacts(response.data.artifacts || {});
        
        // Update session state
        const updatedSession = await educationAgentClient.getSession(user.id, week, day);
        setSession(updatedSession);

        // Handle completion
        if (response.data.phase === 'completed') {
          onComplete?.();
        }
      } else {
        setError(response.error || 'Failed to transition phase');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectPracticeType = (type: 'ta' | 'socratic' | 'coding') => {
    setPracticeType(type);
    handlePhaseTransition('practice_ready', { practiceType: type });
  };

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'planning':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Preparing Your Learning Session</h2>
            <p className="text-lg mb-6">Setting up your personalized learning experience...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        );

      case 'lecture':
        return (
          <LecturePhase
            lecture={artifacts.lecture}
            onComplete={() => handlePhaseTransition('lecture_done')}
            loading={loading}
          />
        );

      case 'check':
        return (
          <ComprehensionCheckPhase
            check={artifacts.comprehensionCheck}
            onComplete={(results) => handlePhaseTransition('check_done', { checkResults: results })}
            loading={loading}
          />
        );

      case 'practice_prep':
        return (
          <PracticeSelectionPhase
            modifiedPrompts={artifacts.modifiedPrompts}
            onSelectPractice={selectPracticeType}
            loading={loading}
          />
        );

      case 'practice':
        if (practiceType === 'coding') {
          return (
            <CodingPracticePhase
              codingWorkspace={artifacts.codingWorkspace}
              onComplete={(results) => handlePhaseTransition('practice_done', { practiceResults: results })}
              loading={loading}
            />
          );
        } else {
          return (
            <PracticePhase
              practiceType={practiceType!}
              practice={artifacts[practiceType!]}
              onComplete={(results) => handlePhaseTransition('practice_done', { practiceResults: results })}
              loading={loading}
            />
          );
        }

      case 'reflect':
        return (
          <ReflectionPhase
            telemetry={artifacts.telemetry}
            onComplete={(reflection) => handlePhaseTransition('reflect_done', { reflection })}
            loading={loading}
          />
        );

      case 'completed':
        return (
          <CompletionPhase
            reflection={artifacts.reflection}
            onStartNewDay={() => {
              setCurrentPhase('planning');
              initializeSession();
            }}
          />
        );

      default:
        return <div>Unknown phase: {currentPhase}</div>;
    }
  };

  if (loading && currentPhase === 'planning') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Initializing Education Agent</h2>
            <p className="text-lg mb-6">Preparing your personalized learning experience...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2">Education Agent</h1>
          <p className="text-xl text-center text-gray-600">
            Week {week}, Day {day} - {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-center space-x-4">
            {['lecture', 'check', 'practice_prep', 'practice', 'reflect', 'completed'].map((phase, index) => (
              <div
                key={phase}
                className={`flex items-center ${
                  ['lecture', 'check', 'practice_prep', 'practice', 'reflect', 'completed'].indexOf(currentPhase) >= index
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    ['lecture', 'check', 'practice_prep', 'practice', 'reflect', 'completed'].indexOf(currentPhase) >= index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 5 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      ['lecture', 'check', 'practice_prep', 'practice', 'reflect', 'completed'].indexOf(currentPhase) > index
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-8">
              {renderPhaseContent()}
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Phase Components
const LecturePhase: React.FC<{
  lecture: any;
  onComplete: () => void;
  loading: boolean;
}> = ({ lecture, onComplete, loading }) => (
  <div>
    <h2 className="text-3xl font-bold mb-6">Lecture</h2>
    <div className="prose max-w-none mb-8">
      <div dangerouslySetInnerHTML={{ __html: lecture?.content || 'Loading lecture...' }} />
    </div>
    <div className="text-center">
      <RippleButton
        onClick={onComplete}
        disabled={loading}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'I\'m Ready for Questions'}
      </RippleButton>
    </div>
  </div>
);

const ComprehensionCheckPhase: React.FC<{
  check: any;
  onComplete: (results: any) => void;
  loading: boolean;
}> = ({ check, onComplete, loading }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    onComplete({ answers });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Comprehension Check</h2>
      <div className="space-y-6">
        {check?.questions?.map((question: any, index: number) => (
          <div key={index} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">{question.question}</h3>
            <textarea
              value={answers[index] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [index]: e.target.value }))}
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
              placeholder="Your answer..."
            />
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <RippleButton
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Submit Answers'}
        </RippleButton>
      </div>
    </div>
  );
};

const PracticeSelectionPhase: React.FC<{
  modifiedPrompts: any;
  onSelectPractice: (type: 'ta' | 'socratic' | 'coding') => void;
  loading: boolean;
}> = ({ modifiedPrompts, onSelectPractice, loading }) => (
  <div>
    <h2 className="text-3xl font-bold mb-6">Choose Your Practice</h2>
    <p className="text-lg mb-8 text-center">
      Based on your comprehension check, here are your personalized practice options:
    </p>
    
    <div className="grid md:grid-cols-3 gap-6">
      <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-4">TA Exercises</h3>
        <p className="mb-4">Structured exercises with hints and feedback</p>
        <RippleButton
          onClick={() => onSelectPractice('ta')}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Start TA Practice
        </RippleButton>
      </div>

      <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-4">Socratic Dialog</h3>
        <p className="mb-4">Interactive questioning to deepen understanding</p>
        <RippleButton
          onClick={() => onSelectPractice('socratic')}
          disabled={loading}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          Start Socratic Dialog
        </RippleButton>
      </div>

      <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-4">Coding Workspace</h3>
        <p className="mb-4">Hands-on coding with real-time feedback</p>
        <RippleButton
          onClick={() => onSelectPractice('coding')}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Start Coding
        </RippleButton>
      </div>
    </div>
  </div>
);

const PracticePhase: React.FC<{
  practiceType: 'ta' | 'socratic';
  practice: any;
  onComplete: (results: any) => void;
  loading: boolean;
}> = ({ practiceType, practice, onComplete, loading }) => (
  <div>
    <h2 className="text-3xl font-bold mb-6">
      {practiceType === 'ta' ? 'TA Exercises' : 'Socratic Dialog'}
    </h2>
    <div className="prose max-w-none mb-8">
      <div dangerouslySetInnerHTML={{ __html: practice?.content || 'Loading practice...' }} />
    </div>
    <div className="text-center">
      <RippleButton
        onClick={() => onComplete({ practiceType, results: practice })}
        disabled={loading}
        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Complete Practice'}
      </RippleButton>
    </div>
  </div>
);

const CodingPracticePhase: React.FC<{
  codingWorkspace: any;
  onComplete: (results: any) => void;
  loading: boolean;
}> = ({ codingWorkspace, onComplete, loading }) => (
  <div>
    <h2 className="text-3xl font-bold mb-6">Coding Workspace</h2>
    <CodingWorkspace
      workspaceData={codingWorkspace}
      onComplete={onComplete}
      loading={loading}
    />
  </div>
);

const ReflectionPhase: React.FC<{
  telemetry: any;
  onComplete: (reflection: any) => void;
  loading: boolean;
}> = ({ telemetry, onComplete, loading }) => {
  const [reflection, setReflection] = useState('');

  const handleSubmit = () => {
    onComplete({ reflection, telemetry });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Daily Reflection</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Today's Learning Summary</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm">{JSON.stringify(telemetry, null, 2)}</pre>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Your Reflection</h3>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          className="w-full p-3 border rounded-lg resize-none"
          rows={6}
          placeholder="What did you learn today? What was challenging? What would you like to focus on tomorrow?"
        />
      </div>
      <div className="text-center">
        <RippleButton
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Complete Day'}
        </RippleButton>
      </div>
    </div>
  );
};

const CompletionPhase: React.FC<{
  reflection: any;
  onStartNewDay: () => void;
}> = ({ reflection, onStartNewDay }) => (
  <div className="text-center">
    <h2 className="text-3xl font-bold mb-6">Day Complete! 🎉</h2>
    <div className="prose max-w-none mb-8">
      <div dangerouslySetInnerHTML={{ __html: reflection?.summary || 'Great work today!' }} />
    </div>
    <RippleButton
      onClick={onStartNewDay}
      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Start Next Day
    </RippleButton>
  </div>
);