// Frontend prompt compiler helper
// Provides compilePrompt and callAgent functions for the orchestrator

import { AGENTS, AgentId } from './registry';

export interface CompiledPromptResult {
  compiledUrl: string;
  compiledObjectPath?: string;
  hash: string;
  cached: boolean;
}

export interface AgentCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Compile a prompt for a specific agent and user
 */
export async function compilePrompt(
  agentId: AgentId, 
  userId: string, 
  variables: Record<string, unknown>
): Promise<CompiledPromptResult> {
  const maxRetries = 3;
  const retryDelays = [250, 500, 1000]; // ms
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔧 compile_prompt_started: ${agentId} for user ${userId} (attempt ${attempt + 1})`);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          agentId,
          userId,
          variables
        })
      });

      if (!response.ok) {
        // Check if we should retry (429, 5xx errors)
        if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
          const delay = retryDelays[attempt];
          console.log(`⏳ Retrying in ${delay}ms due to ${response.status} error`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`Failed to compile prompt: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to compile prompt');
      }

      console.log(`✅ prompt_compiled: ${agentId} -> ${result.hash} (cached: ${result.cached})`);
      
      return {
        compiledUrl: result.compiled_url || '',
        compiledObjectPath: result.compiled_object_path,
        hash: result.hash,
        cached: result.cached
      };
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`❌ prompt_compilation_failed: ${agentId} after ${maxRetries + 1} attempts`, error);
        throw error;
      }
      console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying...`, error.message);
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Call an agent with a compiled prompt
 */
export async function callAgent(
  agentId: AgentId, 
  compiledUrl: string, 
  payload: any,
  userId: string,
  weekNumber?: number,
  compiledObjectPath?: string
): Promise<AgentCallResult> {
  try {
    console.log(`🚀 agent_call_started: ${agentId} with compiled prompt`);
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        agent: agentId,
        action: 'process',
        payload,
        userId,
        weekNumber,
        compiled_url: compiledUrl,
        compiled_object_path: compiledObjectPath
      })
    });

    if (!response.ok) {
      throw new Error(`Agent call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Agent call failed');
    }

    console.log(`✅ agent_call_completed: ${agentId}`);
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error(`❌ agent_call_failed: ${agentId}`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Convenience function: compile prompt and call agent in one step
 */
export async function compileAndCallAgent(
  agentId: AgentId,
  userId: string,
  variables: Record<string, unknown>,
  payload: any,
  weekNumber?: number
): Promise<AgentCallResult> {
  try {
    // First compile the prompt
    const compiledPrompt = await compilePrompt(agentId, userId, variables);
    
    // Then call the agent with the compiled prompt
    return await callAgent(agentId, compiledPrompt.compiledUrl, payload, userId, weekNumber, compiledPrompt.compiledObjectPath);
  } catch (error) {
    console.error(`❌ compile_and_call_failed: ${agentId}`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if an agent requires premium access
 */
export function requiresPremium(agentId: AgentId): boolean {
  return AGENTS[agentId].entitlement === 'premium';
}

/**
 * Get agent metadata for UI display
 */
export function getAgentMeta(agentId: AgentId) {
  return AGENTS[agentId];
}
