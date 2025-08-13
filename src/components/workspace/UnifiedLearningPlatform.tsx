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
  EyeOff
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

type AgentTab = 'onboard' | 'clo' | 'instructor' | 'socratic' | 'ta';

export const UnifiedLearningPlatform: React.FC = () => {
  const { user, currentWeek } = useDatabase();
  const { hasFeature, isPaid } = useSubscription();
  const [activeTab, setActiveTab] = useState<AgentTab>('onboard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [cloComplete, setCloComplete] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const voice = useVoiceIntegration({
    autoPlay: true,
    voice: user?.voice_preference || 'alloy',
    onTranscriptReady: (transcript) => {
      setInputValue(transcript);
    }
  });

  // Initialize with welcome message
  useEffect(() => {
    if (user && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'agent',
        agentId: 'onboard',
        content: `Welcome to your unified learning journey, ${user.name || 'Learner'}! I'm here to guide you through a personalized learning experience. Let's start by understanding your goals and creating a tailored plan.`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [user, messages.length]);

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

    const userMessage = inputValue;
    addMessage(userMessage, activeTab, true);
    setInputValue('');
    setIsLoading(true);

    try {
      let response;
      
      switch (activeTab) {
        case 'onboard':
          response = await handleOnboardingMessage(userMessage);
          break;
        case 'clo':
          response = await handleCLOMessage(userMessage);
          break;
        case 'instructor':
          response = await handleInstructorMessage(userMessage);
          break;
        case 'socratic':
          response = await handleSocraticMessage(userMessage);
          break;
        case 'ta':
          response = await handleTAMessage(userMessage);
          break;
        default:
          response = 'I\'m not sure how to help with that. Let me guide you to the right agent.';
      }

      addMessage(response, activeTab);
      
      // Auto-synthesize voice response if enabled
      if (voice.hasVoiceSupport && hasFeature('voice_synthesis')) {
        await voice.synthesizeAndPlay(response);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('I encountered an error processing your request. Please try again.', activeTab);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingMessage = async (message: string): Promise<string> => {
    // Simulate onboarding logic
    if (message.toLowerCase().includes('goal') || message.toLowerCase().includes('objective')) {
      addMessage('Great! I can see you\'re focused on your learning goals. Let me ask a few key questions to understand your current skill level and desired outcomes.', 'onboard');
      
      setTimeout(() => {
        addMessage('What specific skills or knowledge areas would you like to develop? For example: "I want to learn machine learning" or "I need to improve my web development skills".', 'onboard');
      }, 1000);
      
      return 'I\'m gathering information about your learning objectives. Please share more details about what you want to achieve.';
    }
    
    if (message.toLowerCase().includes('experience') || message.toLowerCase().includes('level')) {
      addMessage('Perfect! Now I have a good understanding of your background. Let me transition you to our Curriculum Learning Officer (CLO) who will create a personalized learning plan.', 'onboard');
      
      setTimeout(() => {
        setActiveTab('clo');
        addMessage('Welcome! I\'m your CLO - Curriculum Learning Officer. I\'ll create a personalized learning plan based on your goals and experience level. Let me start by setting up your learning parameters.', 'clo');
      }, 2000);
      
      setOnboardingComplete(true);
      return 'Onboarding complete! Transitioning you to the CLO for personalized plan creation.';
    }
    
    return 'I\'m here to understand your learning goals and experience level. Could you tell me more about what you want to achieve and your current skill level?';
  };

  const handleCLOMessage = async (message: string): Promise<string> => {
    if (!cloComplete) {
      // Initial CLO setup
      addMessage('I\'ll create a personalized learning plan for you. Here are the recommended learning parameters:', 'clo');
      
      setTimeout(() => {
        addMessage('• Time investment: 15-20 hours per week\n• Theory 30%, Practice 40%, Project 30%\n• Budget guidance: Optional paid resources ≤ $75\n\nDo you agree with these parameters?', 'clo');
      }, 1000);
      
      setCloComplete(true);
      return 'Setting up your learning parameters. Please review and confirm.';
    }
    
    if (message.toLowerCase().includes('agree') || message.toLowerCase().includes('yes') || message.toLowerCase().includes('confirm')) {
      addMessage('Excellent! Now I\'ll generate your personalized learning plan. This will include specific modules, resources, and assessment criteria tailored to your goals.', 'clo');
      
      setTimeout(() => {
        // Generate mock learning plan
        const plan: LearningPlan = {
          id: 'plan-1',
          title: 'Machine Learning Fundamentals',
          summary: 'A comprehensive introduction to ML concepts, algorithms, and practical applications.',
          fullContent: {
            modules: [
              { title: 'Introduction to ML', duration: 120, objectives: ['Understand basic ML concepts', 'Identify ML use cases'] },
              { title: 'Supervised Learning', duration: 180, objectives: ['Learn regression and classification', 'Implement basic algorithms'] },
              { title: 'Practical Project', duration: 240, objectives: ['Build a simple ML model', 'Deploy and test your solution'] }
            ]
          },
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
            { type: 'Tool', title: 'Jupyter Notebooks', url: '#', description: 'Interactive development environment' }
          ],
          assessmentCriteria: [
            'Complete all module exercises with 80%+ accuracy',
            'Successfully implement and deploy ML model',
            'Demonstrate understanding through project presentation'
          ],
          isApproved: false
        };
        
        setLearningPlan(plan);
        addMessage('Your learning plan is ready! Here\'s a summary of what we\'ll cover:', 'clo');
      }, 2000);
      
      return 'Generating your personalized learning plan. This will take a moment...';
    }
    
    return 'Please confirm that you agree with the learning parameters so I can create your personalized plan.';
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

  const handleSocraticMessage = async (message: string): Promise<string> => {
    if (!currentSession) {
      return 'Please start a learning session first before engaging in Socratic practice.';
    }
    
    // Simulate Socratic questioning
    const socraticQuestions = [
      'That\'s an interesting perspective. What makes you think that approach would work best?',
      'How does this concept relate to what we learned earlier about supervised learning?',
      'Can you think of a real-world example where this principle applies?',
      'What assumptions are you making, and how might they affect your conclusion?',
      'How would you explain this concept to someone with no technical background?'
    ];
    
    const randomQuestion = socraticQuestions[Math.floor(Math.random() * socraticQuestions.length)];
    return randomQuestion;
  };

  const handleTAMessage = async (message: string): Promise<string> => {
    if (!currentSession) {
      return 'Please start a learning session first before accessing Teaching Assistant support.';
    }
    
    // Simulate TA guidance
    const taGuidance = [
      'Let me break this down step by step. First, we need to understand the data structure...',
      'Here\'s a practical example: imagine you\'re trying to predict house prices based on square footage...',
      'The key insight here is that we\'re not just memorizing formulas, but understanding the underlying principles...',
      'Let\'s work through this together. Can you show me what you\'ve tried so far?',
      'Great question! This is a common point of confusion. Let me clarify...'
    ];
    
    const randomGuidance = taGuidance[Math.floor(Math.random() * taGuidance.length)];
    return randomGuidance;
  };

  const approveLearningPlan = () => {
    if (learningPlan) {
      setLearningPlan({ ...learningPlan, isApproved: true });
      addMessage('Excellent! Your learning plan has been approved. I\'ll now transition you to the Learning Instructor to begin your journey.', 'clo');
      
      setTimeout(() => {
        setActiveTab('instructor');
        addMessage('Welcome to your Learning Instructor! I\'ll guide you through each module of your approved learning plan. Say "start" when you\'re ready to begin.', 'instructor');
      }, 2000);
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

  const getTabIcon = (tab: AgentTab) => {
    switch (tab) {
      case 'onboard': return <Users className="w-5 h-5" />;
      case 'clo': return <BookOpen className="w-5 h-5" />;
      case 'instructor': return <Brain className="w-5 h-5" />;
      case 'socratic': return <MessageSquare className="w-5 h-5" />;
      case 'ta': return <Target className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTabLabel = (tab: AgentTab) => {
    switch (tab) {
      case 'onboard': return 'Onboard';
      case 'clo': return 'CLO';
      case 'instructor': return 'Instructor';
      case 'socratic': return 'Socratic';
      case 'ta': return 'TA';
      default: return 'Unknown';
    }
  };

  const getTabColor = (tab: AgentTab) => {
    switch (tab) {
      case 'onboard': return 'from-purple-500 to-pink-500';
      case 'clo': return 'from-blue-500 to-emerald-500';
      case 'instructor': return 'from-indigo-500 to-purple-500';
      case 'socratic': return 'from-cyan-500 to-blue-500';
      case 'ta': return 'from-green-500 to-teal-500';
      default: return 'from-gray-500 to-gray-600';
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
              Seamlessly navigate between AI agents for a complete learning experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Agent Navigation */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="space-y-4"
              >
                {(['onboard', 'clo', 'instructor', 'socratic', 'ta'] as AgentTab[]).map((tab) => (
                  <motion.button
                    key={tab}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${
                      activeTab === tab
                        ? `border-white/30 bg-gradient-to-r ${getTabColor(tab)} text-white shadow-lg`
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-blue-200/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activeTab === tab ? 'bg-white/20' : 'bg-white/10'
                      }`}>
                        {getTabIcon(tab)}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{getTabLabel(tab)}</div>
                        <div className="text-xs opacity-70">
                          {tab === 'onboard' && 'Goal Setting'}
                          {tab === 'clo' && 'Plan Creation'}
                          {tab === 'instructor' && 'Learning Guide'}
                          {tab === 'socratic' && 'Deep Questions'}
                          {tab === 'ta' && 'Hands-on Help'}
                        </div>
                      </div>
                      {activeTab === tab && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Agent Interface */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/5 backdrop-blur-md border-white/20 shadow-2xl rounded-lg border min-h-[600px]"
              >
                {/* Agent Header */}
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getTabColor(activeTab)} rounded-lg flex items-center justify-center`}>
                      {getTabIcon(activeTab)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {getTabLabel(activeTab)} - {activeTab === 'onboard' && 'Learning Onboarding'}
                        {activeTab === 'clo' && 'Curriculum Learning Officer'}
                        {activeTab === 'instructor' && 'Learning Instructor'}
                        {activeTab === 'socratic' && 'Socratic Practice'}
                        {activeTab === 'ta' && 'Teaching Assistant'}
                      </h3>
                      <p className="text-sm text-blue-200/70">
                        {activeTab === 'onboard' && 'Set your learning goals and experience level'}
                        {activeTab === 'clo' && 'Generate personalized learning plans'}
                        {activeTab === 'instructor' && 'Guide you through your learning journey'}
                        {activeTab === 'socratic' && 'Explore concepts through deep questioning'}
                        {activeTab === 'ta' && 'Get hands-on guidance and practical help'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Agent Content */}
                <div className="p-6">
                  {/* CLO Plan Display */}
                  {activeTab === 'clo' && learningPlan && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6"
                    >
                      <Card className="p-6 bg-blue-50/10 border-blue-500/20">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white">
                            Your Learning Plan: {learningPlan.title}
                          </h4>
                          <Button
                            onClick={() => setShowFullPlan(!showFullPlan)}
                            variant="outline"
                            size="sm"
                            className="text-blue-200 border-blue-500/30 hover:bg-blue-500/20"
                          >
                            {showFullPlan ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                            {showFullPlan ? 'Show Summary' : 'Show Full Plan'}
                          </Button>
                        </div>

                        {!showFullPlan ? (
                          <div className="space-y-4">
                            <p className="text-blue-200/90">{learningPlan.summary}</p>
                            <div className="flex items-center space-x-4 text-sm text-blue-200/70">
                              <span className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>{learningPlan.estimatedDuration} minutes</span>
                              </span>
                              <span className="flex items-center space-x-2">
                                <Target className="w-4 h-4" />
                                <span>{learningPlan.learningObjectives.length} objectives</span>
                              </span>
                            </div>
                            {!learningPlan.isApproved && (
                              <Button
                                onClick={approveLearningPlan}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve & Start Learning
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <LearningObjectives 
                              objectives={learningPlan.learningObjectives}
                              defaultOpen={true}
                            />
                            <KeyConcepts 
                              concepts={learningPlan.keyConcepts}
                              defaultOpen={false}
                            />
                            <Resources 
                              resources={learningPlan.resources}
                              defaultOpen={false}
                            />
                            <CollapsibleMarkdown title="Assessment Criteria" defaultOpen={false}>
                              <ul className="space-y-2">
                                {learningPlan.assessmentCriteria.map((criteria, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-blue-200/90">{criteria}</span>
                                  </li>
                                ))}
                              </ul>
                            </CollapsibleMarkdown>
                            {!learningPlan.isApproved && (
                              <Button
                                onClick={approveLearningPlan}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve & Start Learning
                              </Button>
                            )}
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  )}

                  {/* Messages Display */}
                  <div className="h-80 mb-6 overflow-y-auto space-y-4 pr-4">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.type === 'user' ? (
                            <div className="max-w-[80%] bg-blue-600 text-white p-3 rounded-lg rounded-br-md">
                              <p className="text-sm">{message.content}</p>
                              <span className="text-xs opacity-70 mt-2 block">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          ) : (
                            <div className="max-w-[80%] bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold text-white">
                                  {getTabLabel(message.agentId as AgentTab)}
                                </span>
                                <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                                  Active
                                </span>
                              </div>
                              <p className="text-blue-200/90">{message.content}</p>
                              <span className="text-xs text-blue-200/60 mt-3 block">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              {[0, 1, 2].map(i => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 bg-blue-400 rounded-full"
                                  animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5]
                                  }}
                                  transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay: i * 0.1
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-blue-200/70">
                              {getTabLabel(activeTab)} is thinking...
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-white/20 pt-6">
                    <div className="flex items-center space-x-3">
                      <button className="p-2 text-blue-200/70 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Ask ${getTabLabel(activeTab)} anything...`}
                        className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-blue-200/50"
                        disabled={isLoading}
                      />
                      <FeatureGate 
                        feature="voice_synthesis"
                        fallback={
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="text-gray-300"
                            title="Voice features require Pro subscription"
                          >
                            <Mic className="w-4 h-4" />
                          </Button>
                        }
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleVoiceInput}
                          className={voice.isListening ? 'text-red-600' : 'text-blue-200/70 hover:text-white'}
                          disabled={!voice.hasVoiceSupport}
                        >
                          {voice.isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                      </FeatureGate>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        loading={isLoading}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {voice.isListening && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 text-center"
                      >
                        <div className="bg-red-100/10 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg inline-flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">Listening...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Bottom Tabs for Socratic/TA (only visible in instructor mode) */}
              {activeTab === 'instructor' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="bg-white/5 backdrop-blur-md border-white/20 shadow-2xl rounded-lg border"
                >
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 text-center">
                      Choose Your Learning Mode
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('socratic')}
                        className="p-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300"
                      >
                        <div className="text-center space-y-3">
                          <MessageSquare className="w-8 h-8 text-cyan-400 mx-auto" />
                          <div>
                            <div className="font-semibold text-white">Socratic Practice</div>
                            <div className="text-sm text-cyan-200/70">Deep questioning to explore concepts</div>
                          </div>
                        </div>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('ta')}
                        className="p-6 bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 rounded-lg hover:from-green-500/30 hover:to-teal-500/30 transition-all duration-300"
                      >
                        <div className="text-center space-y-3">
                          <Target className="w-8 h-8 text-green-400 mx-auto" />
                          <div>
                            <div className="font-semibold text-white">Teaching Assistant</div>
                            <div className="text-sm text-green-200/70">Hands-on guidance and practical help</div>
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating atmospheric effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-blue-300/40 rounded-full animate-pulse" />
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-blue-400/60 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-slate-300/50 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
};
