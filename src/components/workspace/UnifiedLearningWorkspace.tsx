import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Users, 
  Target, 
  Sparkles, 
  Send, 
  Mic, 
  Paperclip, 
  Settings,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Brain,
  Lightbulb
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'agent'
  agentId?: string
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

interface LearningSession {
  id: string
  type: 'socratic' | 'ta' | 'clo' | 'practice'
  title: string
  description: string
  progress: number
  estimatedTime: string
  isActive: boolean
}

export const UnifiedLearningWorkspace = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      agentId: 'clo',
      content: 'Welcome back! I see you\'re working on Machine Learning Fundamentals. How can I help you today?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const learningSessions: LearningSession[] = [
    {
      id: '1',
      type: 'socratic',
      title: 'Understanding Neural Networks',
      description: 'Explore fundamentals through guided questioning',
      progress: 65,
      estimatedTime: '25 min',
      isActive: true
    },
    {
      id: '2',
      type: 'ta',
      title: 'Build a Simple Perceptron',
      description: 'Hands-on coding with step-by-step guidance',
      progress: 0,
      estimatedTime: '45 min',
      isActive: false
    },
    {
      id: '3',
      type: 'clo',
      title: 'Weekly Learning Path',
      description: 'Structured curriculum overview',
      progress: 40,
      estimatedTime: '15 min',
      isActive: false
    }
  ]

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        agentId: 'clo',
        content: `I'll help you with "${inputValue}". Let me create a personalized learning path and coordinate with our other AI agents to give you the best experience.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentResponse])
      setIsLoading(false)
    }, 1500)
  }

  const startSession = (session: LearningSession) => {
    setActiveSession(session)
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'agent',
      agentId: session.type,
      content: `Starting your ${session.title} session. I'll guide you through this step by step.`,
      timestamp: new Date()
    }])
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Blue/Black Gradient Background with Vignette Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-black">
        {/* Smooth gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-800/30 to-slate-900/20" />
        
        {/* Vignette effect - dark edges */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60" />
        
        {/* Additional subtle patterns */}
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
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl text-white mb-2 font-bold">Learning Accelerator</h1>
                <p className="text-blue-200/80">Unified AI-Powered Learning Experience</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-blue-200/70">Progress</div>
                  <div className="text-lg text-white font-semibold">65% Complete</div>
                </div>
                <button className="p-2 text-blue-200/70 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Learning Workspace */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Learning Session */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <div className="bg-white/5 backdrop-blur-md border-blue-500/20 shadow-2xl rounded-lg border">
                  <div className="p-6 border-b border-blue-500/20">
                    <h3 className="text-white flex items-center gap-2 text-lg font-semibold mb-2">
                      <Brain className="w-5 h-5 text-blue-300" />
                      Active Learning Session
                    </h3>
                    <p className="text-blue-200/70 mb-4">
                      {activeSession ? activeSession.title : 'Choose a learning session to begin'}
                    </p>
                  </div>
                  <div className="p-6">
                    {activeSession ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-200/70">Session Progress</span>
                          <span className="text-sm text-white">{activeSession.progress}%</span>
                        </div>
                        <div className="w-full bg-blue-900/50 rounded-full h-3">
                          <div 
                            className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${activeSession.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-blue-200/60">
                          <Clock className="w-4 h-4" />
                          <span>Estimated time: {activeSession.estimatedTime}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Lightbulb className="w-12 h-12 text-blue-300/50 mx-auto mb-4" />
                        <p className="text-blue-200/70">Select a learning session to start your journey</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* AI Conversation Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <div className="bg-white/5 backdrop-blur-md border-blue-500/20 shadow-2xl rounded-lg border">
                  <div className="p-6 border-b border-blue-500/20">
                    <h3 className="text-white flex items-center gap-2 text-lg font-semibold mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-300" />
                      AI Learning Assistant
                    </h3>
                    <p className="text-blue-200/70 mb-4">
                      Your personal AI tutors working together
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="h-64 mb-4 overflow-y-auto">
                      <div className="space-y-4 pr-4">
                        <AnimatePresence>
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                            >
                              <MessageBubble message={message} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center space-x-2 text-blue-200/70"
                          >
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <span className="text-sm">AI is thinking...</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Unified Input Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="bg-white/5 backdrop-blur-md border-blue-500/20 shadow-2xl rounded-lg border">
                  <div className="p-6 pt-6">
                    <div className="flex items-center space-x-3">
                      <button className="p-2 text-blue-200/70 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input
                        placeholder="Ask your AI tutors anything..."
                        className="flex-1 bg-white/5 border border-blue-500/30 text-white placeholder:text-blue-200/50 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button className="p-2 text-blue-200/70 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                        <Mic className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleSendMessage}
                        className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-md transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Learning Sessions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <div className="bg-white/5 backdrop-blur-md border-blue-500/20 shadow-2xl rounded-lg border">
                  <div className="p-6 border-b border-blue-500/20">
                    <h3 className="text-white flex items-center gap-2 text-lg font-semibold mb-2">
                      <Target className="w-5 h-5 text-blue-300" />
                      Learning Sessions
                    </h3>
                    <p className="text-blue-200/70 mb-4">
                      Choose your learning path
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {learningSessions.map((session) => (
                        <motion.div
                          key={session.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <button
                            className={`w-full h-auto p-3 justify-start rounded-md transition-colors ${
                              session.isActive 
                                ? 'bg-blue-500/20 border border-blue-500/30' 
                                : 'bg-white/5 hover:bg-white/10 border border-transparent'
                            }`}
                            onClick={() => startSession(session)}
                          >
                            <div className="flex items-start space-x-3 w-full">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                session.type === 'socratic' ? 'bg-blue-400' :
                                session.type === 'ta' ? 'bg-green-400' :
                                session.type === 'clo' ? 'bg-purple-400' : 'bg-orange-400'
                              }`} />
                              <div className="flex-1 text-left">
                                <div className="text-white font-medium text-sm">{session.title}</div>
                                <div className="text-blue-200/60 text-xs">{session.description}</div>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-blue-200/50 text-xs">{session.estimatedTime}</span>
                                  <span className="text-blue-200/70 text-xs">{session.progress}%</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <div className="bg-white/5 backdrop-blur-md border-blue-500/20 shadow-2xl rounded-lg border">
                  <div className="p-6 border-b border-blue-500/20">
                    <h3 className="text-white flex items-center gap-2 text-lg font-semibold mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-300" />
                      Your Progress
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-blue-200/70">Study Streak</span>
                        <span className="text-white font-semibold">7 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200/70">Total XP</span>
                        <span className="text-white font-semibold">2,450</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200/70">Lessons Completed</span>
                        <span className="text-white font-semibold">18/45</span>
                      </div>
                      <div className="border-t border-blue-500/20 my-4" />
                      <div className="text-center">
                        <div className="text-2xl text-blue-300 font-bold">Level 8</div>
                        <div className="text-xs text-blue-200/60">Advanced Learner</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI Agents Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="bg-white/5 backdrop-blur-md border-blue-500/20 shadow-2xl rounded-lg border">
                  <div className="p-6 border-b border-blue-500/20">
                    <h3 className="text-white flex items-center gap-2 text-lg font-semibold mb-2">
                      <Zap className="w-5 h-5 text-blue-300" />
                      AI Agents
                    </h3>
                    <p className="text-blue-200/70 mb-4">
                      All systems operational
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {[
                        { id: 'clo', name: 'CLO', status: 'Active', color: 'bg-purple-500' },
                        { id: 'socratic', name: 'Socratic', status: 'Ready', color: 'bg-blue-500' },
                        { id: 'ta', name: 'Teaching Assistant', status: 'Ready', color: 'bg-green-500' },
                        { id: 'brand', name: 'Brand Strategist', status: 'Ready', color: 'bg-orange-500' }
                      ].map((agent) => (
                        <div key={agent.id} className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${agent.color}`} />
                          <div className="flex-1">
                            <div className="text-white text-sm">{agent.name}</div>
                            <div className="text-blue-200/60 text-xs">{agent.status}</div>
                          </div>
                          <span 
                            className={`text-xs px-2 py-1 rounded-full ${
                              agent.status === 'Active' 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {agent.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
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
  )
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.type === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'space-x-3'}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
          {message.agentId?.toUpperCase() || 'A'}
        </div>
      )}

      <div className={`max-w-2xl ${isUser ? 'bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3' : ''}`}>
        {!isUser && (
          <div className="p-4 border-0 bg-white/5 backdrop-blur-sm rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-white">
                {getAgentName(message.agentId)}
              </span>
              <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">Active</span>
            </div>
            <p className="text-blue-200/90">{message.content}</p>
            <span className="text-xs text-blue-200/60 mt-3 block">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        )}

        {isUser && (
          <>
            <p>{message.content}</p>
            <span className="text-xs text-blue-200 mt-2 block">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

const getAgentName = (agentId?: string) => {
  switch (agentId) {
    case 'clo': return 'CLO - Curriculum Architect'
    case 'socratic': return 'Socratic Inquisitor'
    case 'ta': return 'Teaching Assistant'
    case 'brand': return 'Brand Strategist'
    default: return 'AI Assistant'
  }
} 