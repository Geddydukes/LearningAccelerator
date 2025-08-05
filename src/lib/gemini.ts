// Agent proxy client - calls Supabase Edge Functions instead of Gemini directly
// This ensures API keys and prompts are secure on the server side

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AgentRequest {
  agent: 'clo' | 'socratic' | 'alex' | 'brand';
  action: string;
  payload: any;
  userId: string;
  weekNumber?: number;
}

export class AgentProxyService {
  private static getSupabaseUrl(): string {
    return import.meta.env.VITE_SUPABASE_URL || 'https://jclgmvbkrlkppecwnljv.supabase.co'
  }

  private static async callAgentProxy(request: AgentRequest): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/agent-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Agent proxy error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Agent proxy call failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // CLO Agent - Curriculum Architect
  static async callCLOAgent(
    userId: string, 
    userInput: string, 
    weekNumber?: number
  ): Promise<AgentResponse> {
    console.log('🎯 Calling CLO Agent via proxy for user:', userId, 'week:', weekNumber, 'input:', userInput)
    
    return this.callAgentProxy({
      agent: 'clo',
      action: 'generate_module',
      payload: {
        userInput,
        weekNumber
      },
      userId,
      weekNumber
    })
  }

  // Socratic Agent - Question-based dialogue
  static async callSocraticAgent(
    userId: string,
    userMessage: string,
    conversationHistory: string[] = [],
    cloContext?: any,
    conversationId?: string
  ): Promise<AgentResponse> {
    console.log('🤔 Calling Socratic Agent via proxy for user:', userId, 'message:', userMessage.substring(0, 50) + '...')
    
    return this.callAgentProxy({
      agent: 'socratic',
      action: 'ask_question',
      payload: {
        message: userMessage,
        conversationHistory,
        cloContext,
        conversationId
      },
      userId
    })
  }

  // Alex Agent - Lead Engineer Advisor
  static async callAlexAgent(
    userId: string,
    repositoryUrl: string,
    codeContext?: string,
    weekNumber?: number
  ): Promise<AgentResponse> {
    console.log('👨‍💻 Calling Alex Agent via proxy for user:', userId, 'repo:', repositoryUrl)
    
    return this.callAgentProxy({
      agent: 'alex',
      action: 'analyze_code',
      payload: {
        repositoryUrl,
        codeContext
      },
      userId,
      weekNumber
    })
  }

  // Brand Agent - Brand Strategist
  static async callBrandAgent(
    userId: string,
    businessContext: string,
    weeklyIntelligence?: any,
    personalReflection?: string,
    weekNumber?: number
  ): Promise<AgentResponse> {
    console.log('🎨 Calling Brand Agent via proxy for user:', userId, 'context:', businessContext.substring(0, 50) + '...')
    
    return this.callAgentProxy({
      agent: 'brand',
      action: 'generate_strategy',
      payload: {
        businessContext,
        weeklyIntelligence,
        personalReflection
      },
      userId,
      weekNumber
    })
  }

  // Weekly Flow - Orchestrate all agents
  static async runWeeklyFlow(
    userId: string,
    weekNumber: number,
    userInput: string,
    businessContext: string,
    personalReflection?: string
  ): Promise<AgentResponse> {
    console.log('🔄 Running weekly flow for user:', userId, 'week:', weekNumber)
    
    try {
      // Step 1: CLO Agent
      const cloResult = await this.callCLOAgent(userId, userInput, weekNumber)
      if (!cloResult.success) {
        return cloResult
      }

      // Step 2: Alex Agent (if repository provided)
      let alexResult = null
      if (businessContext.includes('github.com') || businessContext.includes('repository')) {
        alexResult = await this.callAlexAgent(userId, businessContext, undefined, weekNumber)
      }

      // Step 3: Brand Agent
      const brandResult = await this.callBrandAgent(
        userId,
        businessContext,
        {
          clo: cloResult.data,
          alex: alexResult?.data
        },
        personalReflection,
        weekNumber
      )

      if (!brandResult.success) {
        return brandResult
      }

      return {
        success: true,
        data: {
          clo: cloResult.data,
          alex: alexResult?.data,
          brand: brandResult.data,
          week_number: weekNumber,
          completed_at: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Weekly flow error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Legacy compatibility - redirect old calls to new proxy
export class GeminiAgentService {
  static async callCLOAgent(userInput: string, weekNumber: number, prompt?: string): Promise<AgentResponse> {
    console.warn('⚠️ Using legacy GeminiAgentService.callCLOAgent - use AgentProxyService instead')
    return AgentProxyService.callCLOAgent('legacy-user', userInput, weekNumber)
  }

  static async callSocraticAgent(
    userMessage: string, 
    conversationHistory: string[] = [], 
    prompt?: string,
    cloData?: any
  ): Promise<AgentResponse> {
    console.warn('⚠️ Using legacy GeminiAgentService.callSocraticAgent - use AgentProxyService instead')
    return AgentProxyService.callSocraticAgent('legacy-user', userMessage, conversationHistory, cloData)
  }

  static async callAlexAgent(repositoryUrl: string, codeContext?: string, prompt?: string): Promise<AgentResponse> {
    console.warn('⚠️ Using legacy GeminiAgentService.callAlexAgent - use AgentProxyService instead')
    return AgentProxyService.callAlexAgent('legacy-user', repositoryUrl, codeContext)
  }

  static async callBrandAgent(
    businessContext: string, 
    weeklyIntelligenceBriefing?: any,
    prompt?: string
  ): Promise<AgentResponse> {
    console.warn('⚠️ Using legacy GeminiAgentService.callBrandAgent - use AgentProxyService instead')
    return AgentProxyService.callBrandAgent('legacy-user', businessContext, weeklyIntelligenceBriefing)
  }
}

// Export the new service as default
export default AgentProxyService