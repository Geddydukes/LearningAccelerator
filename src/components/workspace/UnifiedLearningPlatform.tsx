import React, { useState, useEffect, useRef } from 'react';
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

type LearningPhase = 'clo' | 'instructor' | 'practice' | 'complete';

export const UnifiedLearningPlatform: React.FC = () => {
  // console.log('🚀 UnifiedLearningPlatform component rendered'); // Reduced logging
  
  const { user, currentWeek } = useDatabase();
  const { hasFeature, isPaid } = useSubscription();
  const [currentPhase, setCurrentPhase] = useState<LearningPhase>('clo');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [showFullPlan, setShowFullPlan] = useState(true);
  const [dailyLesson, setDailyLesson] = useState<DailyLesson | null>(null);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([
    { type: 'socratic', isCompleted: false, completionCriteria: 'Demonstrate level 5 understanding' },
    { type: 'ta', isCompleted: false, completionCriteria: 'Complete lesson exercises' }
  ]);
  const [userTrack, setUserTrack] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [lastLoadedWeek, setLastLoadedWeek] = useState<number | null>(null); // Track last loaded week instead of boolean flag
  
  // New state for agent coordination
  const [prerequisiteQuestions, setPrerequisiteQuestions] = useState<Array<{question: string, answer: string, score: number | null}>>([]);
  const [socraticInsight, setSocraticInsight] = useState<string | null>(null);
  const [dailyTasks, setDailyTasks] = useState<string[]>([]);
  const [socraticPrompts, setSocraticPrompts] = useState<string[]>([]);
  
  // View control state
  const [showSimpleView, setShowSimpleView] = useState(false);
  
  // Ref to prevent multiple simultaneous calls
  const isLoadingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const voice = useVoiceIntegration({
    autoPlay: true,
    voice: user?.voice_preference || 'alloy',
    onTranscriptReady: (transcript) => {
      setInputValue(transcript);
    }
  });

  // Initialize and check user status
  useEffect(() => {
    console.log('🔄 Main useEffect triggered:', { 
      user: !!user, 
      userTrack, 
      hasInitialized: hasInitializedRef.current,
      currentPhase,
      learningPlan: !!learningPlan,
      dailyLesson: !!dailyLesson
    });
    
    if (!user) {
      console.log('❌ No user, returning early');
      return;
    }
    
    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      console.log('⏭️ Already initialized, skipping');
      return;
    }
    
    hasInitializedRef.current = true;
    console.log('✅ Setting hasInitialized to true');
    
    const checkUserTrack = async () => {
      try {
        // Set user track first if not already set
        if (!userTrack && user.learning_preferences?.focus_areas && user.learning_preferences.focus_areas.length > 0) {
          const track = user.learning_preferences.focus_areas[0];
          console.log('🎯 Setting user track:', track);
          setUserTrack(track);
        } else if (!userTrack) {
          // Fallback: set a default track if none is specified
          console.log('⚠️ No learning preferences found, setting default track');
          setUserTrack('full-stack-development'); // Default track
        }
        
        // Check if we need to force a reset BEFORE trying to restore state
        const urlParams = new URLSearchParams(window.location.search);
        const forceReset = urlParams.get('reset');
        
        if (forceReset === 'true') {
          console.log('🔄 Force reset requested, clearing all state and starting fresh');
          // Clear all localStorage state
          localStorage.removeItem(`learningState_${user.id}`);
          localStorage.removeItem(`userTrack_${user.id}`);
          localStorage.removeItem(`currentWeek_${user.id}`);
          
          // Reset component state
          setCurrentPhase('clo');
          setLastLoadedWeek(null);
          setLearningPlan(null);
          setDailyLesson(null);
          setPrerequisiteQuestions([]);
          setSocraticInsight(null);
          setDailyTasks([]);
          setSocraticPrompts([]);
          
          // Remove the reset parameter from URL
          window.history.replaceState({}, '', '/home/workspace');
          
          // Force fresh initialization
          hasInitializedRef.current = false;
          
          // Skip all localStorage restoration and go straight to fresh load
          console.log('🔄 Reset complete, proceeding with fresh initialization');
          return;
        }
        
        // Only try to restore from localStorage if we're not resetting
        const savedState = loadLearningState();
        if (savedState) {
          console.log('📂 Restoring from saved state:', savedState);
          
          // Check if the saved state is for the current week
          const currentWeekNumber = Math.ceil(
            (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
          );
          
          if (savedState.lastLoadedWeek === currentWeekNumber) {
            console.log('✅ Saved state is for current week, restoring...');
            setCurrentPhase(savedState.currentPhase as any);
            setLastLoadedWeek(savedState.lastLoadedWeek);
            setLearningPlan(savedState.learningPlan);
            setDailyLesson(savedState.dailyLesson);
            
            console.log('✅ State restoration complete. Current phase:', savedState.currentPhase);
            return; // Successfully restored, no need to load from database
          } else {
            console.log('⚠️ Saved state is for different week, will load fresh data');
          }
        }
        
        // Calculate current week number for fresh loading
        const currentWeekNumber = Math.ceil(
          (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        
        // First check if we need to reset weekly progress
        await checkAndResetWeeklyProgress();
        
        console.log('📅 Week calculation:', { currentWeekNumber, lastLoadedWeek, shouldLoad: lastLoadedWeek !== currentWeekNumber });
        
        // Check if we already have a learning plan for this week
        if (learningPlan && lastLoadedWeek === currentWeekNumber) {
          console.log('✅ Already have learning plan for this week, restoring phase');
          // Restore the appropriate phase based on plan status
          if (learningPlan.isApproved) {
            setCurrentPhase('instructor');
          } else {
            setCurrentPhase('clo');
          }
          return;
        }
        
        // Check if we need to load data for a new week OR if we have no data
        const shouldLoad = lastLoadedWeek !== currentWeekNumber || (!learningPlan && !dailyLesson);
        
        if (shouldLoad) {
          console.log('🚀 Loading CLO data for week:', currentWeekNumber);
          
          // Load daily lesson which will set the learning plan
          await loadDailyLesson();
          
          // Set the loaded week after successful load
          setLastLoadedWeek(currentWeekNumber);
        } else {
          console.log('⏭️ Skipping CLO load - week already loaded:', currentWeekNumber);
        }
      } catch (error) {
        console.error('❌ Error in checkUserTrack:', error);
      }
    };
    
    checkUserTrack();
  }, [user, userTrack]); // Depend on both user and userTrack
  
  // Reset initialization ref when user changes
  useEffect(() => {
    hasInitializedRef.current = false;
  }, [user]);
  
  // Handle userTrack changes and trigger initialization
  useEffect(() => {
    if (user && userTrack && !hasInitializedRef.current) {
      console.log('🔄 User track available, triggering initialization');
      hasInitializedRef.current = false; // Reset to allow initialization
      // The main useEffect will handle the initialization
    }
  }, [user, userTrack]);

  // Auto-save learning state when it changes
  useEffect(() => {
    if (user && (learningPlan || dailyLesson || lastLoadedWeek)) {
      const stateToSave = {
        currentPhase,
        lastLoadedWeek,
        learningPlan,
        dailyLesson
      };
      saveLearningState(stateToSave);
    }
  }, [user, currentPhase, lastLoadedWeek, learningPlan, dailyLesson]);

  // Local storage helpers for persistence
  const saveLearningState = (state: {
    currentPhase: string;
    lastLoadedWeek: number | null;
    learningPlan: LearningPlan | null;
    dailyLesson: DailyLesson | null;
  }) => {
    if (user) {
      const key = `learning_state_${user.id}`;
      localStorage.setItem(key, JSON.stringify(state));
      console.log('💾 Learning state saved to localStorage:', state);
    }
  };

  const loadLearningState = () => {
    if (user) {
      const key = `learning_state_${user.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const state = JSON.parse(saved);
          console.log('📂 Learning state loaded from localStorage:', state);
          return state;
        } catch (error) {
          console.error('❌ Error parsing saved learning state:', error);
        }
      }
    }
    return null;
  };

  const clearLearningState = () => {
    if (user) {
      const key = `learning_state_${user.id}`;
      localStorage.removeItem(key);
      console.log('🗑️ Learning state cleared from localStorage');
    }
  };

  // New functions for agent coordination
  const submitPrerequisiteAnswer = async (questionIndex: number, answer: string) => {
    if (!user || !learningPlan) return;
    
    try {
      console.log('📝 Submitting prerequisite answer:', { questionIndex, answer });
      
      // Update local state
      const updatedQuestions = [...prerequisiteQuestions];
      updatedQuestions[questionIndex].answer = answer;
      setPrerequisiteQuestions(updatedQuestions);
      
      // Send to CLO agent for scoring
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      const result = await AgentOrchestrator.callCLOAgent(
        user.id,
        'SCORE_PREREQUISITE',
        currentWeekNumber,
        { questionIndex, answer, question: prerequisiteQuestions[questionIndex].question }
      );
      
      if (result.success && result.data?.score !== undefined) {
        // Update score
        updatedQuestions[questionIndex].score = result.data.score;
        setPrerequisiteQuestions([...updatedQuestions]);
        console.log('✅ Prerequisite scored:', result.data.score);
      }
    } catch (error) {
      console.error('❌ Error scoring prerequisite:', error);
    }
  };

  const submitAllPrerequisites = async () => {
    if (!user || !learningPlan) return;
    
    try {
      console.log('📝 Submitting all prerequisite answers for grading');
      
      // Check if all questions have answers
      const allAnswered = prerequisiteQuestions.every(q => q.answer && q.answer.trim());
      if (!allAnswered) {
        alert('Please answer all prerequisite questions before submitting.');
        return;
      }
      
      // Grade each question individually using the existing SCORE_PREREQUISITE command
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      let allGraded = true;
      
      for (let i = 0; i < prerequisiteQuestions.length; i++) {
        const question = prerequisiteQuestions[i];
        if (!question.score) { // Only grade if not already scored
          try {
            const result = await AgentOrchestrator.callCLOAgent(
              user.id,
              'SCORE_PREREQUISITE',
              currentWeekNumber,
              { 
                questionIndex: i, 
                answer: question.answer, 
                question: question.question 
              }
            );
            
            if (result.success && result.data?.score !== undefined) {
              // Update score in local state
              const updatedQuestions = [...prerequisiteQuestions];
              updatedQuestions[i].score = result.data.score;
              setPrerequisiteQuestions(updatedQuestions);
            } else {
              allGraded = false;
            }
          } catch (error) {
            console.error(`Failed to grade question ${i}:`, error);
            allGraded = false;
          }
        }
      }
      
      if (allGraded) {
        console.log('✅ All prerequisites graded successfully');
        toast.success('All prerequisite questions have been graded!');
      } else {
        toast.error('Some questions failed to grade. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error grading all prerequisites:', error);
      toast.error('Failed to grade prerequisites. Please try again.');
    }
  };

  const startSocraticSession = async () => {
    if (!user || !socraticInsight || !socraticPrompts.length) return;
    
    try {
      console.log('🧠 Starting Socratic session with insight:', socraticInsight);
      
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      // Send to Socratic agent via orchestrator
      const result = await AgentOrchestrator.callSocraticAgent(
        user.id,
        'START_SESSION',
        currentWeekNumber,
        { 
          insight: socraticInsight, 
          prompts: socraticPrompts,
          weekNumber: currentWeekNumber
        }
      );
      
      if (result.success) {
        setCurrentSession('socratic');
        console.log('✅ Socratic session started');
      }
    } catch (error) {
      console.error('❌ Error starting Socratic session:', error);
    }
  };

  const startTASession = async () => {
    if (!user || !dailyTasks.length) return;
    
    try {
      console.log('📝 Starting TA session with tasks:', dailyTasks);
      
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      // Send to TA agent via orchestrator
      const result = await AgentOrchestrator.callTAAgent(
        user.id,
        'START_SESSION',
        currentWeekNumber,
        { 
          tasks: dailyTasks,
          weekNumber: currentWeekNumber
        }
      );
      
      if (result.success) {
        setCurrentSession('ta');
        console.log('✅ TA session started');
      }
    } catch (error) {
      console.error('❌ Error starting TA session:', error);
    }
  };

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

  const forceRefreshCLO = async () => {
    console.log('🔄 Force refreshing CLO data');
    setLastLoadedWeek(null); // Reset to allow new CLO call
    setLearningPlan(null); // Clear existing plan
    setDailyLesson(null); // Clear existing lesson
    
    // Force a new CLO load by calling the load function directly
    if (user && userTrack) {
      console.log('🚀 Force loading CLO after refresh');
      await loadDailyLesson();
    }
  };

  const hardResetCLO = async () => {
    try {
      console.log('💥 Hard reset CLO - clearing all state');
      
      if (!user) {
        console.error('❌ No user found for hard reset');
        return;
      }
      
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      // Reset database state
      const result = await AgentOrchestrator.resetWeeklyProgress(user.id, currentWeekNumber);
      
      if (result.success) {
        // Clear saved state
        clearLearningState();
        
        // Reset all local state
        setLastLoadedWeek(null);
        setLearningPlan(null);
        setDailyLesson(null);
        setCurrentPhase('clo');
        
        console.log('✅ Hard reset completed, state cleared');
        
        // Force reload after a short delay
        setTimeout(() => {
          if (user && userTrack) {
            console.log('🚀 Triggering fresh CLO load after hard reset');
            hasInitializedRef.current = false; // Reset initialization flag
            loadDailyLesson();
          }
        }, 100);
      } else {
        console.error('❌ Failed to reset database state:', result.error);
      }
    } catch (error) {
      console.error('❌ Error in hard reset:', error);
    }
  };

  const forceLoadCLO = async () => {
    try {
      console.log('🚀 Force loading CLO data directly');
      
      if (!user || !userTrack) {
        console.error('❌ No user or track for CLO load');
        return;
      }
      
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      // Call CLO agent directly
      const result = await AgentOrchestrator.callCLOAgent(user.id, 'create_weekly_plan', currentWeekNumber);
      
      if (result.success) {
        console.log('✅ CLO data loaded successfully');
        setLearningPlan(result.data);
        setLastLoadedWeek(currentWeekNumber);
        setCurrentPhase('clo');
      } else {
        console.error('❌ Failed to load CLO data:', result.error);
      }
    } catch (error) {
      console.error('❌ Error in force CLO load:', error);
    }
  };

  // Helpers for display cleanup
  const cleanText = (value: unknown): string => {
    const s = typeof value === 'string' ? value : '';
    return s
      .replace(/\*\*/g, '') // remove bold markers
      .replace(/^[-*•]\s*/, '') // strip leading bullet markers
      .replace(/\s+\*\*$/g, '') // trailing bold artifacts
      .trim();
  };

  const parseDailyItem = (raw: unknown, index: number): { day: number; text: string } => {
    const s = cleanText(raw);
    const m = s.match(/^Day\s*(\d+)\s*:\s*(.*)$/i);
    if (m) {
      const dayNum = parseInt(m[1], 10);
      const text = cleanText(m[2]);
      return { day: Number.isFinite(dayNum) ? dayNum : index + 1, text };
    }
    return { day: index + 1, text: s };
  };

  // Proper function to parse learning plan content based on actual CLO response format
  const parseLearningPlanContent = (content: any) => {
    if (!content) return null;
    
    // console.log('🔍 Parsing content:', content); // Reduced logging
    
    // Handle different content structures
    let text = '';
    
    if (typeof content === 'string') {
      text = content;
    } else if (content.fullContent) {
      text = content.fullContent;
    } else if (content.content) {
      text = content.content;
    } else if (content.full_response_text) {
      text = content.full_response_text;
    } else if (content.raw_response) {
      text = content.raw_response;
    } else {
      text = JSON.stringify(content, null, 2);
    }
    
    // console.log('📝 Text to parse:', text.substring(0, 500) + '...'); // Reduced logging
    
    // Parse sections based on the actual CLO response format
    const sections: any = {};
    
    // Extract sections that start with ** and end before the next ** or end of text
    const sectionMatches = text.matchAll(/\*\*(\d+\.\s*[^*]+)\*\*([\s\S]*?)(?=\*\*\d+\.|$)/g);
    
    for (const match of sectionMatches) {
      const sectionTitle = match[1].trim();
      const sectionContent = match[2].trim();
      
      // Map section titles to our section keys
      if (sectionTitle.includes('Dynamic Skills Graph')) {
        sections.dynamicSkillsGraph = [null, sectionContent];
      } else if (sectionTitle.includes('Prerequisite Check')) {
        sections.prerequisiteCheck = [null, sectionContent];
      } else if (sectionTitle.includes('Weekly Theme & Rationale')) {
        sections.weeklyTheme = [null, sectionContent];
      } else if (sectionTitle.includes('SMART Learning Objectives')) {
        sections.learningObjectives = [null, sectionContent];
      } else if (sectionTitle.includes('Core Theoretical Concepts')) {
        sections.keyConcepts = [null, sectionContent];
      } else if (sectionTitle.includes('Practical Tools & Libraries')) {
        sections.resources = [null, sectionContent];
      } else if (sectionTitle.includes('Curated Resources')) {
        sections.resources = [null, sectionContent];
      } else if (sectionTitle.includes('Capstone Project')) {
        sections.capstoneProject = [null, sectionContent];
      } else if (sectionTitle.includes('Handoff 2')) {
        sections.dailySocraticPrompts = [null, sectionContent];
      } else if (sectionTitle.includes('Handoff 3')) {
        sections.taDailyTasks = [null, sectionContent];
      }
    }
    
    // Also try to extract from the JSON content if present
    if (content.CLO_Briefing_Note) {
      if (content.CLO_Briefing_Note.weekly_theme && !sections.weeklyTheme) {
        sections.weeklyTheme = [null, content.CLO_Briefing_Note.weekly_theme];
      }
      if (content.CLO_Briefing_Note.key_socratic_insight && !sections.dailySocraticPrompts) {
        sections.dailySocraticPrompts = [null, content.CLO_Briefing_Note.key_socratic_insight];
      }
    }
    
    if (content.CLO_Assessor_Directive) {
      if (content.CLO_Assessor_Directive.objectives && !sections.learningObjectives) {
        const objectives = Array.isArray(content.CLO_Assessor_Directive.objectives) 
          ? content.CLO_Assessor_Directive.objectives.join('\n• ')
          : content.CLO_Assessor_Directive.objectives;
        sections.learningObjectives = [null, `• ${objectives}`];
      }
    }
    
    // If no sections were found with regex, try to extract from the actual content structure
    if (Object.keys(sections).length === 0) {
      console.log('⚠️ No sections found with regex, trying direct extraction...');
      
      // Extract from the actual content fields
      if (content.title) sections.weeklyTheme = [null, content.title];
      if (content.description) sections.description = [null, content.description];
      if (content.objectives) {
        const objectives = Array.isArray(content.objectives) 
          ? content.objectives.join('\n• ')
          : content.objectives;
        sections.learningObjectives = [null, `• ${objectives}`];
      }
      if (content.key_concepts) sections.keyConcepts = [null, content.key_concepts];
      if (content.resources) sections.resources = [null, content.resources];
      if (content.capstone_project) sections.capstoneProject = [null, content.capstone_project];
      if (content.prerequisite_check) sections.prerequisiteCheck = [null, content.prerequisite_check];
      if (content.daily_socratic_prompts) sections.dailySocraticPrompts = [null, content.daily_socratic_prompts];
      if (content.ta_daily_tasks) sections.taDailyTasks = [null, content.ta_daily_tasks];
    }
    
    // console.log('🔍 Parsed sections:', Object.keys(sections).filter(key => sections[key])); // Reduced logging
    
    return sections;
  };

  const formatContentSection = (content: any, title: string, icon: string) => {
    if (!content) return null;
    
    // Ensure content is a string
    const contentString = typeof content === 'string' ? content : String(content);
    
    const cleanedContent = contentString
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/^[-*•]\s*/, '') // Remove leading bullets
      .replace(/\n\s*[-*•]\s*/g, '\n• ') // Standardize bullet points
      .trim();
    
    const lines = cleanedContent.split('\n').filter(line => line.trim());
    
    return (
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <h4 className="text-lg font-medium text-foreground mb-3">{icon} {title}</h4>
        <div className="space-y-2">
          {lines.map((line: string, index: number) => {
            if (line.trim().startsWith('•')) {
              return (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-foreground">{line.replace(/^•\s*/, '').trim()}</span>
                </div>
              );
            } else if (line.trim()) {
              return (
                <p key={index} className="text-foreground leading-relaxed">
                  {line.trim()}
                </p>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  const loadDailyLesson = async () => {
    console.log('📖 loadDailyLesson called:', { user: !!user, userTrack, isLoading });
    if (!user || !userTrack || isLoadingRef.current) {
      console.log('⏭️ Skipping loadDailyLesson:', { noUser: !user, noTrack: !userTrack, isLoading });
      return; // Prevent multiple calls
    }
    
    try {
      isLoadingRef.current = true; // Set ref to true
      setIsLoading(true); // Set state to true
      console.log('🚀 Starting to load daily lesson...');
      
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      console.log('📅 Current week number:', currentWeekNumber);
      console.log('🔍 Environment check:', {
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });
      
      // First, try to get existing weekly note for this week
      try {
        console.log('🔍 Checking for existing weekly note for week:', currentWeekNumber);
        const existingResult = await AgentOrchestrator.callCLOAgent(
          user.id,
          'GET_WEEKLY_PLAN',
          currentWeekNumber
        );
        
        console.log('📥 Existing result:', existingResult);
        
        if (existingResult.success && existingResult.data) {
          console.log('✅ Found existing weekly note:', existingResult.data);
          
          // Create learning plan from existing data
          const plan: LearningPlan = {
            id: `plan-${currentWeekNumber}`,
            title: existingResult.data.title || 'Weekly Learning Plan',
            summary: existingResult.data.description || 'Comprehensive weekly learning plan',
            fullContent: existingResult.data,
            estimatedDuration: (existingResult.data.estimated_duration || 25) * 5,
            learningObjectives: existingResult.data.objectives || ['Complete weekly objectives'],
            keyConcepts: existingResult.data.key_concepts || ['Master core concepts'],
            resources: existingResult.data.resources || ['Online tutorials', 'Documentation'],
            assessmentCriteria: ['Demonstrate understanding', 'Complete exercises', 'Apply concepts'],
            isApproved: existingResult.data.clo_completed || false
          };
          
          setLearningPlan(plan);
          console.log('💾 Learning plan restored from existing data:', plan);
          
          // Extract agent-specific content from the actual CLO response format
          if (plan.fullContent) {
            console.log('🔍 Extracting agent content from plan:', Object.keys(plan.fullContent));
            
            // Extract prerequisite questions from the fullContent text
            const fullContentText = plan.fullContent.fullContent || plan.fullContent.content || '';
            if (fullContentText) {
              // Look for the Prerequisite Check section
              const prerequisiteMatch = fullContentText.match(/\*\*2\.\s*Prerequisite Check.*?\*\*([\s\S]*?)(?=\*\*\d+\.|$)/);
              if (prerequisiteMatch) {
                const prerequisiteText = prerequisiteMatch[1].trim();
                const questions = prerequisiteText.split('\n')
                  .filter((line: string) => line.trim() && /^\d+\./.test(line.trim()))
                  .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
                  .map((question: string) => ({ question, answer: '', score: null }));
                setPrerequisiteQuestions(questions);
                console.log('✅ Extracted prerequisite questions:', questions.length);
              }
            }
            
            // Extract Socratic insight from JSON or text
            let socraticInsightText = '';
            if (plan.fullContent.CLO_Briefing_Note?.key_socratic_insight) {
              socraticInsightText = plan.fullContent.CLO_Briefing_Note.key_socratic_insight;
            } else if (fullContentText) {
              // Look for the Socratic prompts section
              const socraticMatch = fullContentText.match(/\*\*10\.\s*Handoff 2.*?\*\*([\s\S]*?)(?=\*\*\d+\.|$)/);
              if (socraticMatch) {
                socraticInsightText = socraticMatch[1].trim();
              }
            }
            
            if (socraticInsightText) {
              setSocraticInsight(socraticInsightText);
              console.log('✅ Extracted Socratic insight:', socraticInsightText.substring(0, 100) + '...');
            }
            
            // Extract daily tasks from the fullContent text
            if (fullContentText) {
              const taMatch = fullContentText.match(/\*\*11\.\s*Handoff 3.*?\*\*([\s\S]*?)(?=\*\*\d+\.|$)/);
              if (taMatch) {
                const taText = taMatch[1].trim();
                const tasks = taText.split('\n')
                  .filter((line: string) => line.trim() && /^\d+\./.test(line.trim()))
                  .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
                setDailyTasks(tasks);
                console.log('✅ Extracted daily tasks:', tasks.length);
              }
            }
            
            // Extract Socratic prompts from the fullContent text
            if (fullContentText) {
              const socraticMatch = fullContentText.match(/\*\*10\.\s*Handoff 2.*?\*\*([\s\S]*?)(?=\*\*\d+\.|$)/);
              if (socraticMatch) {
                const promptsText = socraticMatch[1].trim();
                const prompts = promptsText.split('\n')
                  .filter((line: string) => line.trim() && /^\d+\./.test(line.trim()))
                  .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
                setSocraticPrompts(prompts);
                console.log('✅ Extracted Socratic prompts:', prompts.length);
              }
            }
            
            // If regex extraction failed, try direct field extraction
            if (prerequisiteQuestions.length === 0 && plan.fullContent.prerequisite_check) {
              const questions = plan.fullContent.prerequisite_check.split('\n')
                .filter((line: string) => line.trim() && /^\d+\./.test(line.trim()))
                .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
                .map((question: string) => ({ question, answer: '', score: null }));
              setPrerequisiteQuestions(questions);
              console.log('✅ Extracted prerequisite questions from direct field:', questions.length);
            }
            
            if (!socraticInsight && plan.fullContent.key_socratic_insight) {
              setSocraticInsight(plan.fullContent.key_socratic_insight);
              console.log('✅ Extracted Socratic insight from direct field');
            }
            
            if (dailyTasks.length === 0 && plan.fullContent.ta_daily_tasks) {
              const tasks = plan.fullContent.ta_daily_tasks.split('\n')
                .filter((line: string) => line.trim() && /^\d+\./.test(line.trim()))
                .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
              setDailyTasks(tasks);
              console.log('✅ Extracted daily tasks from direct field:', tasks.length);
            }
            
            if (socraticPrompts.length === 0 && plan.fullContent.daily_socratic_prompts) {
              const prompts = plan.fullContent.daily_socratic_prompts.split('\n')
                .filter((line: string) => line.trim() && /^\d+\./.test(line.trim()))
                .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
              setSocraticPrompts(prompts);
              console.log('✅ Extracted Socratic prompts from direct field:', prompts.length);
            }
          }
          
          // Set daily lesson for backward compatibility
          const lesson: DailyLesson = {
            id: existingResult.data.lesson_id || 'lesson-1',
            title: existingResult.data.title || 'Weekly Learning Session',
            objectives: existingResult.data.objectives || ['Complete weekly objectives'],
            content: existingResult.data.content || existingResult.data.fullContent || 'Weekly content will appear here.',
            exercises: existingResult.data.exercises || ['Practice exercises'],
            estimatedDuration: existingResult.data.estimated_duration || 25,
            dayNumber: 1
          };
          setDailyLesson(lesson);
          console.log('💾 Daily lesson restored:', lesson);
          
          // Set phase based on approval status
          if (plan.isApproved) {
            setCurrentPhase('instructor');
            console.log('🔄 Phase set to instructor (plan approved)');
          } else {
            setCurrentPhase('clo');
            console.log('🔄 Phase set to CLO (plan needs approval)');
          }
          
          return;
        }
      } catch (existingError) {
        console.log('⚠️ No existing weekly note found, will create new one:', existingError);
      }
      
      // If no existing data, create new weekly plan
      try {
        console.log('📞 Creating new weekly plan via CLO Agent for week:', currentWeekNumber);
        const result = await AgentOrchestrator.callCLOAgent(
          user.id,
          'CREATE_WEEKLY_PLAN',
          currentWeekNumber
        );
        
        console.log('📥 CLO Agent response:', result);
        
        if (result.success && result.data) {
          console.log('✅ CLO Agent successful, creating new learning plan');
          // Create a comprehensive learning plan from CLO response
          const plan: LearningPlan = {
            id: `plan-${currentWeekNumber}`,
            title: result.data.title || 'Weekly Learning Plan',
            summary: result.data.description || 'Comprehensive weekly learning plan',
            fullContent: result.data, // Store the complete CLO response
            estimatedDuration: (result.data.estimated_duration || 25) * 5, // Convert to total weekly hours
            learningObjectives: result.data.objectives || ['Complete weekly objectives'],
            keyConcepts: result.data.key_concepts || ['Master core concepts'],
            resources: result.data.resources || ['Online tutorials', 'Documentation'],
            assessmentCriteria: ['Demonstrate understanding', 'Complete exercises', 'Apply concepts'],
            isApproved: false
          };
          
          setLearningPlan(plan);
          console.log('💾 New learning plan created:', plan);
          
          // Also set daily lesson for backward compatibility
          const lesson: DailyLesson = {
            id: result.data.lesson_id || 'lesson-1',
            title: result.data.title || 'Weekly Learning Session',
            objectives: result.data.objectives || ['Complete weekly objectives'],
            content: result.data.content || result.data.fullContent || 'Weekly content will appear here.',
            exercises: result.data.exercises || ['Practice exercises'],
            estimatedDuration: result.data.estimated_duration || 25,
            dayNumber: 1
          };
          setDailyLesson(lesson);
          console.log('💾 New daily lesson created:', lesson);
          
          // Set phase to CLO for plan approval
          setCurrentPhase('clo');
          console.log('🔄 Phase set to CLO for new plan');
          return;
        } else {
          console.log('❌ CLO Agent failed:', result.error);
        }
      } catch (orchestratorError) {
        console.log('⚠️ Orchestrator error, using mock data:', orchestratorError);
      }
      
      // Fallback to mock data if orchestrator fails
      console.log('🔄 Using fallback mock data');
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
      console.log('💾 Mock lesson set:', lesson);
      
      // Set phase to instructor for mock data
      setCurrentPhase('instructor');
    } catch (error) {
      console.error('❌ Error loading daily lesson:', error);
      toast.error('Failed to load daily lesson');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false; // Reset ref
      console.log('✅ loadDailyLesson completed');
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
          response = 'I\'m not sure how to handle that in the current phase.';
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
    if (!user || !dailyLesson) return 'Please log in and load a lesson first.';
    
    try {
      // Calculate current week number
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      if (currentSession === 'socratic') {
        // Use orchestrator for Socratic questioning
        const result = await AgentOrchestrator.callSocraticAgent(
          user.id,
          'CONTINUE_SESSION',
          currentWeekNumber,
          { 
            message,
            conversationHistory: messages.map(m => `${m.type}: ${m.content}`),
            sessionId: currentSession
          }
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
    try {
      console.log('✅ User approving learning plan');
      
      if (!user) {
        console.error('❌ No user found');
        addMessage('Please log in to approve your learning plan.', 'error');
        return 'Please log in to approve your plan.';
      }
      
      // Calculate current week number
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      // Call orchestrator to approve the plan
      const result = await AgentOrchestrator.approveLearningPlan(user.id, currentWeekNumber);
      
      if (result.success) {
        // Mark plan as approved locally
        setLearningPlan(prev => prev ? { ...prev, isApproved: true } : null);
        
        // Update current phase to instructor
        setCurrentPhase('instructor');
        
        // Add success message
        addMessage('Excellent! Your learning plan has been approved. Now let\'s begin your daily instruction.', 'instructor');
        
        console.log('✅ Learning plan approved successfully');
        return 'Plan approved! Transitioning to daily instruction.';
      } else {
        console.error('❌ Failed to approve learning plan:', result.error);
        addMessage('Sorry, there was an error approving your plan. Please try again.', 'error');
        return 'Error approving plan. Please try again.';
      }
    } catch (error) {
      console.error('❌ Error in approveLearningPlan:', error);
      addMessage('Sorry, there was an error approving your plan. Please try again.', 'error');
      return 'Error approving plan. Please try again.';
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
      // Calculate current week number
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      // Call Socratic agent for initial question
      const response = await AgentOrchestrator.callSocraticAgent(
        user!.id,
        'START_SESSION',
        currentWeekNumber,
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

  const checkAndResetWeeklyProgress = async () => {
    try {
      if (!user) return;
      
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      // If we're in a new week, reset progress
      if (lastLoadedWeek !== null && lastLoadedWeek !== currentWeekNumber) {
        console.log('🔄 New week detected, resetting progress from week', lastLoadedWeek, 'to', currentWeekNumber);
        
        // Reset weekly progress in the orchestrator
        const result = await AgentOrchestrator.resetWeeklyProgress(user.id, currentWeekNumber);
        
        if (result.success) {
          // Reset local state
          setLastLoadedWeek(null);
          setLearningPlan(null);
          setDailyLesson(null);
          setCurrentPhase('clo');
          
          console.log('✅ Weekly progress reset successfully');
        } else {
          console.error('❌ Failed to reset weekly progress:', result.error);
        }
      }
      
      // Also check if Alex challenge is completed and trigger reset
      const alexCheck = await AgentOrchestrator.checkAlexChallengeCompletion(user.id, currentWeekNumber);
      if (alexCheck.success && alexCheck.alexCompleted) {
        console.log('🔄 Alex challenge completed, resetting progress');
        
        // Reset all local state
        setLastLoadedWeek(null);
        setLearningPlan(null);
        setDailyLesson(null);
        setCurrentPhase('clo');
        
        console.log('✅ Progress reset completed for Alex challenge');
        
        // Force reload after a short delay
        setTimeout(() => {
          if (user && userTrack) {
            console.log('🚀 Triggering fresh CLO load after Alex challenge reset');
            hasInitializedRef.current = false; // Reset initialization flag
            loadDailyLesson();
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error checking weekly progress reset:', error);
    }
  };

  const resetProgressForAlexChallenge = async () => {
    try {
      console.log('🚀 Resetting progress for Alex challenge');
      
      if (!user) {
        console.error('❌ No user found for reset');
        return;
      }
      
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      // Reset database state
      const result = await AgentOrchestrator.resetWeeklyProgress(user.id, currentWeekNumber);
      
      if (result.success) {
        // Clear saved state
        clearLearningState();
        
        // Reset all local state
        setLastLoadedWeek(null);
        setLearningPlan(null);
        setDailyLesson(null);
        setCurrentPhase('clo');
        
        console.log('✅ Progress reset completed for Alex challenge');
        
        // Force reload after a short delay
        setTimeout(() => {
          if (user && userTrack) {
            console.log('🚀 Triggering fresh CLO load after Alex challenge reset');
            hasInitializedRef.current = false; // Reset initialization flag
            loadDailyLesson();
          }
        }, 100);
      } else {
        console.error('❌ Failed to reset database state:', result.error);
      }
    } catch (error) {
      console.error('❌ Error resetting progress for Alex challenge:', error);
    }
  };



  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
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
            <h1 className="text-4xl md:text-6xl font-medium text-foreground mb-4">
              Unified Learning Platform
            </h1>
            <p className="text-xl text-muted-foreground">
              Your personalized AI-powered learning journey
            </p>
          </motion.div>

          {/* Debug State Display */}
          <div className="mb-6 p-4 bg-muted/50 border border-border/50 rounded-lg">
            <h3 className="text-lg font-medium text-foreground mb-2">🐛 Debug State</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">User:</span> {user ? '✅' : '❌'}
              </div>
              <div>
                <span className="text-muted-foreground">User Track:</span> {userTrack || '❌'}
              </div>
              <div>
                <span className="text-muted-foreground">Current Phase:</span> {currentPhase}
              </div>
              <div>
                <span className="text-muted-foreground">Learning Plan:</span> {learningPlan ? '✅' : '❌'}
              </div>
              <div>
                <span className="text-muted-foreground">Daily Lesson:</span> {dailyLesson ? '✅' : '❌'}
              </div>
              <div>
                <span className="text-muted-foreground">Last Loaded Week:</span> {lastLoadedWeek || '❌'}
              </div>
              <div>
                <span className="text-muted-foreground">Is Loading:</span> {isLoading ? '✅' : '❌'}
              </div>
              <div>
                <span className="text-muted-foreground">Has Initialized:</span> {hasInitializedRef.current ? '✅' : '❌'}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-lg text-muted-foreground">Loading your learning plan...</p>
            </div>
          )}

          {/* Manual Refresh Button */}
          {!isLoading && !learningPlan && !dailyLesson && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No learning plan loaded. Click the button below to manually load.</p>
              <Button
                onClick={() => {
                  console.log('🔄 Manual refresh clicked');
                  hasInitializedRef.current = false;
                  loadDailyLesson();
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                🔄 Load Learning Plan
              </Button>
            </div>
          )}

          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto">
            {/* Phase-based content rendering */}
            {currentPhase === 'clo' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-6 bg-card border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-medium text-foreground">
                      Curriculum Learning Officer
                    </h2>
                    <div className="flex space-x-2">
                      <Button
                        onClick={forceRefreshCLO}
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground border-border hover:border-border/80"
                      >
                        🔄 Refresh Plan
                      </Button>
                      <Button
                        onClick={resetProgressForAlexChallenge}
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground border-border hover:border-border/80"
                      >
                        🚀 Reset for Alex Challenge
                      </Button>
                      <Button
                        onClick={hardResetCLO}
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground border-border hover:border-border/80"
                      >
                        💥 Hard Reset
                      </Button>
                      <Button
                        onClick={() => {
                          console.log('🧹 Clearing lastLoadedWeek to force fresh CLO load');
                          setLastLoadedWeek(null);
                          // Trigger useEffect to reload
                          setTimeout(() => {
                            if (user && userTrack) {
                              console.log('🚀 Triggering fresh CLO load after clearing state');
                              loadDailyLesson();
                            }
                          }, 100);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground border-border hover:border-border/80"
                      >
                        🧹 Clear & Reload
                      </Button>
                      <Button
                        onClick={forceLoadCLO}
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground border-border hover:border-border/80"
                      >
                        🚀 Force CLO Load
                      </Button>
                      <Button
                        onClick={() => {
                          const currentWeek = Math.ceil(
                            (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
                          );
                          console.log('🐛 Debug State:', {
                            currentWeek,
                            lastLoadedWeek,
                            userTrack,
                            currentPhase,
                            hasLearningPlan: !!learningPlan,
                            hasDailyLesson: !!dailyLesson,
                            shouldLoad: lastLoadedWeek !== currentWeek
                          });
                          
                          // Also check localStorage
                          const savedState = loadLearningState();
                          console.log('📂 localStorage state:', savedState);
                          
                          // Check if user has learning preferences
                          console.log('👤 User learning preferences:', user?.learning_preferences);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground border-border hover:border-border/80"
                      >
                        🐛 Debug State
                      </Button>
                      <Button
                        onClick={() => {
                          const savedState = loadLearningState();
                          if (savedState) {
                            console.log('🔄 Manually restoring state from localStorage:', savedState);
                            setCurrentPhase(savedState.currentPhase as any);
                            setLastLoadedWeek(savedState.lastLoadedWeek);
                            setLearningPlan(savedState.learningPlan);
                            setDailyLesson(savedState.dailyLesson);
                            toast.success('State restored from localStorage');
                          } else {
                            toast.error('No saved state found in localStorage');
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground border-border hover:border-border/80"
                      >
                        🔄 Restore State
                      </Button>
                    </div>
                  </div>
                  
                  {/* Weekly Progress Indicator */}
                  <div className="mb-6 p-4 bg-muted/50 border border-border/50 rounded-lg">
                    <h3 className="text-lg font-medium text-foreground mb-3">📊 Weekly Progress</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className={`text-center p-2 rounded ${learningPlan?.isApproved ? 'bg-green-50 border border-green-200' : 'bg-muted border border-border'}`}>
                        <div className="text-sm text-muted-foreground">CLO</div>
                        <div className={`text-lg font-medium ${learningPlan?.isApproved ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {learningPlan?.isApproved ? '✅' : '⏳'}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted border border-border">
                        <div className="text-sm text-muted-foreground">Socratic</div>
                        <div className="text-lg font-medium text-muted-foreground">⏳</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted border border-border">
                        <div className="text-sm text-muted-foreground">Instructor</div>
                        <div className="text-lg font-medium text-muted-foreground">⏳</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted border border-border">
                        <div className="text-sm text-muted-foreground">TA</div>
                        <div className="text-lg font-medium text-muted-foreground">⏳</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted border border-border">
                        <div className="text-sm text-muted-foreground">Alex</div>
                        <div className="text-lg font-medium text-muted-foreground">⏳</div>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-sm text-muted-foreground">
                        Week {lastLoadedWeek || 'Not Started'} • 
                        {learningPlan?.isApproved ? ' 10% Complete' : ' 0% Complete'}
                      </span>
                    </div>
                  </div>

                  {learningPlan ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-medium text-foreground mb-2">
                            Your Learning Plan
                          </h3>
                          <p className="text-lg text-muted-foreground break-words">
                            {learningPlan.title}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setShowSimpleView(!showSimpleView)}
                            variant="outline"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground border-border hover:border-border/80"
                          >
                            {showSimpleView ? 'Show Parsed View' : 'Show Simple View'}
                          </Button>
                          <Button
                            onClick={() => setShowFullPlan(!showFullPlan)}
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground ml-4 flex-shrink-0"
                          >
                            {showFullPlan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showFullPlan ? 'Show Summary' : 'Show Full Plan'}
                          </Button>
                        </div>
                      </div>
                      
                      {showFullPlan ? (
                        <div className="space-y-6">
                          {/* Rich CLO Content Display */}
                          {learningPlan.fullContent && (
                            <div className="space-y-6">
                              {/* Parse and display content sections */}
                              {(() => {
                                const sections = parseLearningPlanContent(learningPlan.fullContent);
                                // console.log('🎯 Rendering sections:', sections); // Reduced logging
                                
                                if (sections && Object.values(sections).some(section => section)) {
                                  return (
                                    <>
                                      {/* Weekly Theme */}
                                      {sections.weeklyTheme && formatContentSection(
                                        sections.weeklyTheme[1], 
                                        'Weekly Theme', 
                                        '🎯'
                                      )}
                                      
                                      {/* Weekly Theme & Rationale */}
                                      {sections.weeklyRationale && formatContentSection(
                                        sections.weeklyRationale[1], 
                                        'Weekly Theme & Rationale', 
                                        '💡'
                                      )}
                                      
                                      {/* Learning Objectives */}
                                      {sections.learningObjectives && formatContentSection(
                                        sections.learningObjectives[1], 
                                        'Learning Objectives', 
                                        '📚'
                                      )}
                                      
                                      {/* SMART Learning Objectives */}
                                      {sections.smartObjectives && formatContentSection(
                                        sections.smartObjectives[1], 
                                        'SMART Learning Objectives', 
                                        '🎯'
                                      )}
                                      
                                      {/* Key Concepts */}
                                      {sections.keyConcepts && formatContentSection(
                                        sections.keyConcepts[1], 
                                        'Key Concepts', 
                                        '🔑'
                                      )}
                                      
                                      {/* Core Theoretical Concepts */}
                                      {sections.coreConcepts && formatContentSection(
                                        sections.coreConcepts[1], 
                                        'Core Theoretical Concepts', 
                                        '🧠'
                                      )}
                                      
                                      {/* Dynamic Skills Graph */}
                                      {sections.dynamicSkillsGraph && formatContentSection(
                                        sections.dynamicSkillsGraph[1], 
                                        'Dynamic Skills Graph', 
                                        '📊'
                                      )}
                                      
                                      {/* Prerequisite Check */}
                                      {sections.prerequisiteCheck && (
                                        <div className="bg-card border border-border/50 rounded-lg p-4">
                                          <h4 className="text-lg font-medium text-foreground mb-3">✅ Prerequisite Check</h4>
                                          <div className="space-y-4">
                                            {(() => {
                                              const questions = sections.prerequisiteCheck[1].split('\n')
                                                .filter((line: string) => line.trim() && /^\d+\./.test(line.trim()))
                                                .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
                                              
                                              return questions.map((question: string, index: number) => (
                                                <div key={index} className="bg-muted/50 rounded-lg p-3 border border-border/50">
                                                  <h5 className="text-foreground font-medium mb-2">Question {index + 1}</h5>
                                                  <p className="text-foreground text-sm mb-3">{question}</p>
                                                  <div className="space-y-2">
                                                    <textarea
                                                      placeholder="Type your answer here..."
                                                      className="w-full p-2 border border-border/50 rounded text-sm text-foreground bg-background resize-none"
                                                      rows={3}
                                                      value={prerequisiteQuestions[index]?.answer || ''}
                                                      onChange={(e) => {
                                                        const updatedQuestions = [...prerequisiteQuestions];
                                                        if (!updatedQuestions[index]) {
                                                          updatedQuestions[index] = { question, answer: '', score: null };
                                                        }
                                                        updatedQuestions[index].answer = e.target.value;
                                                        setPrerequisiteQuestions(updatedQuestions);
                                                      }}
                                                    />
                                                    <div className="flex items-center justify-between">
                                                      <button
                                                        onClick={() => submitPrerequisiteAnswer(index, prerequisiteQuestions[index]?.answer || '')}
                                                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 rounded text-sm"
                                                        disabled={!prerequisiteQuestions[index]?.answer?.trim()}
                                                      >
                                                        Submit Answer
                                                      </button>
                                                      {prerequisiteQuestions[index]?.score !== null && (
                                                        <span className={`text-sm font-medium ${
                                                          prerequisiteQuestions[index]?.score! >= 7 ? 'text-green-600' : 'text-yellow-600'
                                                        }`}>
                                                          Score: {prerequisiteQuestions[index]?.score}/10
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ));
                                            })()}
                                            
                                            {/* Global Submit Button */}
                                            {prerequisiteQuestions.length > 0 && (
                                              <div className="pt-4 border-t border-border/50">
                                                <button
                                                  onClick={submitAllPrerequisites}
                                                  className="w-full bg-green-600 text-white hover:bg-green-700 px-4 py-3 rounded-lg font-medium transition-colors"
                                                  disabled={!prerequisiteQuestions.every(q => q.answer && q.answer.trim())}
                                                >
                                                  🎯 Submit All Prerequisites for Final Grading
                                                </button>
                                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                                  Submit all answers together for comprehensive AI evaluation
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Resources */}
                                      {sections.resources && formatContentSection(
                                        sections.resources[1], 
                                        'Resources', 
                                        '📖'
                                      )}
                                      
                                      {/* Daily Socratic Prompts */}
                                      {sections.dailySocraticPrompts && formatContentSection(
                                        sections.dailySocraticPrompts[1], 
                                        'Daily Socratic Prompts', 
                                        '💭'
                                      )}
                                      
                                      {/* TA Daily Tasks */}
                                      {sections.taDailyTasks && formatContentSection(
                                        sections.taDailyTasks[1], 
                                        'TA Daily Tasks', 
                                        '📝'
                                      )}
                                      
                                      {/* Capstone Project */}
                                      {sections.capstoneProject && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                          <h4 className="text-lg font-medium text-foreground mb-3">🚀 Capstone Project</h4>
                                          <div className="prose max-w-none">
                                            <div className="text-foreground">
                                              {(() => {
                                                const capstoneText = sections.capstoneProject[1].trim();
                                                const cleanedText = capstoneText
                                                  .replace(/\*\*/g, '') // Remove bold markers
                                                  .replace(/^[-*•]\s*/, '') // Remove leading bullets
                                                  .replace(/\n\s*[-*•]\s*/g, '\n• ') // Standardize bullet points
                                                  .trim();
                                                
                                                return (
                                                  <div className="space-y-3">
                                                    {cleanedText.split('\n').map((line: string, index: number) => {
                                                      if (line.trim().startsWith('•')) {
                                                        return (
                                                          <div key={index} className="flex items-start space-x-2">
                                                            <span className="text-green-600 mt-1">•</span>
                                                            <span className="text-foreground">{line.replace(/^•\s*/, '').trim()}</span>
                                                          </div>
                                                        );
                                                      } else if (line.trim()) {
                                                        return (
                                                          <p key={index} className="text-foreground leading-relaxed">
                                                            {line.trim()}
                                                          </p>
                                                        );
                                                      }
                                                      return null;
                                                    })}
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Daily Breakdown Section */}
                                      {learningPlan.fullContent.daily_breakdown && (
                                        <div className="bg-card border border-border/50 rounded-lg p-4">
                                          <h4 className="text-lg font-medium text-foreground mb-3">📅 Daily Breakdown</h4>
                                          <div className="space-y-3">
                                            {learningPlan.fullContent.daily_breakdown.map((day: any, index: number) => {
                                              const parsed = parseDailyItem(day, index);
                                              return (
                                                <div key={index} className="bg-muted/50 rounded-lg p-3 border border-border/50">
                                                  <h5 className="text-foreground font-medium mb-2">Day {parsed.day}</h5>
                                                  <p className="text-foreground text-sm">{parsed.text}</p>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Remaining Unparsed Content */}
                                      {(() => {
                                        const fullContent = learningPlan.fullContent;
                                        const parsedSections = [
                                          'title', 'description', 'objectives', 'key_concepts', 'resources',
                                          'weekly_theme', 'learning_objectives', 'smart_objectives', 'core_concepts',
                                          'dynamic_skills_graph', 'prerequisite_check', 'capstone_project',
                                          'daily_breakdown', 'weekly_summary'
                                        ];
                                        
                                        const unparsedKeys = Object.keys(fullContent).filter(key => 
                                          !parsedSections.includes(key) && 
                                          fullContent[key] && 
                                          typeof fullContent[key] === 'string' &&
                                          fullContent[key].trim().length > 0
                                        );
                                        

                                        return null;
                                      })()}
                                    </>
                                  );
                                } else {
                                  // If regex parsing failed, show content in a structured way
                                  console.log('⚠️ Regex parsing failed, using structured display');
                                  return (
                                    <div className="space-y-6">
                                      {/* Structured Content Display */}
                                      {learningPlan.fullContent.title && (
                                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                          <h4 className="text-lg font-medium text-foreground mb-2">🎯 Weekly Focus</h4>
                                          <p className="text-foreground text-lg">{learningPlan.fullContent.title}</p>
                                        </div>
                                      )}
                                      
                                      {learningPlan.fullContent.description && (
                                        <div className="bg-card border border-border/50 rounded-lg p-4">
                                          <h4 className="text-lg font-medium text-foreground mb-3">📋 Description</h4>
                                          <p className="text-foreground leading-relaxed">{learningPlan.fullContent.description}</p>
                                        </div>
                                      )}
                                      
                                      {learningPlan.fullContent.objectives && (
                                        <div className="bg-card border border-border/50 rounded-lg p-4">
                                          <h4 className="text-lg font-medium text-foreground mb-3">📚 Learning Objectives</h4>
                                          <div className="space-y-2">
                                            {Array.isArray(learningPlan.fullContent.objectives) 
                                              ? learningPlan.fullContent.objectives.map((obj: string, index: number) => (
                                                  <div key={index} className="flex items-start space-x-2">
                                                    <span className="text-primary mt-1">•</span>
                                                    <span className="text-foreground">{obj}</span>
                                                  </div>
                                                ))
                                              : <p className="text-foreground">{learningPlan.fullContent.objectives}</p>
                                            }
                                          </div>
                                        </div>
                                      )}
                                      
                                      {learningPlan.fullContent.key_concepts && (
                                        <div className="bg-card border border-border/50 rounded-lg p-4">
                                          <h4 className="text-lg font-medium text-foreground mb-3">🔑 Key Concepts</h4>
                                          <div className="space-y-2">
                                            {Array.isArray(learningPlan.fullContent.key_concepts)
                                              ? learningPlan.fullContent.key_concepts.map((concept: string, index: number) => (
                                                  <div key={index} className="flex items-start space-x-2">
                                                    <span className="text-primary mt-1">•</span>
                                                    <span className="text-foreground">{concept}</span>
                                                  </div>
                                                ))
                                              : <p className="text-foreground">{learningPlan.fullContent.key_concepts}</p>
                                            }
                                          </div>
                                        </div>
                                      )}
                                      
                                      {learningPlan.fullContent.resources && (
                                        <div className="bg-card border border-border/50 rounded-lg p-4">
                                          <h4 className="text-lg font-medium text-foreground mb-3">📖 Resources</h4>
                                          <div className="space-y-2">
                                            {Array.isArray(learningPlan.fullContent.resources)
                                              ? learningPlan.fullContent.resources.map((resource: string, index: number) => (
                                                  <div key={index} className="flex items-start space-x-2">
                                                    <span className="text-primary mt-1">•</span>
                                                    <span className="text-foreground">{resource}</span>
                                                  </div>
                                                ))
                                              : <p className="text-foreground">{learningPlan.fullContent.resources}</p>
                                            }
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Daily Socratic Prompts */}
                                      {learningPlan.fullContent.daily_socratic_prompts && (
                                        <div className="bg-card border border-border/50 rounded-lg p-4">
                                          <h4 className="text-lg font-medium text-foreground mb-3">💭 Daily Socratic Prompts</h4>
                                          <div className="space-y-2">
                                            {Array.isArray(learningPlan.fullContent.daily_socratic_prompts)
                                              ? learningPlan.fullContent.daily_socratic_prompts.map((prompt: string, index: number) => (
                                                  <div key={index} className="flex items-start space-x-2">
                                                    <span className="text-primary mt-1">•</span>
                                                    <span className="text-foreground">{prompt}</span>
                                                  </div>
                                                ))
                                              : <p className="text-foreground">{learningPlan.fullContent.daily_socratic_prompts}</p>
                                            }
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* TA Daily Tasks */}
                                      {learningPlan.fullContent.ta_daily_tasks && (
                                        <div className="bg-card border border-border/50 rounded-lg p-4">
                                          <h4 className="text-lg font-medium text-foreground mb-3">📝 TA Daily Tasks</h4>
                                          <div className="space-y-2">
                                            {Array.isArray(learningPlan.fullContent.ta_daily_tasks)
                                              ? learningPlan.fullContent.ta_daily_tasks.map((task: string, index: number) => (
                                                  <div key={index} className="flex items-start space-x-2">
                                                    <span className="text-primary mt-1">•</span>
                                                    <span className="text-foreground">{task}</span>
                                                  </div>
                                                ))
                                              : <p className="text-foreground">{learningPlan.fullContent.ta_daily_tasks}</p>
                                            }
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Show any other string content that might be useful */}
                                      {Object.entries(learningPlan.fullContent).map(([key, value]) => {
                                        if (typeof value === 'string' && 
                                            value.trim() && 
                                            !['title', 'description', 'objectives', 'key_concepts', 'resources', 
                                              'daily_socratic_prompts', 'ta_daily_tasks'].includes(key)) {
                                          return (
                                            <div key={key} className="bg-card border border-border/50 rounded-lg p-4">
                                              <h4 className="text-lg font-medium text-foreground mb-3 capitalize">{key.replace(/_/g, ' ')}</h4>
                                              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          )}
                          
                          
                          

                          
                          
                                                    {/* Agent Session Buttons - only show when content is extracted */}
                          {socraticInsight && socraticPrompts.length > 0 && (
                            <div className="bg-card border border-border/50 rounded-lg p-4 mt-6">
                              <h4 className="text-lg font-medium text-foreground mb-3">🧠 Socratic Learning Session</h4>
                              <p className="text-muted-foreground mb-3">{socraticInsight}</p>
                              <Button
                                onClick={startSocraticSession}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                                disabled={currentSession === 'socratic'}
                              >
                                {currentSession === 'socratic' ? 'Session Active' : 'Start Socratic Session'}
                              </Button>
                            </div>
                          )}
                          
                          {dailyTasks.length > 0 && (
                            <div className="bg-card border border-border/50 rounded-lg p-4 mt-6">
                              <h4 className="text-lg font-medium text-foreground mb-3">📝 Teaching Assistant Session</h4>
                              <p className="text-muted-foreground mb-3">Complete daily tasks with AI guidance</p>
                              <Button
                                onClick={startTASession}
                                className="bg-green-600 text-white hover:bg-green-700"
                                disabled={currentSession === 'ta'}
                              >
                                {currentSession === 'ta' ? 'Session Active' : 'Start TA Session'}
                              </Button>
                            </div>
                          )}
                          
                          {/* Prerequisite Questions with Answer Inputs */}
                          {prerequisiteQuestions.length > 0 && (
                            <div className="bg-card border border-border/50 rounded-lg p-4 mt-6">
                              <h4 className="text-lg font-medium text-foreground mb-3">✅ Prerequisite Check</h4>
                              <div className="space-y-4">
                                {prerequisiteQuestions.map((question, index) => (
                                  <div key={index} className="bg-muted/50 rounded-lg p-3 border border-border/50">
                                    <h5 className="text-foreground font-medium mb-2">Question {index + 1}</h5>
                                    <p className="text-foreground text-sm mb-3">{question.question}</p>
                                    <div className="space-y-2">
                                      <textarea
                                        placeholder="Type your answer here..."
                                        className="w-full p-2 border border-border/50 rounded text-sm text-foreground bg-background resize-none"
                                        rows={3}
                                        value={question.answer}
                                        onChange={(e) => {
                                          const updatedQuestions = [...prerequisiteQuestions];
                                          updatedQuestions[index].answer = e.target.value;
                                          setPrerequisiteQuestions(updatedQuestions);
                                        }}
                                      />
                                      <div className="flex items-center justify-between">
                                        <Button
                                          onClick={() => submitPrerequisiteAnswer(index, question.answer)}
                                          className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 text-sm"
                                          disabled={!question.answer.trim()}
                                        >
                                          Submit Answer
                                        </Button>
                                        {question.score !== null && (
                                          <span className={`text-sm font-medium ${
                                            question.score >= 7 ? 'text-green-600' : 'text-yellow-600'
                                          }`}>
                                            Score: {question.score}/10
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          

                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Weekly Theme Summary */}
                          {learningPlan.fullContent?.title && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                              <h4 className="text-lg font-medium text-foreground mb-2">🎯 This Week's Focus</h4>
                              <p className="text-foreground text-lg font-medium">{learningPlan.fullContent.title}</p>
                            </div>
                          )}
                          
                          {/* Key Highlights */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Objectives Count */}
                            <div className="bg-card border border-border/50 rounded-lg p-3">
                              <h5 className="text-foreground font-medium mb-2">📚 Learning Objectives</h5>
                              <p className="text-foreground text-2xl font-medium">{learningPlan.learningObjectives.length}</p>
                              <p className="text-muted-foreground text-sm">Key goals to achieve</p>
                            </div>
                            
                            {/* Duration */}
                            <div className="bg-card border border-border/50 rounded-lg p-3">
                              <h5 className="text-foreground font-medium mb-2">⏱️ Estimated Time</h5>
                              <p className="text-foreground text-2xl font-medium">{Math.round(learningPlan.estimatedDuration / 60)}h</p>
                              <p className="text-muted-foreground text-sm">Total weekly commitment</p>
                            </div>
                          </div>
                          
                          {/* Quick Overview */}
                          <div className="bg-card border border-border/50 rounded-lg p-4">
                            <h4 className="text-lg font-medium text-foreground mb-3">📋 Quick Overview</h4>
                            <p className="text-foreground mb-3">{learningPlan.summary}</p>
                            
                            {/* Weekly Summary */}
                            {learningPlan.fullContent?.weekly_summary && (
                              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                                <h5 className="text-md font-medium text-foreground mb-2">Weekly Summary</h5>
                                <p className="text-foreground text-sm">{learningPlan.fullContent.weekly_summary}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
                                ? 'bg-primary/10 border border-primary/20 ml-8'
                                : 'bg-muted/50 border border-border/50 mr-8'
                            }`}
                          >
                            <p className="text-foreground">{message.content}</p>
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
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
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
                <Card className="p-6 bg-card border border-border/50">
                  <h2 className="text-2xl font-medium text-foreground mb-4">
                    Learning Instructor
                  </h2>
                  
                  {dailyLesson ? (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-medium text-foreground mb-2">
                          Day {dailyLesson.dayNumber}: {dailyLesson.title}
                        </h3>
                        <p className="text-muted-foreground">
                          Estimated duration: {Math.round(dailyLesson.estimatedDuration / 60)} minutes
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-2">Today's Objectives</h4>
                          <ul className="space-y-2">
                            {dailyLesson.objectives.map((objective, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">{objective}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-2">Lesson Content</h4>
                          <p className="text-foreground leading-relaxed">{dailyLesson.content}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-2">Practice Exercises</h4>
                          <ul className="space-y-2">
                            {dailyLesson.exercises.map((exercise, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <Target className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">{exercise}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Practice Choice */}
                      <div className="border-t border-border/50 pt-6">
                        <h4 className="text-lg font-semibold text-foreground mb-4 text-center">
                          Choose Your Practice Mode
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button
                            onClick={() => startPracticeSession('socratic')}
                            disabled={practiceSessions.find(p => p.type === 'socratic')?.isCompleted}
                            className={`h-20 text-lg font-medium ${
                              practiceSessions.find(p => p.type === 'socratic')?.isCompleted
                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
                            className={`h-20 text-lg font-medium ${
                              practiceSessions.find(p => p.type === 'ta')?.isCompleted
                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
                              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
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
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading your daily lesson...</p>
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
                <Card className="p-6 bg-card border border-border/50">
                  <h2 className="text-2xl font-medium text-foreground mb-4">
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
                              ? 'bg-primary/10 border border-primary/20 ml-8'
                              : 'bg-muted/50 border border-border/50 mr-8'
                          }`}
                        >
                          <p className="text-foreground">{message.content}</p>
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
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {isLoading ? 'Thinking...' : 'Send'}
                      </Button>
                    </div>
                    
                    {/* Back to Lesson Button */}
                    <div className="text-center">
                      <Button
                        onClick={() => setCurrentPhase('instructor')}
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
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
