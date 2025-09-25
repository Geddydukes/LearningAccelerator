# Implementation Guide: Wisely Education Agent

## Overview

This guide outlines the implementation of **Wisely's Education Agent (Guru)** system, featuring an instructor-centric learning flow where the Instructor Agent operates as a classroom teacher, delivering structured lectures, checking comprehension, and preparing students for targeted practice sessions.

## 🎓 Core Learning Flow Implementation

### Phase 1: Instructor Agent Enhancement

The Instructor Agent needs to be enhanced to operate as a classroom teacher with three key phases:

#### 1. Lecture Delivery Phase
```typescript
interface InstructorAgent {
  deliverLecture(basePrompt: CLOPrompt): Promise<LectureContent>;
  checkComprehension(lectureContent: LectureContent): Promise<ComprehensionCheck>;
  modifyPracticePrompts(
    basePrompt: CLOPrompt, 
    comprehensionResults: ComprehensionCheck
  ): Promise<ModifiedPrompts>;
}
```

#### 2. Comprehension Check Phase
```typescript
interface ComprehensionCheck {
  questions: Array<{
    question: string;
    userAnswer: string;
    understandingLevel: 'mastered' | 'needs_work' | 'not_understood';
    followUpActions: string[];
  }>;
  overallUnderstanding: Record<string, 'mastered' | 'needs_work' | 'not_understood'>;
}
```

#### 3. Practice Preparation Phase
```typescript
interface ModifiedPrompts {
  ta: {
    basePrompt: string;
    userUnderstanding: Record<string, string>;
    instructorNotes: string;
    practiceFocus: string[];
  };
  socratic: {
    basePrompt: string;
    userUnderstanding: Record<string, string>;
    instructorNotes: string;
    socraticFocus: string[];
  };
}
```

### Phase 2: Prompt Modification System

The system needs to modify TA/Socratic prompts based on Instructor comprehension checks:

```typescript
// Example: TA Agent receives modified prompt
const modifiedTAPrompt = {
  topic: "Neural Networks",
  exercises: ["Build simple NN", "Test with data", "Optimize parameters"],
  difficulty: "intermediate",
  user_understanding: {
    basic_concepts: "mastered",
    bias_variance: "needs_reinforcement", 
    optimization: "not_covered"
  },
  instructor_notes: "User understands basic NN structure but struggled with bias-variance tradeoff. Focus TA exercises on this concept.",
  practice_focus: "bias_variance_tradeoff"
};
```

### Phase 3: Frontend Interface Implementation

#### Instructor Interface Components
```typescript
// Lecture delivery interface
const LectureInterface = () => {
  const [lectureContent, setLectureContent] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<'lecture' | 'comprehension' | 'practice'>('lecture');
  
  return (
    <div className="lecture-container">
      {currentPhase === 'lecture' && <LectureDelivery />}
      {currentPhase === 'comprehension' && <ComprehensionCheck />}
      {currentPhase === 'practice' && <PracticePreparation />}
    </div>
  );
};
```

#### Practice Mode Selection
```typescript
const PracticeSelection = () => {
  const [selectedMode, setSelectedMode] = useState<'ta' | 'socratic' | null>(null);
  
  return (
    <div className="practice-selection">
      <h3>Choose your practice mode:</h3>
      <button onClick={() => setSelectedMode('ta')}>
        TA Practice (Hands-on Coding)
      </button>
      <button onClick={() => setSelectedMode('socratic')}>
        Socratic Practice (Question-Based Learning)
      </button>
    </div>
  );
};
```

## 🔄 Data Flow Implementation

### Daily Learning Session Flow
```typescript
// 1. CLO provides base prompt
const basePrompt = await cloAgent.getDailyPrompt(week, day);

// 2. Instructor delivers lecture and checks comprehension
const instructorSession = await instructorAgent.deliverLecture(basePrompt);

// 3. Instructor modifies prompts based on comprehension
const modifiedPrompts = await instructorAgent.modifyPracticePrompts(
  basePrompt,
  instructorSession.comprehensionChecks
);

// 4. TA/Socratic receive modified prompts
const taResponse = await taAgent.generateExercises(modifiedPrompts.ta);
const socraticResponse = await socraticAgent.generateQuestions(modifiedPrompts.socratic);
```

### Weekly Assessment Loop
```typescript
// 1. Alex grades weekly tasks
const alexAssessment = await alexAgent.gradeWeeklyTasks(userId, week);

// 2. CLO adjusts curriculum based on assessment
const updatedCurriculum = await cloAgent.adjustCurriculum(alexAssessment);

// 3. Next week's learning plan reflects adjustments
const nextWeekPlan = await cloAgent.generateWeeklyPlan(week + 1, updatedCurriculum);
```

## 🚀 Implementation Phases

### Phase 1: Complete Missing Agent Functions (Day 1-2)
- Create missing individual agent functions
- Update agent-proxy handlers
- Test all agent endpoints

### Phase 2: Instructor Agent Enhancement (Day 2-3)
- Implement lecture delivery capability
- Add comprehension check functionality
- Create prompt modification system

### Phase 3: Frontend Integration (Day 3-4)
- Build instructor interface components
- Implement practice mode selection
- Create seamless flow between agents

### Phase 4: Testing & Optimization (Day 4-5)
- End-to-end testing of complete flow
- Performance optimization
- Error handling verification

## 📚 Related Documentation

- [Agent Flow Documentation](./agent-flow.md) - Complete learning flow
- [Architecture Documentation](./architecture.md) - System architecture
- [Data Flow Documentation](./data-flow.md) - Data flow patterns

---

**Version**: 3.0  
**Last Updated**: January 2025  
**Focus**: Instructor-Centric Learning Implementation

## Phase 1: Foundation Setup

### Step 1: Install shadcn/ui
```bash
# Navigate to project directory
cd "/Users/geddydukes/Downloads/Wisely"

# Install shadcn/ui
npx shadcn@latest init

# Choose these options:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
# - React Server Components: No
# - Components directory: @/components
# - Utils directory: @/lib/utils
# - Include example components: No
```

### Step 2: Install Core Components
```bash
# Install essential components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add command
npx shadcn@latest add tabs
npx shadcn@latest add progress
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add scroll-area
npx shadcn@latest add textarea
npx shadcn@latest add separator
```

### Step 3: Update Tailwind Configuration
```bash
# Install additional dependencies
npm install tailwindcss-animate cmdk
```

## Phase 2: Create New Workspace Components

### Step 1: Create Workspace Directory Structure
```bash
mkdir -p src/components/workspace
mkdir -p src/hooks/workspace
mkdir -p src/lib/workspace
```

### Step 2: Create Base Workspace Component
```tsx
// src/components/workspace/ConversationWorkspace.tsx
import React, { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Send, Mic, Paperclip, Settings } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'agent'
  agentId?: string
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export const ConversationWorkspace = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'user',
      content: 'I want to learn React hooks',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'agent',
      agentId: 'clo',
      content: 'I\'ll create a comprehensive curriculum for React hooks. Let me structure this into manageable modules:',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Wisely</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
              Session Active
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Progress: 65% | Time: 23 min | Streak: 7 days
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-white dark:bg-slate-800 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input 
                placeholder="Type your question or learning goal..."
                className="flex-1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button variant="ghost" size="sm">
                <Mic className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.type === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'space-x-3'}`}>
      {!isUser && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={`/${message.agentId}-avatar.jpg`} />
          <AvatarFallback className="bg-blue-500 text-white">
            {message.agentId?.toUpperCase() || 'A'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-2xl ${isUser ? 'bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3' : ''}`}>
        {!isUser && (
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                {getAgentName(message.agentId)}
              </span>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <p className="text-slate-700 dark:text-slate-300">{message.content}</p>
            <span className="text-xs text-slate-500 mt-3 block">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </Card>
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
    case 'alex': return 'Alex - Lead Engineer'
    case 'brand': return 'Brand Strategist'
    default: return 'AI Assistant'
  }
}
```

### Step 3: Create Agent Integration Hook
```tsx
// src/hooks/workspace/useConversation.ts
import { useState, useCallback } from 'react'

interface ConversationState {
  messages: Message[]
  isLoading: boolean
  currentAgent: string | null
}

export const useConversation = () => {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    isLoading: false,
    currentAgent: null
  })

  const sendMessage = useCallback(async (content: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      messages: [...prev.messages, {
        id: Date.now().toString(),
        type: 'user',
        content,
        timestamp: new Date()
      }]
    }))

    // Simulate AI response
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          agentId: 'clo',
          content: `I'll help you with "${content}". Let me create a personalized learning path for you.`,
          timestamp: new Date()
        }]
      }))
    }, 1000)
  })

  return {
    ...state,
    sendMessage
  }
}
```

## Phase 3: Update App Routing

### Step 1: Create New Dashboard Route
```tsx
// src/App.tsx (update existing file)
import { ConversationWorkspace } from './components/workspace/ConversationWorkspace'

// Add new route in the Routes component
<Route
  path="/workspace"
  element={
    <ProtectedRoute>
      <ConversationWorkspace />
    </ProtectedRoute>
  }
/>
```

### Step 2: Update Navigation
```tsx
// src/components/layout/Header.tsx (update existing file)
// Add workspace navigation link
<Button variant="ghost" onClick={() => navigate('/workspace')}>
  <MessageSquare className="w-4 h-4 mr-2" />
  Workspace
</Button>
```

## Phase 4: Testing and Refinement

### Step 1: Create Test File
```tsx
// src/components/workspace/__tests__/ConversationWorkspace.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ConversationWorkspace } from '../ConversationWorkspace'

describe('ConversationWorkspace', () => {
  it('renders conversation interface', () => {
    render(<ConversationWorkspace />)
    
    expect(screen.getByText('Wisely')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your question or learning goal...')).toBeInTheDocument()
  })

  it('sends message when user types and presses enter', () => {
    render(<ConversationWorkspace />)
    
    const input = screen.getByPlaceholderText('Type your question or learning goal...')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })
    
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })
})
```

### Step 2: Run Tests
```bash
npm test ConversationWorkspace
```

## Phase 5: Performance Optimization

### Step 1: Add Virtual Scrolling
```bash
npm install react-window
```

```tsx
// Update ConversationWorkspace to use virtual scrolling for large message lists
import { FixedSizeList as List } from 'react-window'

// Implementation details in the full component
```

### Step 2: Add Message Persistence
```tsx
// src/lib/workspace/messageStorage.ts
export const saveMessages = (messages: Message[]) => {
  localStorage.setItem('conversation-messages', JSON.stringify(messages))
}

export const loadMessages = (): Message[] => {
  const stored = localStorage.getItem('conversation-messages')
  return stored ? JSON.parse(stored) : []
}
```

## Next Steps

1. **Choose Design Option**: Review the comparison document and select your preferred approach
2. **Start Implementation**: Follow the implementation guide for your chosen option
3. **Create Prototype**: Build a working prototype to test the user experience
4. **User Testing**: Gather feedback from target users
5. **Iterate**: Refine based on feedback and testing results

## Quick Start Commands

```bash
# Install shadcn/ui
npx shadcn@latest init

# Install components
npx shadcn@latest add button card input dialog command tabs progress badge avatar dropdown-menu scroll-area

# Create workspace components
mkdir -p src/components/workspace
touch src/components/workspace/ConversationWorkspace.tsx

# Run development server
npm run dev
```

This implementation guide provides a solid foundation for the UI redesign. Choose your preferred design option and follow the step-by-step instructions to create a modern, unified learning interface. 