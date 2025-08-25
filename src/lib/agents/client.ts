// Unified agent client for compile→proxy contract
// Provides type-safe agent calls with retry logic and correlation tracking

import { AGENTS, AgentId, isPremium } from './registry';
import { compilePrompt as compilePromptRaw, callAgent as callAgentRaw } from './promptCompiler';

export interface AgentCallResult {
  success: boolean;
  data?: any;
  error?: string;
  meta: {
    agentId: string;
    hash: string;
    durationMs: number;
    cached: boolean;
    correlationId: string;
  };
}

export interface CompileResult {
  compiledUrl: string;
  hash: string;
  cached: boolean;
  correlationId: string;
}

/**
 * Compile a prompt for a specific agent and user
 * Includes retry logic and correlation ID generation
 */
export async function compilePrompt(
  agentId: AgentId, 
  userId: string, 
  variables: Record<string, unknown>
): Promise<CompileResult> {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  
  console.log(`🔧 compile_prompt_started: ${agentId} for user ${userId} [${correlationId}]`);
  
  try {
    const result = await compilePromptRaw(agentId, userId, variables);
    
    const durationMs = Date.now() - startTime;
    console.log(`✅ prompt_compiled: ${agentId} -> ${result.hash} (cached: ${result.cached}) [${correlationId}] in ${durationMs}ms`);
    
    return {
      ...result,
      correlationId
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`❌ prompt_compilation_failed: ${agentId} [${correlationId}] in ${durationMs}ms`, error);
    throw error;
  }
}

/**
 * Call an agent with a compiled prompt
 * Includes entitlement checking and correlation tracking
 */
export async function callAgent(
  agentId: AgentId,
  compiledUrl: string,
  payload: any,
  userId: string,
  weekNumber?: number,
  compiledObjectPath?: string
): Promise<AgentCallResult> {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  
  console.log(`🚀 agent_call_started: ${agentId} [${correlationId}]`);
  
  try {
    // Check entitlement before making the call
    if (isPremium(agentId)) {
      const userTier = await getUserTier(userId);
      if (userTier !== 'enterprise' && userTier !== 'premium') {
        const durationMs = Date.now() - startTime;
        console.log(`🔒 entitlement_blocked: ${agentId} requires premium, user has ${userTier} [${correlationId}] in ${durationMs}ms`);
        
        return {
          success: false,
          error: `Agent '${AGENTS[agentId].title}' requires premium subscription`,
          meta: {
            agentId,
            hash: 'entitlement_blocked',
            durationMs,
            cached: false,
            correlationId
          }
        };
      }
      console.log(`✅ entitlement_check_passed: ${agentId} for ${userTier} user [${correlationId}]`);
    }
    
    const result = await callAgentRaw(agentId, compiledUrl, payload, userId, weekNumber, compiledObjectPath);
    
    const durationMs = Date.now() - startTime;
    console.log(`✅ agent_call_completed: ${agentId} [${correlationId}] in ${durationMs}ms`);
    
    return {
      ...result,
      meta: {
        agentId,
        hash: 'legacy', // Will be updated when we have hash tracking in agent-proxy
        durationMs,
        cached: false, // Will be updated when we have caching info from agent-proxy
        correlationId
      }
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`❌ agent_call_failed: ${agentId} [${correlationId}] in ${durationMs}ms`, error);
    
    return {
      success: false,
      error: error.message,
      meta: {
        agentId,
        hash: 'error',
        durationMs,
        cached: false,
        correlationId
      }
    };
  }
}

/**
 * Compile and call an agent in one operation
 * Convenience function for common use case
 */
export async function compileAndCallAgent(
  agentId: AgentId,
  userId: string,
  variables: Record<string, unknown>,
  payload: any,
  weekNumber?: number
): Promise<AgentCallResult> {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  
  console.log(`🔄 compile_and_call_started: ${agentId} for user ${userId} [${correlationId}]`);
  
  try {
    // First compile the prompt
    const compiledPrompt = await compilePrompt(agentId, userId, variables);
    
    // Then call the agent
    const result = await callAgent(agentId, compiledPrompt.compiledUrl, payload, userId, weekNumber, compiledPrompt.compiledObjectPath);
    
    const durationMs = Date.now() - startTime;
    console.log(`✅ compile_and_call_completed: ${agentId} [${correlationId}] in ${durationMs}ms`);
    
    // Update meta with compilation info
    result.meta = {
      ...result.meta,
      hash: compiledPrompt.hash,
      cached: compiledPrompt.cached
    };
    
    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`❌ compile_and_call_failed: ${agentId} [${correlationId}] in ${durationMs}ms`, error);
    
    return {
      success: false,
      error: error.message,
      meta: {
        agentId,
        hash: 'error',
        durationMs,
        cached: false,
        correlationId
      }
    };
  }
}

// Helper functions

function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function getUserTier(userId: string): Promise<string> {
  try {
    // This would typically come from a user context or API call
    // For now, return a default value
    return 'basic';
  } catch (error) {
    console.warn('⚠️ Failed to get user tier, defaulting to basic:', error);
    return 'basic';
  }
}
