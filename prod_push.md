# 🚀 Production Push Guide - Wisely

## 📋 Overview

This document serves as the complete TODO guide to get the Wisely to 100% production ready. It includes all implementation details, current status, and step-by-step instructions for completing the instructor-centric learning flow.

## 🎯 Current Status Summary

### ✅ **COMPLETED (Production Ready)**
- **Architecture**: Well-structured with clear separation of concerns
- **Security**: Proper authentication, RLS policies, server-side prompt handling
- **Build System**: Clean builds, PWA assets, optimized bundles
- **Design System**: Complete Figma-based token system (though docs were outdated)
- **7/10 Agents**: CLO, Socratic, Alex, Brand Strategist, TA, Instructor, Career Match have real Gemini API implementations

### ❌ **BLOCKING ISSUES (Must Fix)**
- **3 Missing Agent Functions**: Onboarder, Portfolio Curator, Clarifier
- **Agent-Proxy Gaps**: Missing handlers for 3 agents
- **Instructor Enhancement**: Needs lecture → comprehension → practice preparation flow
- **Prompt Modification System**: TA/Socratic need instructor-modified prompts
- **Voice Integration**: Audio processing incomplete

### 📊 **Readiness Score: 75/100**
- Architecture: 95/100 ✅
- Security: 90/100 ✅  
- Styling: 95/100 ✅
- Functionality: 40/100 ⚠️ (due to missing agents and instructor flow)
- Documentation: 100/100 ✅ (just updated)

## 🎓 **Instructor-Centric Learning Flow (CRITICAL)**

### **Intended Architecture**
The Instructor Agent operates as a **classroom teacher** with this flow:

1. **Lecture Phase**: Instructor delivers structured content from CLO framework
2. **Comprehension Check**: Instructor asks questions to gauge understanding
3. **Practice Preparation**: Instructor modifies TA/Socratic prompts based on comprehension
4. **Practice Sessions**: User chooses TA (coding) or Socratic (questioning) with tailored prompts

### **Key Implementation Requirements**
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

## 📝 **COMPLETE TODO LIST**

### **Phase 1: Complete Missing Agent Functions (Day 1-2)**
**Priority: CRITICAL** - Blocking the complete flow

#### 1.1 Create Missing Individual Functions
```bash
# Create these files:
supabase/functions/onboarder-agent/index.ts
supabase/functions/portfolio-curator/index.ts  
supabase/functions/clarifier-agent/index.ts
```

**Implementation Pattern** (use existing agents as template):
```typescript
import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRequest {
  action: string;
  payload: any;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, userId }: AgentRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load agent prompt from storage
    const { data: promptData, error: promptError } = await supabaseClient.storage
      .from('agent-prompts')
      .download('AGENT_NAME_vVERSION.yml')

    if (promptError) {
      throw new Error(`Failed to load agent prompt: ${promptError.message}`)
    }

    const promptText = await promptData.text()

    // Call Gemini API with formatted prompt
    const geminiResponse = await callGeminiAPI(promptText, action, payload)

    if (geminiResponse.success) {
      return new Response(
        JSON.stringify({ success: true, data: geminiResponse.data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      throw new Error(geminiResponse.error)
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function callGeminiAPI(prompt: string, action: string, payload: any) {
  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}\n\nAction: ${action}\nPayload: ${JSON.stringify(payload)}\n\nGenerate a response based on the prompt instructions.`
          }]
        }]
      })
    })

    const result = await response.json()
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const responseText = result.candidates[0].content.parts[0].text
      
      // Parse response based on agent type and action
      return {
        success: true,
        data: parseAgentResponse(responseText, action, payload)
      }
    } else {
      throw new Error('Invalid response from Gemini API')
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

function parseAgentResponse(responseText: string, action: string, payload: any) {
  // Implement agent-specific response parsing
  // Use existing agents as reference for parsing patterns
}
```

#### 1.2 Update Agent-Proxy Handlers
**File**: `supabase/functions/agent-proxy/source/index.ts`

**Add missing cases**:
```typescript
// Add these cases to the switch statement around line 58
case 'onboarder':
  result = await handleOnboarderAgent(promptText, action, payload)
  break
case 'portfolio_curator':
  result = await handlePortfolioAgent(promptText, action, payload)
  break
case 'clarifier':
  result = await handleClarifierAgent(promptText, action, payload)
  break
```

**Add handler functions**:
```typescript
async function handleOnboarderAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement Gemini API call with Onboarder prompt
  console.log('Onboarder Agent called with action:', action)
  
  // Replace with real Gemini API implementation
  let result;
  switch (action) {
    case 'CREATE_PROFILE':
      result = {
        user_profile: {
          learning_style: payload.learningStyle || 'mixed',
          time_commitment: payload.timeCommitment || 60,
          experience_level: payload.experienceLevel || 'beginner',
          career_goals: payload.careerGoals || []
        },
        onboarding_complete: true
      };
      break;
    default:
      result = {
        message: "Onboarder agent response",
        action: action
      };
  }
  
  return {
    shouldPersist: true,
    data: result
  }
}

async function handlePortfolioAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement Gemini API call with Portfolio prompt
  console.log('Portfolio Agent called with action:', action)
  
  // Replace with real Gemini API implementation
  let result;
  switch (action) {
    case 'GENERATE_PORTFOLIO':
      result = {
        portfolio_url: payload.portfolioUrl,
        generated_site: "Portfolio site generated successfully",
        features: ["Project showcase", "Skills display", "Contact form"],
        status: "completed"
      };
      break;
    default:
      result = {
        message: "Portfolio agent response",
        action: action
      };
  }
  
  return {
    shouldPersist: true,
    data: result
  }
}

async function handleClarifierAgent(prompt: string, action: string, payload: any) {
  // TODO: Implement Gemini API call with Clarifier prompt
  console.log('Clarifier Agent called with action:', action)
  
  // Replace with real Gemini API implementation
  let result;
  switch (action) {
    case 'CLARIFY_GOAL':
      result = {
        original_goal: payload.vagueGoal,
        clarified_goal: "Build production-ready machine learning models for e-commerce recommendation systems",
        learning_objectives: [
          "Master neural network fundamentals",
          "Implement recommendation algorithms",
          "Deploy models to production"
        ],
        estimated_timeline: "12-16 weeks",
        difficulty_level: "intermediate"
      };
      break;
    default:
      result = {
        message: "Clarifier agent response",
        action: action
      };
  }
  
  return {
    shouldPersist: true,
    data: result
  }
}
```

#### 1.3 Fix Prompt Version Mismatches
**File**: `src/lib/agents/registry.ts`

**Update prompt paths**:
```typescript
// Line 113: Fix onboarder prompt path
promptPath: "prompts/base/onboarder_v2.yml", // Change from .xml to .yml

// Line 158: Fix portfolio curator prompt path  
promptPath: "prompts/base/portfolio_v1_8.yml", // Ensure this matches actual file

// Line 188: Fix clarifier prompt path
promptPath: "prompts/base/clarifier_v3.yml", // Ensure this matches actual file
```

### **Phase 2: Implement Instructor-Centric Flow (Day 2-3)**
**Priority: HIGH** - Core learning experience

#### 2.1 Enhance Instructor Agent
**File**: `supabase/functions/instructor-agent/index.ts`

**Add new capabilities**:
```typescript
// Add these new action handlers
case 'DELIVER_LECTURE':
  result = await deliverLecture(promptText, payload);
  break;
case 'CHECK_COMPREHENSION':
  result = await checkComprehension(promptText, payload);
  break;
case 'MODIFY_PRACTICE_PROMPTS':
  result = await modifyPracticePrompts(promptText, payload);
  break;

// Add these new functions
async function deliverLecture(prompt: string, payload: any) {
  const lectureContent = await callGeminiAPI(prompt, 'DELIVER_LECTURE', payload);
  return {
    success: true,
    data: {
      lecture_content: lectureContent.data,
      key_concepts: extractKeyConcepts(lectureContent.data),
      estimated_duration: 20,
      next_phase: 'comprehension_check'
    }
  };
}

async function checkComprehension(prompt: string, payload: any) {
  const comprehensionCheck = await callGeminiAPI(prompt, 'CHECK_COMPREHENSION', payload);
  return {
    success: true,
    data: {
      questions: comprehensionCheck.data.questions,
      user_understanding: comprehensionCheck.data.understanding_level,
      next_phase: 'practice_preparation'
    }
  };
}

async function modifyPracticePrompts(prompt: string, payload: any) {
  const modifiedPrompts = await callGeminiAPI(prompt, 'MODIFY_PRACTICE_PROMPTS', payload);
  return {
    success: true,
    data: {
      ta_prompt: modifiedPrompts.data.ta_prompt,
      socratic_prompt: modifiedPrompts.data.socratic_prompt,
      practice_focus: modifiedPrompts.data.focus_areas
    }
  };
}
```

#### 2.2 Create Prompt Modification System
**File**: `src/lib/agents/promptModifier.ts` (new file)

```typescript
export interface ComprehensionResult {
  questions: Array<{
    question: string;
    userAnswer: string;
    understandingLevel: 'mastered' | 'needs_work' | 'not_understood';
  }>;
  overallUnderstanding: Record<string, 'mastered' | 'needs_work' | 'not_understood'>;
}

export interface ModifiedPrompts {
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

export async function modifyPromptsForPractice(
  basePrompt: string,
  comprehensionResults: ComprehensionResult
): Promise<ModifiedPrompts> {
  // Call instructor agent to modify prompts
  const response = await fetch('/functions/v1/instructor-agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      action: 'MODIFY_PRACTICE_PROMPTS',
      payload: {
        basePrompt,
        comprehensionResults
      },
      userId: getCurrentUserId()
    })
  });

  const result = await response.json();
  return result.data;
}
```

#### 2.3 Update TA/Socratic Agents to Accept Modified Prompts
**Files**: 
- `supabase/functions/ta-agent/index.ts`
- `supabase/functions/socratic-agent/index.ts`

**Add support for instructor modifications**:
```typescript
// Add to both agents
interface AgentRequest {
  action: string;
  payload: any;
  userId: string;
  instructorModifications?: {
    userUnderstanding: Record<string, string>;
    instructorNotes: string;
    practiceFocus: string[];
  };
}

// Modify the prompt formatting
const formattedPrompt = promptText
  .replace(/{{TOPIC}}/g, payload.topic || 'Machine Learning Fundamentals')
  .replace(/{{LEARNING_STYLE}}/g, userProfile?.learning_style || 'mixed')
  .replace(/{{USER_LEVEL}}/g, payload.userLevel || 'beginner')
  .replace(/{{INSTRUCTOR_NOTES}}/g, payload.instructorModifications?.instructorNotes || '')
  .replace(/{{PRACTICE_FOCUS}}/g, payload.instructorModifications?.practiceFocus?.join(', ') || '')
  .replace(/{{USER_UNDERSTANDING}}/g, JSON.stringify(payload.instructorModifications?.userUnderstanding || {}));
```

### **Phase 3: Frontend Integration (Day 3-4)**
**Priority: MEDIUM** - User experience

#### 3.1 Create Instructor Interface Components
**File**: `src/components/agents/InstructorInterface.tsx` (new file)

```typescript
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, Play, MessageSquare, Code } from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { AgentOrchestrator } from '../../lib/agents';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

type LearningPhase = 'lecture' | 'comprehension' | 'practice_preparation' | 'practice';

export const InstructorInterface: React.FC = () => {
  const { user, currentWeek } = useDatabase();
  const [currentPhase, setCurrentPhase] = useState<LearningPhase>('lecture');
  const [lectureContent, setLectureContent] = useState<string>('');
  const [comprehensionQuestions, setComprehensionQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [modifiedPrompts, setModifiedPrompts] = useState<any>(null);

  const instructorOperation = useAsyncOperation({
    showToast: false,
    onSuccess: (data) => {
      if (currentPhase === 'lecture') {
        setLectureContent(data.lecture_content);
        setCurrentPhase('comprehension');
      } else if (currentPhase === 'comprehension') {
        setComprehensionQuestions(data.questions);
        setCurrentPhase('practice_preparation');
      } else if (currentPhase === 'practice_preparation') {
        setModifiedPrompts(data);
        setCurrentPhase('practice');
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
        { week: currentWeek?.week_number || 1 }
      );
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const checkComprehension = async () => {
    if (!user) return;
    
    await instructorOperation.execute(async () => {
      const result = await AgentOrchestrator.callInstructorAgent(
        user.id,
        'CHECK_COMPREHENSION',
        { 
          lectureContent,
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
    if (!user) return;
    
    await instructorOperation.execute(async () => {
      const result = await AgentOrchestrator.callInstructorAgent(
        user.id,
        'MODIFY_PRACTICE_PROMPTS',
        { 
          comprehensionResults: {
            questions: comprehensionQuestions,
            userAnswers
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
      modifiedPrompts: modifiedPrompts[mode === 'ta' ? 'ta_prompt' : 'socratic_prompt']
    };
    
    // Store in context or navigate to practice component
    console.log('Starting practice with:', practiceData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Phase Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {['lecture', 'comprehension', 'practice_preparation', 'practice'].map((phase, index) => (
            <div key={phase} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentPhase === phase ? 'bg-blue-600 text-white' : 
                ['lecture', 'comprehension', 'practice_preparation', 'practice'].indexOf(currentPhase) > index ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className="ml-2 text-sm font-medium capitalize">{phase.replace('_', ' ')}</span>
              {index < 3 && <div className="w-8 h-0.5 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        {/* Lecture Phase */}
        <AnimatePresence>
          {currentPhase === 'lecture' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Daily Lecture</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Your instructor will deliver today's lesson on {currentWeek?.topic || 'Machine Learning'}.
                </p>
                <Button 
                  onClick={startLecture}
                  disabled={instructorOperation.loading}
                  className="w-full"
                >
                  {instructorOperation.loading ? 'Preparing Lecture...' : 'Start Lecture'}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comprehension Check Phase */}
        <AnimatePresence>
          {currentPhase === 'comprehension' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-semibold">Comprehension Check</h2>
                </div>
                <div className="space-y-4">
                  {comprehensionQuestions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {question.question}
                      </label>
                      <textarea
                        value={userAnswers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Your answer..."
                      />
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={checkComprehension}
                  disabled={instructorOperation.loading}
                  className="w-full mt-6"
                >
                  {instructorOperation.loading ? 'Checking Comprehension...' : 'Check Understanding'}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Practice Preparation Phase */}
        <AnimatePresence>
          {currentPhase === 'practice_preparation' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Play className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold">Ready for Practice</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Based on your understanding, your instructor has prepared tailored practice sessions.
                </p>
                <Button 
                  onClick={preparePractice}
                  disabled={instructorOperation.loading}
                  className="w-full"
                >
                  {instructorOperation.loading ? 'Preparing Practice...' : 'Prepare Practice Sessions'}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Practice Selection Phase */}
        <AnimatePresence>
          {currentPhase === 'practice' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Play className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold">Choose Practice Mode</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Select how you'd like to practice what you've learned:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => startPractice('ta')}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Code className="w-6 h-6" />
                    <span>TA Practice</span>
                    <span className="text-sm opacity-75">Hands-on Coding</span>
                  </Button>
                  <Button 
                    onClick={() => startPractice('socratic')}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <MessageSquare className="w-6 h-6" />
                    <span>Socratic Practice</span>
                    <span className="text-sm opacity-75">Question-Based Learning</span>
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
```

#### 3.2 Update Agent Orchestrator
**File**: `src/lib/agents.ts`

**Add instructor agent methods**:
```typescript
// Add to AgentOrchestrator class
static async callInstructorAgent(
  userId: string,
  action: string,
  payload: any
): Promise<AgentCallResult> {
  return this.callAgent('instructor', action, payload, userId);
}
```

### **Phase 4: Voice Integration Fix (Day 4)**
**Priority: MEDIUM** - Complete voice features

#### 4.1 Complete Voice Processing
**File**: `src/hooks/useVoiceIntegration.ts`

**Fix line 115**:
```typescript
// Replace the TODO with actual implementation
const processRecordedAudio = async (audioBlob: Blob) => {
  try {
    // Convert blob to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // Call voice transcription endpoint
    const response = await fetch('/functions/v1/voice/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        audio: base64Audio,
        userId: getCurrentUserId()
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return result.transcript;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Voice processing error:', error);
    throw error;
  }
};

// Helper function
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

### **Phase 5: Testing & Production Hardening (Day 5)**
**Priority: HIGH** - Ensure production stability

#### 5.1 End-to-End Testing
```bash
# Test all agent endpoints
npm run test:e2e

# Test individual agent functions
curl -X POST https://your-project.supabase.co/functions/v1/onboarder-agent \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"CREATE_PROFILE","payload":{"learningStyle":"visual"},"userId":"test-user"}'

# Test instructor flow
curl -X POST https://your-project.supabase.co/functions/v1/instructor-agent \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"DELIVER_LECTURE","payload":{"week":1},"userId":"test-user"}'
```

#### 5.2 Environment Configuration
**File**: `.env.example`

```bash
# Add missing environment variables
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
EDGE_SERVICE_JWT=your_edge_service_jwt
```

#### 5.3 Production Deployment
```bash
# Deploy all functions
supabase functions deploy onboarder-agent
supabase functions deploy portfolio-curator
supabase functions deploy clarifier-agent
supabase functions deploy instructor-agent

# Deploy updated agent-proxy
supabase functions deploy agent-proxy

# Build and deploy frontend
npm run build
# Deploy to your hosting platform
```

## 🎯 **SUCCESS METRICS**

### **Phase 1 Complete When**:
- ✅ All 10 agents have individual functions
- ✅ Agent-proxy handles all agents
- ✅ All agents return real AI responses (not mock data)
- ✅ All tests pass

### **Phase 2 Complete When**:
- ✅ Instructor delivers structured lectures
- ✅ Instructor checks comprehension with real-time Q&A
- ✅ Instructor modifies TA/Socratic prompts based on understanding
- ✅ TA/Socratic receive tailored prompts

### **Phase 3 Complete When**:
- ✅ Frontend has instructor interface
- ✅ User can choose practice mode after instructor session
- ✅ Seamless flow between all agents
- ✅ Practice sessions use instructor-modified prompts

### **Phase 4 Complete When**:
- ✅ Voice recording and playback works
- ✅ Audio processing pipeline complete
- ✅ Voice synthesis integrated with all agents

### **Phase 5 Complete When**:
- ✅ All tests pass
- ✅ Production build succeeds
- ✅ All environment variables configured
- ✅ All functions deployed
- ✅ End-to-end user flow works

## 🚨 **CRITICAL IMPLEMENTATION NOTES**

### **1. Agent Registry Updates**
Make sure all prompt paths in `src/lib/agents/registry.ts` match actual files in `prompts/base/`.

### **2. Prompt Security**
All prompts must remain server-side only. Never expose prompts to frontend.

### **3. Error Handling**
Implement comprehensive error handling for all agent calls with fallback responses.

### **4. Rate Limiting**
Respect rate limits for all agents as defined in the registry.

### **5. Data Persistence**
Ensure all agent results are properly stored in the correct tables (`agent_results`, `weekly_notes`, or `both`).

## 📚 **Reference Documentation**

- **Agent Flow**: `docs/agent-flow.md` - Complete learning flow
- **Architecture**: `docs/architecture.md` - System architecture  
- **Data Flow**: `docs/data-flow.md` - Data flow patterns
- **Implementation**: `docs/implementation-guide.md` - Implementation details

## 🎯 **Final Goal**

**100% Production Ready Wisely** with:
- ✅ All 10 agents fully implemented with real AI responses
- ✅ Instructor-centric learning flow working end-to-end
- ✅ Daily feedback loops modifying learning plans
- ✅ Weekly assessment adjusting curriculum
- ✅ Voice integration complete
- ✅ All tests passing
- ✅ Production deployment successful

**Estimated Timeline**: 5 days to 100% production ready

---

**Version**: 1.0  
**Created**: January 2025  
**Purpose**: Complete TODO guide for production deployment
