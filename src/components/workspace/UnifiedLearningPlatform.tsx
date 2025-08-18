import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  MessageSquare, 
  Users, 
  Target, 
  Sparkles, 
  Send, 
  Mic, 
  Paperclip, 
  Settings,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Brain,
  Lightbulb,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  FileText,
  Eye,
  EyeOff,
  ArrowRight,
  Calendar,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useVoiceIntegration } from '../../hooks/useVoiceIntegration';
import { useSubscription } from '../../hooks/useSubscription';
import { FeatureGate } from '../dashboard/SubscriptionBadge';
import { AgentOrchestrator } from '../../lib/agents';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { CollapsibleMarkdown, LearningObjectives, KeyConcepts, Resources } from '../ui/CollapsibleMarkdown';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'agent';
  agentId?: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface LearningPlan {
  id: string;
  title: string;
  summary: string;
  fullContent: any;
  estimatedDuration: number;
  learningObjectives: string[];
  keyConcepts: string[];
  resources: any[];
  assessmentCriteria: string[];
  isApproved: boolean;
}

interface DailyLesson {
  id: string;
  title: string;
  objectives: string[];
  content: string;
  exercises: string[];
  estimatedDuration: number;
  dayNumber: number;
}

interface PracticeSession {
  type: 'socratic' | 'ta';
  isCompleted: boolean;
  completionCriteria: string;
}

type LearningPhase = 'onboarding' | 'clo' | 'instructor' | 'practice' | 'complete';

export const UnifiedLearningPlatform: React.FC = () => {
  const { user, currentWeek } = useDatabase();
  const { hasFeature, isPaid } = useSubscription();
  const [currentPhase, setCurrentPhase] = useState<LearningPhase>('onboarding');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [dailyLesson, setDailyLesson] = useState<DailyLesson | null>(null);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([
    { type: 'socratic', isCompleted: false, completionCriteria: 'Demonstrate level 5 understanding' },
    { type: 'ta', isCompleted: false, completionCriteria: 'Complete lesson exercises' }
  ]);
  const [userTrack, setUserTrack] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const voice = useVoiceIntegration({
    autoPlay: true,
    voice: user?.voice_preference || 'alloy',
    onTranscriptReady: (transcript) => {
      setInputValue(transcript);
    }
  });

  // Initialize and check user status
  useEffect(() => {
    if (user) {
      // Check if user has a selected track
      const checkUserTrack = async () => {
        try {
          // This would check the user's profile for selected track
          // For now, we'll simulate this check using existing user properties
          if (user.learning_preferences?.focus_areas && user.learning_preferences.focus_areas.length > 0) {
            setUserTrack(user.learning_preferences.focus_areas[0]);
            // Check if onboarding is complete (simulate based on user creation date)
            const userCreated = new Date(user.created_at);
            const daysSinceCreation = (Date.now() - userCreated.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSinceCreation > 1) {
              setCurrentPhase('instructor');
              await loadDailyLesson();
            } else {
              setCurrentPhase('onboarding');
              const welcomeMessage: Message = {
                id: 'welcome',
                type: 'agent',
                agentId: 'onboard',
                content: `Welcome to your unified learning journey, ${user.name || 'Learner'}! I'm here to guide you through a personalized learning experience. Let's start by understanding your goals and creating a tailored plan.`,
                timestamp: new Date()
              };
              setMessages([welcomeMessage]);
            }
          } else {
            // No track selected - show track selection
            setCurrentPhase('onboarding');
            const welcomeMessage: Message = {
              id: 'welcome',
              type: 'agent',
              agentId: 'onboard',
              content: `Welcome to your unified learning journey, ${user.name || 'Learner'}! First, let's select a learning track that matches your goals.`,
              timestamp: new Date()
            };
            setMessages([welcomeMessage]);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          setCurrentPhase('onboarding');
        }
      };
      
      checkUserTrack();
    }
  }, [user]);

  const addMessage = (content: string, agentId: string, isUser: boolean = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: isUser ? 'user' : 'agent',
      agentId,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const loadDailyLesson = async () => {
    if (!user || !userTrack) return;
    
    try {
      setIsLoading(true);
      
      // Try to use the AgentOrchestrator first
      try {
        const currentWeekNumber = Math.ceil(
          (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        
        const result = await AgentOrchestrator.callCLOAgent(
          user.id,
          'GET_DAILY_LESSON',
          currentWeekNumber
        );
        
        if (result.success && result.data) {
          const lesson: DailyLesson = {
            id: result.data.lesson_id || 'lesson-1',
            title: result.data.title || 'Daily Learning Session',
            objectives: result.data.objectives || ['Complete daily objectives'],
            content: result.data.content || 'Daily lesson content will appear here.',
            exercises: result.data.exercises || ['Practice exercises'],
            estimatedDuration: result.data.duration || 60,
            dayNumber: result.data.day_number || 1
          };
          setDailyLesson(lesson);
          return;
        }
      } catch (orchestratorError) {
        console.log('Orchestrator not ready, using mock data:', orchestratorError);
      }
      
      // Fallback to mock data if orchestrator fails
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      const lesson: DailyLesson = {
        id: 'lesson-1',
        title: 'Introduction to Machine Learning Fundamentals',
        objectives: [
          'Understand basic ML concepts and terminology',
          'Learn about supervised vs unsupervised learning',
          'Complete hands-on exercises with sample data'
        ],
        content: 'Today we\'ll explore the foundational concepts of machine learning. We\'ll start with understanding what machine learning is, how it differs from traditional programming, and the different types of learning approaches.',
        exercises: [
          'Complete the ML terminology quiz',
          'Practice with the sample dataset exercise',
          'Build a simple linear regression model'
        ],
        estimatedDuration: 60,
        dayNumber: 1
      };
      setDailyLesson(lesson);
    } catch (error) {
      console.error('Error loading daily lesson:', error);
      toast.error('Failed to load daily lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeeklyPlan = async () => {
    if (!user || !userTrack) return;
    
    try {
      setIsLoading(true);
      
      // Try to use the AgentOrchestrator first
      try {
        const currentWeekNumber = Math.ceil(
          (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        
        const result = await AgentOrchestrator.callCLOAgent(
          user.id,
          'GET_WEEKLY_PLAN',
          currentWeekNumber
        );
        
        if (result.success && result.data) {
          const plan: LearningPlan = {
            id: result.data.plan_id || 'plan-1',
            title: result.data.title || 'Weekly Learning Plan',
            summary: result.data.description || 'Weekly learning objectives and content.',
            fullContent: result.data,
            estimatedDuration: result.data.estimated_duration || 540,
            learningObjectives: result.data.objectives || ['Complete weekly objectives'],
            keyConcepts: result.data.key_concepts || ['Key concepts'],
            resources: result.data.resources || [{ type: 'Course', title: 'Learning Materials', url: '#', description: 'Course materials' }],
            assessmentCriteria: ['Complete all objectives', 'Demonstrate understanding'],
            isApproved: true
          };
          setLearningPlan(plan);
          return;
        }
      } catch (orchestratorError) {
        console.log('Orchestrator not ready, using mock data:', orchestratorError);
      }
      
      // Fallback to mock data if orchestrator fails
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      const plan: LearningPlan = {
        id: 'plan-1',
        title: 'Machine Learning Fundamentals Week 1',
        summary: 'A comprehensive introduction to ML concepts, algorithms, and practical applications.',
        fullContent: {},
        estimatedDuration: 540,
        learningObjectives: [
          'Master fundamental ML concepts and terminology',
          'Implement basic supervised learning algorithms',
          'Complete a practical ML project from start to finish'
        ],
        keyConcepts: [
          'Machine Learning vs Traditional Programming',
          'Supervised vs Unsupervised Learning',
          'Model Training and Validation',
          'Feature Engineering and Selection'
        ],
        resources: [
          { type: 'Course', title: 'ML Fundamentals', url: '#', description: 'Comprehensive online course' },
          { type: 'Book', title: 'Hands-On ML', url: '#', description: 'Practical ML guidebook' },
          { type: 'Tool', title: 'Jupyter Notebooks', url: '#', description: 'Interactive development environment' }],
        assessmentCriteria: [
          'Complete all module exercises with 80%+ accuracy',
          'Successfully implement and deploy ML model',
          'Demonstrate understanding through project presentation'
        ],
        isApproved: true
      };
      setLearningPlan(plan);
    } catch (error) {
      console.error('Error loading weekly plan:', error);
      toast.error('Failed to load weekly plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

    const userMessage = inputValue;
    addMessage(userMessage, currentPhase, true);
    setInputValue('');
    setIsLoading(true);

    try {
      let response;
      
      switch (currentPhase) {
        case 'onboarding':
          response = await handleOnboardingMessage(userMessage);
          break;
        case 'clo':
          response = await handleCLOMessage(userMessage);
          break;
        case 'instructor':
          response = await handleInstructorMessage(userMessage);
          break;
        case 'practice':
          response = await handlePracticeMessage(userMessage);
          break;
        default:
          response = 'I\'m not sure how to help with that. Let me guide you to the right phase.';
      }

      addMessage(response, currentPhase);
      
      // Auto-synthesize voice response if enabled
      if (voice.hasVoiceSupport && hasFeature('voice_synthesis')) {
        await voice.synthesizeAndPlay(response);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('I encountered an error processing your request. Please try again.', currentPhase);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingMessage = async (message: string): Promise<string> => {
    if (!user) return 'Please sign in to continue.';
    
    try {
      // Use AgentOrchestrator for onboarding
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      if (message.toLowerCase().includes('goal') || message.toLowerCase().includes('objective')) {
        addMessage('Great! I can see you\'re focused on your learning goals. Let me ask a few key questions to understand your current skill level and desired outcomes.', 'onboard');
        
        // Use orchestrator to get personalized onboarding guidance
        const result = await AgentOrchestrator.callCLOAgent(
          user.id,
          `ONBOARDING_GOALS: ${message}`,
          currentWeekNumber
        );
        
        if (result.success) {
          setTimeout(() => {
            addMessage('What specific skills or knowledge areas would you like to develop? For example: "I want to learn machine learning" or "I need to improve my web development skills".', 'onboard');
          }, 1000);
          return 'I\'m gathering information about your learning objectives. Please share more details about what you want to achieve.';
        }
      }
      
      if (message.toLowerCase().includes('experience') || message.toLowerCase().includes('level')) {
        addMessage('Perfect! Now I have a good understanding of your background. Let me transition you to our Curriculum Learning Officer (CLO) who will create a personalized learning plan.', 'onboard');
        
        // Use orchestrator to finalize onboarding and prepare CLO transition
        const result = await AgentOrchestrator.callCLOAgent(
          user.id,
          `ONBOARDING_COMPLETE: ${message}`,
          currentWeekNumber
        );
        
        if (result.success) {
          setTimeout(() => {
            setCurrentPhase('clo');
            addMessage('Welcome! I\'m your CLO - Curriculum Learning Officer. I\'ll create a personalized learning plan based on your goals and experience level. Let me start by setting up your learning parameters.', 'clo');
          }, 2000);
          
          return 'Onboarding complete! Transitioning you to the CLO for personalized plan creation.';
        }
      }
      
      return 'I\'m here to understand your learning goals and experience level. Could you tell me more about what you want to achieve and your current skill level?';
    } catch (error) {
      console.error('Onboarding error:', error);
      return 'I encountered an error during onboarding. Please try again.';
    }
  };

  const handleCLOMessage = async (message: string): Promise<string> => {
    if (!user) return 'Please sign in to continue.';
    
    try {
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      // Initial CLO setup using orchestrator
      addMessage('I\'ll create a personalized learning plan for you. Here are the recommended learning parameters:', 'clo');
      
      // Use orchestrator to get learning parameters
      const result = await AgentOrchestrator.callCLOAgent(
        user.id,
        'GET_LEARNING_PARAMS',
        currentWeekNumber
      );
      
      if (result.success) {
        setTimeout(() => {
          addMessage('• Time investment: 15-20 hours per week\n• Theory 30%, Practice 40%, Project 30%\n• Budget guidance: Optional paid resources ≤ $75\n\nDo you agree with these parameters?', 'clo');
        }, 1000);
        
        return 'Setting up your learning parameters. Please review and confirm.';
      }
      
      if (message.toLowerCase().includes('agree') || message.toLowerCase().includes('yes') || message.toLowerCase().includes('confirm')) {
        addMessage('Excellent! Now I\'ll generate your personalized learning plan. This will include specific modules, resources, and assessment criteria tailored to your goals.', 'clo');
        
        // Use orchestrator to generate the actual learning plan
        const result = await AgentOrchestrator.callCLOAgent(
          user.id,
          'GENERATE_LEARNING_PLAN',
          currentWeekNumber
        );
        
        if (result.success && result.data) {
          // Transform orchestrator response to our LearningPlan format
          const plan: LearningPlan = {
            id: 'plan-1',
            title: result.data.module_title || 'Machine Learning Fundamentals',
            summary: result.data.learning_summary || 'A comprehensive introduction to ML concepts, algorithms, and practical applications.',
            fullContent: result.data,
            estimatedDuration: result.data.estimated_duration || 540,
            learningObjectives: result.data.learning_objectives || [
              'Master fundamental ML concepts and terminology',
              'Implement basic supervised learning algorithms',
              'Complete a practical ML project from start to finish'
            ],
            keyConcepts: result.data.key_concepts || [
              'Machine Learning vs Traditional Programming',
              'Supervised vs Unsupervised Learning',
              'Model Training and Validation',
              'Feature Engineering and Selection'
            ],
            resources: result.data.resources || [
              { type: 'Course', title: 'ML Fundamentals', url: '#', description: 'Comprehensive online course' },
              { type: 'Book', title: 'Hands-On ML', url: '#', description: 'Practical ML guidebook' },
              { type: 'Tool', title: 'Jupyter Notebooks', url: '#', description: 'Interactive development environment' }
            ],
            assessmentCriteria: result.data.assessment_criteria || [
              'Complete all module exercises with 80%+ accuracy',
              'Successfully implement and deploy ML model',
              'Demonstrate understanding through project presentation'
            ],
            isApproved: false
          };
          
          setLearningPlan(plan);
          addMessage('Your learning plan is ready! Here\'s a summary of what we\'ll cover:', 'clo');
          return 'Generating your personalized learning plan. This will take a moment...';
        }
      }
      
      return 'Please confirm that you agree with the learning parameters so I can create your personalized plan.';
    } catch (error) {
      console.error('CLO error:', error);
      return 'I encountered an error while creating your learning plan. Please try again.';
    }
  };

  const handleInstructorMessage = async (message: string): Promise<string> => {
    if (!learningPlan) {
      return 'Please complete your learning plan first before proceeding to instruction.';
    }
    
    if (message.toLowerCase().includes('start') || message.toLowerCase().includes('begin') || message.toLowerCase().includes('ready')) {
      addMessage('Perfect! I\'m now your Learning Instructor. I\'ll guide you through each module step by step. You can switch between Socratic Practice and Teaching Assistant modes using the tabs below.', 'instructor');
      
      setTimeout(() => {
        addMessage('Let\'s begin with Module 1: Introduction to ML. I\'ll explain the key concepts and then we can practice through questioning or get hands-on guidance.', 'instructor');
      }, 1000);
      
      setCurrentSession('module-1');
      return 'Starting your learning session. You\'re now in Learning Instructor mode!';
    }
    
    return 'I\'m your Learning Instructor, ready to guide you through your personalized learning plan. Say "start" or "begin" when you\'re ready to begin the first module.';
  };

  const handlePracticeMessage = async (message: string): Promise<string> => {
    if (!user || !currentSession) {
      return 'Please start a learning session first before engaging in practice.';
    }
    
    try {
      // Check if user is in Socratic or TA mode
      const currentPractice = practiceSessions.find(p => !p.isCompleted);
      
      if (!currentPractice) {
        // All practice sessions completed
        setCurrentPhase('instructor');
        return 'Excellent! You\'ve completed all practice sessions. Let\'s return to your daily lesson.';
      }
      
      if (currentPractice.type === 'socratic') {
        // Use orchestrator for Socratic questioning
        const result = await AgentOrchestrator.callSocraticAgent(
          user.id,
          currentSession,
          message,
          messages.map(m => `${m.type}: ${m.content}`)
        );
        
        if (result.success && result.data) {
          // Check if user demonstrates level 5 understanding
          if (result.data.mastery_level >= 5) {
            // Mark Socratic as completed
            setPracticeSessions(prev => 
              prev.map(p => 
                p.type === 'socratic' 
                  ? { ...p, isCompleted: true }
                  : p
              )
            );
            return 'Outstanding! You\'ve demonstrated level 5 understanding. Socratic practice complete.';
          }
          
          // Auto-synthesize voice response for Socratic questions
          if (voice.hasVoiceSupport && hasFeature('voice_synthesis')) {
            await voice.synthesizeAndPlay(result.data.question);
          }
          
          return result.data.question || 'That\'s an interesting perspective. What makes you think that approach would work best?';
        }
      } else {
        // TA mode - get help with exercises
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ta-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'HELP_WITH_EXERCISE',
            payload: { 
              message,
              exerciseId: 'daily-exercise',
              lessonTitle: dailyLesson?.title || 'Daily Lesson'
            },
            userId: user.id
          })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          // Check if lesson is complete
          if (message.toLowerCase().includes('complete') || message.toLowerCase().includes('done') || message.toLowerCase().includes('finished')) {
            // Mark TA as completed
            setPracticeSessions(prev => 
              prev.map(p => 
                p.type === 'ta' 
                  ? { ...p, isCompleted: true }
                  : p
              )
            );
            return 'Great! TA lesson completed successfully.';
          }
          
          // Auto-synthesize voice response for TA guidance
          if (voice.hasVoiceSupport && hasFeature('voice_synthesis')) {
            await voice.synthesizeAndPlay(result.data.help_text);
          }
          
          return result.data.help_text;
        }
        
        return 'Please complete the lesson exercises. Type "complete" when you\'re done.';
      }
      
      return 'I\'m here to help with your practice. What would you like to work on?';
    } catch (error) {
      console.error('Practice error:', error);
      return 'I encountered an error during practice. Please try again.';
    }
  };

  const approveLearningPlan = async () => {
    if (!learningPlan) return;
    
    try {
      // Mark plan as approved
      setLearningPlan(prev => prev ? { ...prev, isApproved: true } : null);
      
      // Transition to instructor phase
      setCurrentPhase('instructor');
      
      // Load daily lesson
      await loadDailyLesson();
      
      addMessage('Excellent! Your learning plan has been approved. Now let\'s begin your daily instruction.', 'instructor');
      
      return 'Plan approved! Transitioning to daily instruction.';
    } catch (error) {
      console.error('Error approving plan:', error);
      return 'I encountered an error approving your plan. Please try again.';
    }
  };

  const startPracticeSession = (type: 'socratic' | 'ta') => {
    setCurrentPhase('practice');
    setCurrentSession(`practice-${type}-${Date.now()}`);
    
    if (type === 'socratic') {
      addMessage('Great! Let\'s begin Socratic practice. I\'ll ask you questions to help you think deeper about the concepts. Demonstrate your understanding and I\'ll guide you to level 5 mastery.', 'practice');
      // Start Socratic session with initial question
      handleSocraticStart();
    } else {
      addMessage('Excellent! Let\'s begin Teaching Assistant practice. I\'ll provide hands-on guidance and exercises. Complete the lesson and type "complete" when you\'re done.', 'practice');
      // Start TA session with initial guidance
      handleTAStart();
    }
  };

  const handleSocraticStart = async () => {
    try {
      const response = await AgentOrchestrator.callSocraticAgent(
        user!.id,
        'socratic-session',
        'START_SESSION',
        [],
        { topic: dailyLesson?.title || 'Machine Learning Fundamentals' }
      );
      
      if (response.success && response.data) {
        addMessage(response.data.question, 'practice');
        // Auto-synthesize voice response for Socratic
        if (voice.hasVoiceSupport && hasFeature('voice_synthesis')) {
          await voice.synthesizeAndPlay(response.data.question);
        }
      }
    } catch (error) {
      console.error('Error starting Socratic session:', error);
      addMessage('I encountered an error starting the Socratic session. Let me provide a question to get us started: What is the fundamental difference between machine learning and traditional programming?', 'practice');
    }
  };

  const handleTAStart = async () => {
    try {
      // Call TA agent for initial guidance
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ta-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'HELP_WITH_EXERCISE',
          payload: { 
            exerciseId: 'daily-exercise',
            lessonTitle: dailyLesson?.title || 'Daily Lesson'
          },
          userId: user!.id
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        addMessage(result.data.help_text, 'practice');
        // Auto-synthesize voice response for TA
        if (voice.hasVoiceSupport && hasFeature('voice_synthesis')) {
          await voice.synthesizeAndPlay(result.data.help_text);
        }
      }
    } catch (error) {
      console.error('Error starting TA session:', error);
      addMessage('Welcome to Teaching Assistant practice! I\'m here to help you with today\'s exercises. What would you like to work on first?', 'practice');
    }
  }

  const goToNextDay = async () => {
    try {
      // Reset practice sessions for new day
      setPracticeSessions([
        { type: 'socratic', isCompleted: false, completionCriteria: 'Demonstrate level 5 understanding' },
        { type: 'ta', isCompleted: false, completionCriteria: 'Complete lesson exercises' }
      ]);
      
      // Load next day's lesson
      await loadDailyLesson();
      
      setCurrentPhase('instructor');
      addMessage('Welcome to your new day of learning! Here\'s your daily lesson plan.', 'instructor');
      
      return 'Moving to next day!';
    } catch (error) {
      console.error('Error moving to next day:', error);
      return 'I encountered an error moving to the next day. Please try again.';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-800/30 to-slate-900/20" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-slate-500/10" />
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-radial from-blue-400/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-gradient-radial from-slate-400/20 to-transparent rounded-full blur-3xl" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <motion.div 
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-medium text-white mb-4">
              Unified Learning Platform
            </h1>
            <p className="text-xl text-blue-200/80 max-w-3xl mx-auto">
              Your personalized learning journey with AI-powered guidance
            </p>
          </motion.div>

          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto">
            {/* Phase-based content rendering */}
            {currentPhase === 'onboarding' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-6 bg-white/5 border-white/20">
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    Learning Onboarding
                  </h2>
                  <div className="space-y-4">
                    {/* Messages */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-500/20 border border-blue-500/30 ml-8'
                              : 'bg-white/10 border border-white/20 mr-8'
                          }`}
                        >
                          <p className="text-blue-200/90">{message.content}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Input */}
                    <div className="flex space-x-3">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Tell us about your learning goals..."
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        {isLoading ? 'Thinking...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {currentPhase === 'clo' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-6 bg-white/5 border-white/20">
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    Curriculum Learning Officer
                  </h2>
                  
                  {learningPlan ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white">
                          Your Learning Plan: {learningPlan.title}
                        </h3>
                        <Button
                          onClick={() => setShowFullPlan(!showFullPlan)}
                          variant="ghost"
                          className="text-blue-200/70 hover:text-white"
                        >
                          {showFullPlan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showFullPlan ? 'Show Summary' : 'Show Full Plan'}
                        </Button>
                      </div>
                      
                      {showFullPlan ? (
                        <div className="space-y-4">
                          <LearningObjectives objectives={learningPlan.learningObjectives} />
                          <KeyConcepts concepts={learningPlan.keyConcepts} />
                          <Resources resources={learningPlan.resources} />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-blue-200/90">{learningPlan.summary}</p>
                          
                          {/* Weekly Summary */}
                          {learningPlan.fullContent?.weekly_summary && (
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                              <h4 className="text-lg font-semibold text-white mb-2">Weekly Overview</h4>
                              <p className="text-blue-200/90 mb-3">{learningPlan.fullContent.weekly_summary}</p>
                              
                              {/* Daily Breakdown */}
                              {learningPlan.fullContent.daily_breakdown && (
                                <div className="space-y-2">
                                  <h5 className="text-md font-medium text-white">Daily Breakdown:</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {learningPlan.fullContent.daily_breakdown.map((day: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between bg-white/5 rounded p-2">
                                        <span className="text-blue-200/90">Day {day.day}: {day.focus}</span>
                                        <span className="text-blue-200/70 text-sm">{day.duration}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-blue-200/70">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {Math.round(learningPlan.estimatedDuration / 60)} hours
                            </span>
                            <span className="flex items-center">
                              <Target className="w-4 h-4 mr-2" />
                              {learningPlan.learningObjectives.length} objectives
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {!learningPlan.isApproved && (
                        <Button
                          onClick={approveLearningPlan}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                          Approve & Start Learning
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {messages.filter(m => m.agentId === 'clo').map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-blue-500/20 border border-blue-500/30 ml-8'
                                : 'bg-white/10 border border-white/20 mr-8'
                            }`}
                          >
                            <p className="text-blue-200/90">{message.content}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-3">
                        <Input
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask CLO anything..."
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={isLoading || !inputValue.trim()}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        >
                          {isLoading ? 'Thinking...' : 'Send'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {currentPhase === 'instructor' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-6 bg-white/5 border-white/20">
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    Learning Instructor
                  </h2>
                  
                  {dailyLesson ? (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Day {dailyLesson.dayNumber}: {dailyLesson.title}
                        </h3>
                        <p className="text-blue-200/70">
                          Estimated duration: {Math.round(dailyLesson.estimatedDuration / 60)} minutes
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">Today's Objectives</h4>
                          <ul className="space-y-2">
                            {dailyLesson.objectives.map((objective, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-blue-200/90">{objective}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">Lesson Content</h4>
                          <p className="text-blue-200/90 leading-relaxed">{dailyLesson.content}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">Practice Exercises</h4>
                          <ul className="space-y-2">
                            {dailyLesson.exercises.map((exercise, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <Target className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span className="text-blue-200/90">{exercise}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Practice Choice */}
                      <div className="border-t border-white/20 pt-6">
                        <h4 className="text-lg font-semibold text-white mb-4 text-center">
                          Choose Your Practice Mode
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button
                            onClick={() => startPracticeSession('socratic')}
                            disabled={practiceSessions.find(p => p.type === 'socratic')?.isCompleted}
                            className={`h-20 text-lg font-semibold ${
                              practiceSessions.find(p => p.type === 'socratic')?.isCompleted
                                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
                            }`}
                          >
                            <div className="text-center">
                              <Brain className="w-8 h-8 mx-auto mb-2" />
                              <div>Socratic Practice</div>
                              <div className="text-sm opacity-80">
                                {practiceSessions.find(p => p.type === 'socratic')?.isCompleted ? 'Completed' : 'Deep questioning'}
                              </div>
                            </div>
                          </Button>
                          
                          <Button
                            onClick={() => startPracticeSession('ta')}
                            disabled={practiceSessions.find(p => p.type === 'ta')?.isCompleted}
                            className={`h-20 text-lg font-semibold ${
                              practiceSessions.find(p => p.type === 'ta')?.isCompleted
                                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                            }`}
                          >
                            <div className="text-center">
                              <Target className="w-8 h-8 mx-auto mb-2" />
                              <div>Teaching Assistant</div>
                              <div className="text-sm opacity-80">
                                {practiceSessions.find(p => p.type === 'ta')?.isCompleted ? 'Completed' : 'Hands-on guidance'}
                              </div>
                            </div>
                          </Button>
                        </div>
                        
                        {/* Next Day Button */}
                        {practiceSessions.every(p => p.isCompleted) && (
                          <div className="text-center mt-6">
                            <Button
                              onClick={goToNextDay}
                              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-8"
                            >
                              <Calendar className="w-5 h-5 mr-2" />
                              Go to Next Day
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <p className="text-blue-200/70">Loading your daily lesson...</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {currentPhase === 'practice' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-6 bg-white/5 border-white/20">
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    {practiceSessions.find(p => !p.isCompleted)?.type === 'socratic' ? 'Socratic Practice' : 'Teaching Assistant'}
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Messages */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {messages.filter(m => m.agentId === 'practice').map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-500/20 border border-blue-500/30 ml-8'
                              : 'bg-white/10 border border-white/20 mr-8'
                          }`}
                        >
                          <p className="text-blue-200/90">{message.content}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Input */}
                    <div className="flex space-x-3">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Ask ${practiceSessions.find(p => !p.isCompleted)?.type === 'socratic' ? 'Socratic' : 'TA'} anything...`}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        {isLoading ? 'Thinking...' : 'Send'}
                      </Button>
                    </div>
                    
                    {/* Back to Lesson Button */}
                    <div className="text-center">
                      <Button
                        onClick={() => setCurrentPhase('instructor')}
                        variant="ghost"
                        className="text-blue-200/70 hover:text-white"
                      >
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                        Back to Lesson
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
