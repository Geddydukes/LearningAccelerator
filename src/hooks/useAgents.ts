import { useState, useCallback } from 'react';
import { GeminiAgentService, AgentResponse } from '../lib/gemini';
import toast from 'react-hot-toast';

export interface AgentInteraction {
  agentName: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  data?: any;
  error?: string;
}

export const useAgents = () => {
  const [interactions, setInteractions] = useState<Record<string, AgentInteraction>>({});

  const updateAgentStatus = useCallback((agentName: string, status: AgentInteraction['status'], data?: any, error?: string) => {
    setInteractions(prev => ({
      ...prev,
      [agentName]: { agentName, status, data, error }
    }));
  }, []);

  const callCLOAgent = useCallback(async (userInput: string, weekNumber: number) => {
    const agentName = 'CLO - Curriculum Architect';
    updateAgentStatus(agentName, 'processing');
    
    try {
      const response: AgentResponse = await GeminiAgentService.callCLOAgent(userInput, weekNumber);
      
      if (response.success) {
        updateAgentStatus(agentName, 'completed', response.data);
        toast.success('CLO module generated successfully!');
        return response.data;
      } else {
        updateAgentStatus(agentName, 'error', null, response.error);
        toast.error(`CLO Error: ${response.error}`);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateAgentStatus(agentName, 'error', null, errorMessage);
      toast.error(`CLO Error: ${errorMessage}`);
      return null;
    }
  }, [updateAgentStatus]);

  const callSocraticAgent = useCallback(async (userMessage: string, conversationHistory: string[] = []) => {
    const agentName = 'Socratic Inquisitor';
    updateAgentStatus(agentName, 'processing');
    
    try {
      const response: AgentResponse = await GeminiAgentService.callSocraticAgent(userMessage, conversationHistory);
      
      if (response.success) {
        updateAgentStatus(agentName, 'completed', response.data);
        return response.data;
      } else {
        updateAgentStatus(agentName, 'error', null, response.error);
        toast.error(`Socratic Error: ${response.error}`);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateAgentStatus(agentName, 'error', null, errorMessage);
      toast.error(`Socratic Error: ${errorMessage}`);
      return null;
    }
  }, [updateAgentStatus]);

  const callAlexAgent = useCallback(async (repositoryUrl: string, codeContext?: string) => {
    const agentName = 'Alex - Lead Engineer';
    updateAgentStatus(agentName, 'processing');
    
    try {
      const response: AgentResponse = await GeminiAgentService.callAlexAgent(repositoryUrl, codeContext);
      
      if (response.success) {
        updateAgentStatus(agentName, 'completed', response.data);
        toast.success('Code review completed!');
        return response.data;
      } else {
        updateAgentStatus(agentName, 'error', null, response.error);
        toast.error(`Alex Error: ${response.error}`);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateAgentStatus(agentName, 'error', null, errorMessage);
      toast.error(`Alex Error: ${errorMessage}`);
      return null;
    }
  }, [updateAgentStatus]);

  const callBrandAgent = useCallback(async (businessContext: string, currentMetrics?: any) => {
    const agentName = 'Brand Strategist';
    updateAgentStatus(agentName, 'processing');
    
    try {
      const response: AgentResponse = await GeminiAgentService.callBrandAgent(businessContext, currentMetrics);
      
      if (response.success) {
        updateAgentStatus(agentName, 'completed', response.data);
        toast.success('Brand strategy package generated!');
        return response.data;
      } else {
        updateAgentStatus(agentName, 'error', null, response.error);
        toast.error(`Brand Error: ${response.error}`);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateAgentStatus(agentName, 'error', null, errorMessage);
      toast.error(`Brand Error: ${errorMessage}`);
      return null;
    }
  }, [updateAgentStatus]);

  return {
    interactions,
    callCLOAgent,
    callSocraticAgent,
    callAlexAgent,
    callBrandAgent
  };
};