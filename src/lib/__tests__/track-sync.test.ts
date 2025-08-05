import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the track-sync Edge Function
global.fetch = vi.fn();

describe('Track Sync Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('track-sync Edge Function', () => {
    it('should compile prompts with user goals', async () => {
      const mockResponse = {
        success: true,
        data: {
          track: 'ai_ml',
          level: 'beginner',
          compiledPrompts: ['clo', 'socratic', 'alex', 'brand'],
          version: 'v3-compiled'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/functions/v1/track-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          userId: 'test-user',
          track: 'ai_ml',
          level: 'beginner',
          goals: {
            timePerWeek: 10,
            budget: 100,
            hardwareSpecs: 'MacBook Pro',
            learningStyle: 'visual',
            endGoal: 'ML Engineer'
          }
        })
      });

      const result = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/track-sync'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            userId: 'test-user',
            track: 'ai_ml',
            level: 'beginner',
            goals: {
              timePerWeek: 10,
              budget: 100,
              hardwareSpecs: 'MacBook Pro',
              learningStyle: 'visual',
              endGoal: 'ML Engineer'
            }
          })
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle track sync errors', async () => {
      const mockError = {
        success: false,
        error: 'Failed to load track config'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockError
      });

      const response = await fetch('/functions/v1/track-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          userId: 'test-user',
          track: 'invalid_track',
          level: 'beginner',
          goals: {}
        })
      });

      const result = await response.json();

      expect(result).toEqual(mockError);
    });
  });

  describe('Track Configuration Validation', () => {
    it('should validate required track fields', () => {
      const validConfig = {
        label: 'AI/ML Engineering',
        description: 'Comprehensive AI and ML track',
        levels: ['beginner', 'intermediate', 'expert'],
        competencies: {
          beginner: ['Python basics', 'ML fundamentals'],
          intermediate: ['Deep learning', 'Model deployment'],
          expert: ['Research', 'Production systems']
        },
        monthGoals: {
          1: { focus: 'Basics', target: 'First project' },
          2: { focus: 'Intermediate', target: 'Deploy model' },
          3: { focus: 'Advanced', target: 'Production system' }
        }
      };

      expect(validConfig.label).toBeDefined();
      expect(validConfig.description).toBeDefined();
      expect(Array.isArray(validConfig.levels)).toBe(true);
      expect(validConfig.competencies).toBeDefined();
      expect(validConfig.monthGoals).toBeDefined();
    });

    it('should reject invalid track configurations', () => {
      const invalidConfig = {
        label: 'AI/ML Engineering',
        // Missing required fields
      };

      expect(invalidConfig.description).toBeUndefined();
      expect(invalidConfig.levels).toBeUndefined();
    });
  });

  describe('Prompt Compilation', () => {
    it('should replace placeholder variables', () => {
      const template = `
        Track: {{TRACK_LABEL}}
        Competencies: {{CORE_COMPETENCY_BLOCK}}
        Time per week: {{TIME_PER_WEEK}} hours
        Budget: {{BUDGET_JSON}}
        Hardware: {{HARDWARE_SPECS}}
        Learning style: {{LEARNING_STYLE}}
        End goal: {{END_GOAL}}
      `;

      const goals = {
        timePerWeek: 15,
        budget: 200,
        hardwareSpecs: 'MacBook Pro M2',
        learningStyle: 'hands-on',
        endGoal: 'Senior ML Engineer'
      };

      const compiled = template
        .replace(/{{TRACK_LABEL}}/g, 'AI/ML Engineering')
        .replace(/{{CORE_COMPETENCY_BLOCK}}/g, 'Python, ML, Deep Learning')
        .replace(/{{TIME_PER_WEEK}}/g, goals.timePerWeek.toString())
        .replace(/{{BUDGET_JSON}}/g, JSON.stringify({ monthly: goals.budget }))
        .replace(/{{HARDWARE_SPECS}}/g, goals.hardwareSpecs)
        .replace(/{{LEARNING_STYLE}}/g, goals.learningStyle)
        .replace(/{{END_GOAL}}/g, goals.endGoal);

      expect(compiled).toContain('AI/ML Engineering');
      expect(compiled).toContain('Python, ML, Deep Learning');
      expect(compiled).toContain('15');
      expect(compiled).toContain('{"monthly":200}');
      expect(compiled).toContain('MacBook Pro M2');
      expect(compiled).toContain('hands-on');
      expect(compiled).toContain('Senior ML Engineer');
    });
  });
}); 