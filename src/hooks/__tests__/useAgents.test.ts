import { renderHook, act } from '@testing-library/react';
import { useAgents } from '../useAgents';
import toast from 'react-hot-toast';

// Mock dependencies
const mockCallCLOAgent = jest.fn();
const mockCallSocraticAgent = jest.fn();
const mockCallAlexAgent = jest.fn();
const mockCallBrandAgent = jest.fn();

jest.mock('../../lib/gemini', () => ({
  GeminiAgentService: {
    callCLOAgent: mockCallCLOAgent,
    callSocraticAgent: mockCallSocraticAgent,
    callAlexAgent: mockCallAlexAgent,
    callBrandAgent: mockCallBrandAgent
  }
}));

jest.mock('react-hot-toast');

describe('useAgents Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('callCLOAgent', () => {
    it('handles successful CLO agent call', async () => {
      const mockResponse = {
        success: true,
        data: {
          module_title: 'Test Module',
          learning_objectives: ['Objective 1'],
          key_concepts: ['Concept 1'],
          estimated_duration: 120,
          prerequisites: [],
          resources: [],
          assessment_criteria: []
        }
      };

      mockCallCLOAgent.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAgents());

      let response;
      await act(async () => {
        response = await result.current.callCLOAgent('Test input', 1);
      });

      expect(mockCallCLOAgent).toHaveBeenCalledWith('Test input', 1);
      expect(response).toEqual(mockResponse.data);
      expect(toast.success).toHaveBeenCalledWith('CLO module generated successfully!');
      expect(result.current.interactions['CLO - Curriculum Architect'].status).toBe('completed');
    });

    it('handles CLO agent error', async () => {
      const mockResponse = {
        success: false,
        error: 'API key not configured'
      };

      mockCallCLOAgent.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAgents());

      let response;
      await act(async () => {
        response = await result.current.callCLOAgent('Test input', 1);
      });

      expect(response).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('CLO Error: API key not configured');
      expect(result.current.interactions['CLO - Curriculum Architect'].status).toBe('error');
    });
  });

  describe('callSocraticAgent', () => {
    it('handles successful Socratic agent call', async () => {
      const mockResponse = {
        success: true,
        data: { question: 'What do you think about this?' }
      };

      mockCallSocraticAgent.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAgents());

      let response;
      await act(async () => {
        response = await result.current.callSocraticAgent('I want to learn React', []);
      });

      expect(mockCallSocraticAgent).toHaveBeenCalledWith('I want to learn React', []);
      expect(response).toEqual(mockResponse.data);
      expect(result.current.interactions['Socratic Inquisitor'].status).toBe('completed');
    });

    it('updates status during processing', async () => {
      mockCallSocraticAgent.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: { question: 'Test' } }), 100))
      );

      const { result } = renderHook(() => useAgents());

      act(() => {
        result.current.callSocraticAgent('Test message', []);
      });

      expect(result.current.interactions['Socratic Inquisitor'].status).toBe('processing');
    });
  });

  describe('callAlexAgent', () => {
    it('handles successful Alex agent call', async () => {
      const mockResponse = {
        success: true,
        data: {
          repository_url: 'https://github.com/test/repo',
          analysis_summary: 'Good code quality',
          code_quality_score: 85,
          recommendations: [],
          technical_debt_items: [],
          best_practices_followed: [],
          areas_for_improvement: []
        }
      };

      mockCallAlexAgent.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAgents());

      let response;
      await act(async () => {
        response = await result.current.callAlexAgent('https://github.com/test/repo');
      });

      expect(response).toEqual(mockResponse.data);
      expect(toast.success).toHaveBeenCalledWith('Code review completed!');
    });
  });

  describe('callBrandAgent', () => {
    it('handles successful Brand agent call', async () => {
      const mockResponse = {
        success: true,
        data: {
          content_themes: ['Tech', 'Innovation'],
          kpi_metrics: [],
          social_content_suggestions: [],
          brand_voice_analysis: 'Professional',
          engagement_strategies: []
        }
      };

      mockCallBrandAgent.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAgents());

      let response;
      await act(async () => {
        response = await result.current.callBrandAgent('Tech startup context');
      });

      expect(response).toEqual(mockResponse.data);
      expect(toast.success).toHaveBeenCalledWith('Brand strategy package generated!');
    });
  });
});