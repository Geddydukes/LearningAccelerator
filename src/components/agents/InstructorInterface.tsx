import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, Play, MessageSquare, Code, ArrowRight, Clock, Target } from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { AgentOrchestrator } from '../../lib/agents';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressRing } from '../ui/ProgressRing';
import { Badge } from '../ui/Badge';
import toast from 'react-hot-toast';

type LearningPhase = 'lecture' | 'comprehension' | 'practice_preparation' | 'practice';

interface ComprehensionQuestion {
  id: string;
  question: string;
  understandingLevel?: 'mastered' | 'needs_work' | 'not_understood';
}

interface LectureContent {
  lecture_content: string;
  key_concepts: string[];
  estimated_duration: number;
  next_phase: string;
  lecture_id: string;
  difficulty_level: string;
}

interface ComprehensionData {
  questions: ComprehensionQuestion[];
  user_understanding: string;
  next_phase: string;
  assessment_id: string;
}

interface ModifiedPrompts {
  ta_prompt: string;
  socratic_prompt: string;
  practice_focus: string[];
  modification_id: string;
}

export const InstructorInterface: React.FC = () => {
  const { user, currentWeek } = useDatabase();
  const [currentPhase, setCurrentPhase] = useState<LearningPhase>('lecture');
  const [lectureContent, setLectureContent] = useState<LectureContent | null>(null);
  const [comprehensionData, setComprehensionData] = useState<ComprehensionData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [modifiedPrompts, setModifiedPrompts] = useState<ModifiedPrompts | null>(null);

  function sanitizeLecture(text: string): string {
    if (!text) return '';
    // Remove fenced code blocks ``` ``` (including ```json / ```jsonc)
    let cleaned = text.replace(/```[\s\S]*?```/g, '').trim();
    // Remove inline JSON blobs bounded by braces that are likely metadata (very conservative: multi-line big JSON)
    cleaned = cleaned.replace(/\{[\s\S]*?\}\s*$/m, '').trim();
    // Drop internal sections we never show
    const lines = cleaned.split('\n').filter(line => {
      const l = line.trim();
      if (!l) return true;
      // Handoffs / tools / assessor metadata
      if (/^\*\*?\s*Handoff/i.test(l)) return false;
      if (/^\*\*?\s*Practical Tools/i.test(l)) return false;
      if (/^CLO_Briefing_Note/i.test(l)) return false;
      if (/^CLO_Assessor_Directive/i.test(l)) return false;
      if (/^Lesson Content\b/i.test(l)) return false;
      return true;
    });
    cleaned = lines.join('\n').trim();
    // Trim overly long blocks to a concise preview
    if (cleaned.length > 1200) cleaned = cleaned.slice(0, 1200).trim() + '…';
    return cleaned;
  }

  const instructorOperation = useAsyncOperation({
    showToast: false,
    onSuccess: (data) => {
      if (currentPhase === 'lecture') {
        // Sanitize incoming content for display-only purposes
        const safeData = {
          ...data,
          lecture_content: sanitizeLecture(data?.lecture_content || ''),
          estimated_duration: data?.estimated_duration && data.estimated_duration > 0 ? data.estimated_duration : 20,
          key_concepts: Array.isArray(data?.key_concepts) ? data.key_concepts : [],
        } as LectureContent;
        setLectureContent(safeData);
        setCurrentPhase('comprehension');
        toast.success('Lecture delivered successfully!');
      } else if (currentPhase === 'comprehension') {
        // Stay in comprehension phase to show returned questions; user will continue explicitly
        setComprehensionData(data);
        toast.success('Comprehension questions ready!');
      } else if (currentPhase === 'practice_preparation') {
        setModifiedPrompts(data);
        setCurrentPhase('practice');
        toast.success('Practice sessions prepared!');
      }
    },
    onError: (error) => {
      toast.error(`Failed to ${currentPhase}: ${error.message}`);
    }
  });

  const startLecture = async () => {
    if (!user) return;
    
    await instructorOperation.execute(async () => {
      const result = await AgentOrchestrator.callInstructorAgent(
        user.id,
        'DELIVER_LECTURE',
        { 
          week: currentWeek?.week_number || 1,
          topic: currentWeek?.topic || 'Machine Learning Fundamentals',
          difficultyLevel: 'intermediate'
        }
      );
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const checkComprehension = async () => {
    if (!user || !lectureContent) return;
    
    await instructorOperation.execute(async () => {
      const result = await AgentOrchestrator.callInstructorAgent(
        user.id,
        'CHECK_COMPREHENSION',
        { 
          lectureContent: lectureContent.lecture_content,
          keyConcepts: lectureContent.key_concepts,
          userAnswers 
        }
      );
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const preparePractice = async () => {
    if (!user || !comprehensionData) return;
    
    await instructorOperation.execute(async () => {
      const result = await AgentOrchestrator.callInstructorAgent(
        user.id,
        'MODIFY_PRACTICE_PROMPTS',
        { 
          comprehensionResults: {
            questions: comprehensionData.questions,
            userAnswers,
            overallUnderstanding: comprehensionData.user_understanding
          }
        }
      );
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const startPractice = (mode: 'ta' | 'socratic') => {
    // Navigate to practice mode with modified prompts
    const practiceData = {
      mode,
      modifiedPrompts: modifiedPrompts?.[mode === 'ta' ? 'ta_prompt' : 'socratic_prompt']
    };
    
    // Store in context or navigate to practice component
    console.log('Starting practice with:', practiceData);
    toast.success(`Starting ${mode === 'ta' ? 'TA' : 'Socratic'} practice session!`);
  };

  const resetSession = () => {
    setCurrentPhase('lecture');
    setLectureContent(null);
    setComprehensionData(null);
    setUserAnswers({});
    setModifiedPrompts(null);
  };

  const phases = [
    { id: 'lecture', label: 'Lecture', icon: BookOpen, color: 'blue' },
    { id: 'comprehension', label: 'Comprehension', icon: CheckCircle, color: 'green' },
    { id: 'practice_preparation', label: 'Practice Prep', icon: Play, color: 'purple' },
    { id: 'practice', label: 'Practice', icon: Target, color: 'orange' }
  ];

  const getCurrentPhaseIndex = () => phases.findIndex(p => p.id === currentPhase);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Instructor-Led Learning Session
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {currentWeek?.topic || 'Machine Learning Fundamentals'} - Week {currentWeek?.week_number || 1}
          </p>
        </div>

        {/* Phase Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const isActive = currentPhase === phase.id;
            const isCompleted = index < getCurrentPhaseIndex();
            
            return (
              <div key={phase.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${
                  isActive ? 'bg-black text-white dark:bg-white dark:text-black border-slate-300 dark:border-slate-700' : 
                  isCompleted ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-black border-transparent' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-transparent'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`ml-3 text-sm font-medium capitalize ${
                  isActive ? 'text-black dark:text-white' : 
                  isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {phase.label}
                </span>
                {index < phases.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Ring */}
        <div className="flex justify-center mb-8">
          <ProgressRing 
            progress={(getCurrentPhaseIndex() + 1) / phases.length * 100}
            size={80}
            strokeWidth={6}
            className="text-black dark:text-white"
          />
        </div>

        {/* Lecture Phase */}
        <AnimatePresence>
          {currentPhase === 'lecture' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
                <div className="flex items-center space-x-3 mb-6">
                  <BookOpen className="w-8 h-8" />
                  <h2 className="text-2xl font-semibold">Daily Lecture</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
                  Your instructor will deliver today's lesson on {currentWeek?.topic || 'Machine Learning'}. 
                  This interactive lecture will cover key concepts and prepare you for hands-on practice.
                </p>
                <div className="p-4 rounded-lg mb-6 border border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold mb-2">What to Expect:</h3>
                  <ul className="text-slate-700 dark:text-slate-300 space-y-1">
                    <li>• Structured content delivery with key concepts</li>
                    <li>• Interactive comprehension check</li>
                    <li>• Personalized practice session preparation</li>
                    <li>• Choose between TA (coding) or Socratic (questioning) practice</li>
                  </ul>
                </div>
                <Button 
                  onClick={startLecture}
                  disabled={instructorOperation.loading}
                  className="w-full h-12 text-lg"
                >
                  {instructorOperation.loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Preparing Lecture...</span>
                    </div>
                  ) : (
                    'Start Lecture'
                  )}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comprehension Check Phase */}
        <AnimatePresence>
          {currentPhase === 'comprehension' && lectureContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
                <div className="flex items-center space-x-3 mb-6">
                  <CheckCircle className="w-8 h-8" />
                  <h2 className="text-2xl font-semibold">Comprehension Check</h2>
                </div>
                
                {/* Lecture Summary */}
                <div className="p-4 rounded-lg mb-6 border border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold mb-2">Lecture Summary:</h3>
                  <p className="text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-line">{lectureContent.lecture_content}</p>
                  <div className="flex flex-wrap gap-2">
                    {lectureContent.key_concepts.map((concept, index) => (
                      <Badge key={index} variant="outline">{concept}</Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Answer these questions to check your understanding:</h3>
                  {(comprehensionData?.questions?.length ? comprehensionData.questions : [
                    { id: 'q1', question: 'What is the difference between supervised and unsupervised learning?' },
                    { id: 'q2', question: 'Explain the concept of model training and validation.' },
                    { id: 'q3', question: 'How would you apply these concepts in a real-world scenario?' }
                  ]).map((question, index) => (
                    <div key={question.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Question {index + 1}: {question.question}
                      </label>
                      <textarea
                        value={userAnswers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                        placeholder="Your answer..."
                      />
                    </div>
                  ))}
                </div>
                
                {comprehensionData ? (
                  <Button 
                    onClick={() => setCurrentPhase('practice_preparation')}
                    disabled={instructorOperation.loading}
                    className="w-full h-12 text-lg mt-8"
                  >
                    Continue to Practice Prep
                  </Button>
                ) : (
                  <Button 
                    onClick={checkComprehension}
                    disabled={instructorOperation.loading || Object.keys(userAnswers).length === 0}
                    className="w-full h-12 text-lg mt-8"
                  >
                    {instructorOperation.loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Checking Comprehension...</span>
                      </div>
                    ) : (
                      'Check Understanding'
                    )}
                  </Button>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Practice Preparation Phase */}
        <AnimatePresence>
          {currentPhase === 'practice_preparation' && comprehensionData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
                <div className="flex items-center space-x-3 mb-6">
                  <Play className="w-8 h-8" />
                  <h2 className="text-2xl font-semibold">Ready for Practice</h2>
                </div>
                
                <div className="p-4 rounded-lg mb-6 border border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold mb-2">Understanding Assessment:</h3>
                  <p className="text-slate-700 dark:text-slate-300">
                    Your instructor has analyzed your responses and is preparing tailored practice sessions 
                    based on your comprehension level: <strong>{comprehensionData.user_understanding}</strong>
                  </p>
                </div>

                <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
                  Based on your understanding, your instructor will now prepare personalized practice sessions 
                  that focus on areas where you need reinforcement while building on your strengths.
                </p>
                
                <Button 
                  onClick={preparePractice}
                  disabled={instructorOperation.loading}
                  className="w-full h-12 text-lg"
                >
                  {instructorOperation.loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Preparing Practice Sessions...</span>
                    </div>
                  ) : (
                    'Prepare Practice Sessions'
                  )}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Practice Selection Phase */}
        <AnimatePresence>
          {currentPhase === 'practice' && modifiedPrompts && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
                <div className="flex items-center space-x-3 mb-6">
                  <Target className="w-8 h-8" />
                  <h2 className="text-2xl font-semibold">Choose Practice Mode</h2>
                </div>
                
                <div className="p-4 rounded-lg mb-6 border border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold mb-2">Practice Focus Areas:</h3>
                  <div className="flex flex-wrap gap-2">
                    {modifiedPrompts.practice_focus.map((focus, index) => (
                      <Badge key={index} variant="outline">
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                  Select how you'd like to practice what you've learned. Both modes have been tailored 
                  based on your comprehension assessment.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button 
                    onClick={() => startPractice('ta')}
                    className="h-24 flex flex-col items-center justify-center space-y-3 border border-slate-200 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <Code className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-semibold text-lg">TA Practice</div>
                      <div className="text-sm opacity-90">Hands-on Coding & Implementation</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => startPractice('socratic')}
                    className="h-24 flex flex-col items-center justify-center space-y-3 border border-slate-200 dark:border-slate-800 hover:bg-black/5 dark:hover:bg:white/5 transition-colors"
                  >
                    <MessageSquare className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-semibold text-lg">Socratic Practice</div>
                      <div className="text-sm opacity-90">Question-Based Deep Learning</div>
                    </div>
                  </Button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    onClick={resetSession}
                    variant="outline"
                    className="w-full"
                  >
                    Start New Session
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
