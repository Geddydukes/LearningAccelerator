import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentProxyService } from '../gemini';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AgentProxyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('callCLOAgent', () => {
    it('should call the agent-proxy with correct payload', async () => {
      const mockResponse = {
        success: true,
        data: {
          module_title: 'Test Module',
          learning_objectives: ['Objective 1'],
          week_number: 1,
          agent_version: 'v2.0'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await AgentProxyService.callCLOAgent('test-user', 'Learn React', 1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/agent-proxy'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          },
          body: JSON.stringify({
            agent: 'clo',
            action: 'generate_module',
            payload: {
              userInput: 'Learn React',
              weekNumber: 1
            },
            userId: 'test-user',
            weekNumber: 1
          })
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      const result = await AgentProxyService.callCLOAgent('test-user', 'Learn React', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent proxy error: 500');
    });
  });

  describe('callSocraticAgent', () => {
    it('should call the agent-proxy with conversation context', async () => {
      const mockResponse = {
        success: true,
        data: {
          question: 'What do you think about this concept?',
          conversation_id: 'conv-123',
          timestamp: expect.any(String),
          agent_version: 'v2.0'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await AgentProxyService.callSocraticAgent(
        'test-user',
        'I want to learn about hooks',
        ['Previous question'],
        { module_title: 'React Hooks' },
        'conv-123'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/agent-proxy'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          },
          body: JSON.stringify({
            agent: 'socratic',
            action: 'ask_question',
            payload: {
              message: 'I want to learn about hooks',
              conversationHistory: ['Previous question'],
              cloContext: { module_title: 'React Hooks' },
              conversationId: 'conv-123'
            },
            userId: 'test-user'
          })
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('callAlexAgent', () => {
    it('should call the agent-proxy with repository URL', async () => {
      const mockResponse = {
        success: true,
        data: {
          repository_url: 'https://github.com/test/repo',
          analysis_summary: 'Code analysis complete',
          code_quality_score: 85,
          week_number: 1,
          agent_version: 'v2.2'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await AgentProxyService.callAlexAgent(
        'test-user',
        'https://github.com/test/repo',
        'Additional context',
        1
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/agent-proxy'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          },
          body: JSON.stringify({
            agent: 'alex',
            action: 'analyze_code',
            payload: {
              repositoryUrl: 'https://github.com/test/repo',
              codeContext: 'Additional context'
            },
            userId: 'test-user',
            weekNumber: 1
          })
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('callBrandAgent', () => {
    it('should call the agent-proxy with business context', async () => {
      const mockResponse = {
        success: true,
        data: {
          content_themes: ['Theme 1'],
          brand_voice_analysis: 'Professional',
          week_number: 1,
          agent_version: 'v2.1'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await AgentProxyService.callBrandAgent(
        'test-user',
        'Building a SaaS platform',
        { clo: { module_title: 'React' } },
        'Personal reflection',
        1
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/agent-proxy'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          },
          body: JSON.stringify({
            agent: 'brand',
            action: 'generate_strategy',
            payload: {
              businessContext: 'Building a SaaS platform',
              weeklyIntelligence: { clo: { module_title: 'React' } },
              personalReflection: 'Personal reflection'
            },
            userId: 'test-user',
            weekNumber: 1
          })
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('runWeeklyFlow', () => {
    it('should orchestrate all agents in sequence', async () => {
      const cloResponse = {
        success: true,
        data: {
          module_title: 'Test Module',
          week_number: 1,
          agent_version: 'v2.0'
        }
      };

      const brandResponse = {
        success: true,
        data: {
          content_themes: ['Theme 1'],
          brand_voice_analysis: 'Professional',
          week_number: 1,
          agent_version: 'v2.1'
        }
      };

      // Mock multiple calls for the weekly flow
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => cloResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => brandResponse
        });

      const result = await AgentProxyService.runWeeklyFlow(
        'test-user',
        1,
        'Learn React',
        'Building a SaaS platform',
        'Personal reflection'
      );

      // Verify that multiple calls were made
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // First call should be to CLO agent
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/functions/v1/agent-proxy'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          },
          body: JSON.stringify({
            agent: 'clo',
            action: 'generate_module',
            payload: {
              userInput: 'Learn React',
              weekNumber: 1
            },
            userId: 'test-user',
            weekNumber: 1
          })
        }
      );

      // Second call should be to Brand agent
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/functions/v1/agent-proxy'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          },
          body: JSON.stringify({
            agent: 'brand',
            action: 'generate_strategy',
            payload: {
              businessContext: 'Building a SaaS platform',
              weeklyIntelligence: {
                clo: cloResponse.data
              },
              personalReflection: 'Personal reflection'
            },
            userId: 'test-user',
            weekNumber: 1
          })
        }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        clo: cloResponse.data,
        alex: undefined,
        brand: brandResponse.data,
        week_number: 1,
        completed_at: expect.any(String)
      });
    });
  });
}); 