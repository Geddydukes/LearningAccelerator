import { useState, useCallback, useRef } from 'react'

export interface Message {
  id: string
  type: 'user' | 'agent'
  agentId?: string
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface LearningSession {
  id: string
  type: 'socratic' | 'ta' | 'clo' | 'practice'
  title: string
  description: string
  progress: number
  estimatedTime: string
  isActive: boolean
  agentId: string
}

export interface UnifiedLearningState {
  messages: Message[]
  activeSession: LearningSession | null
  isLoading: boolean
  currentAgent: string | null
  learningSessions: LearningSession[]
  userProgress: {
    streak: number
    totalXP: number
    lessonsCompleted: number
    totalLessons: number
    level: number
    levelTitle: string
  }
}

export const useUnifiedLearning = () => {
  const [state, setState] = useState<UnifiedLearningState>({
    messages: [
      {
        id: '1',
        type: 'agent',
        agentId: 'clo',
        content: 'Welcome back! I see you\'re working on Machine Learning Fundamentals. How can I help you today?',
        timestamp: new Date()
      }
    ],
    activeSession: null,
    isLoading: false,
    currentAgent: 'clo',
    learningSessions: [
      {
        id: '1',
        type: 'socratic',
        title: 'Understanding Neural Networks',
        description: 'Explore fundamentals through guided questioning',
        progress: 65,
        estimatedTime: '25 min',
        isActive: true,
        agentId: 'socratic'
      },
      {
        id: '2',
        type: 'ta',
        title: 'Build a Simple Perceptron',
        description: 'Hands-on coding with step-by-step guidance',
        progress: 0,
        estimatedTime: '45 min',
        isActive: false,
        agentId: 'ta'
      },
      {
        id: '3',
        type: 'clo',
        title: 'Weekly Learning Path',
        description: 'Structured curriculum overview',
        progress: 40,
        estimatedTime: '15 min',
        isActive: false,
        agentId: 'clo'
      }
    ],
    userProgress: {
      streak: 7,
      totalXP: 2450,
      lessonsCompleted: 18,
      totalLessons: 45,
      level: 8,
      levelTitle: 'Advanced Learner'
    }
  })

  const messageQueue = useRef<Message[]>([])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      messages: [...prev.messages, userMessage]
    }))

    // Simulate AI agent coordination
    const agentResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'agent',
      agentId: state.currentAgent || 'clo',
      content: `I'll help you with "${content}". Let me coordinate with our other AI agents to give you the best learning experience.`,
      timestamp: new Date()
    }

    // Add to queue for staggered responses
    messageQueue.current.push(agentResponse)

    // Simulate processing time
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, ...messageQueue.current]
      }))
      messageQueue.current = []
    }, 1500)
  }, [state.currentAgent])

  const startSession = useCallback((session: LearningSession) => {
    setState(prev => ({
      ...prev,
      activeSession: session,
      currentAgent: session.agentId,
      learningSessions: prev.learningSessions.map(s => ({
        ...s,
        isActive: s.id === session.id
      }))
    }))

    // Add session start message
    const sessionMessage: Message = {
      id: Date.now().toString(),
      type: 'agent',
      agentId: session.agentId,
      content: `Starting your ${session.title} session. I'll guide you through this step by step.`,
      timestamp: new Date()
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, sessionMessage]
    }))
  }, [])

  const updateSessionProgress = useCallback((sessionId: string, progress: number) => {
    setState(prev => ({
      ...prev,
      learningSessions: prev.learningSessions.map(s => 
        s.id === sessionId ? { ...s, progress } : s
      )
    }))
  }, [])

  const switchAgent = useCallback((agentId: string) => {
    setState(prev => ({
      ...prev,
      currentAgent: agentId
    }))

    const switchMessage: Message = {
      id: Date.now().toString(),
      type: 'agent',
      agentId,
      content: `Switching to ${getAgentDisplayName(agentId)}. How can I assist you?`,
      timestamp: new Date()
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, switchMessage]
    }))
  }, [])

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: []
    }))
  }, [])

  const getAgentDisplayName = (agentId: string): string => {
    switch (agentId) {
      case 'clo': return 'CLO - Curriculum Architect'
      case 'socratic': return 'Socratic Inquisitor'
      case 'ta': return 'Teaching Assistant'
      case 'brand': return 'Brand Strategist'
      default: return 'AI Assistant'
    }
  }

  return {
    ...state,
    sendMessage,
    startSession,
    updateSessionProgress,
    switchAgent,
    clearMessages
  }
} 