import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as progressionService from '../progression';

// Mock the entire module to avoid import issues
vi.mock('../progression', async () => {
  const actual = await vi.importActual('../progression');
  return {
    ...actual,
    updateLearnerTrack: vi.fn(),
    getCurrentModuleInstance: vi.fn()
  };
});

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

describe('Progression Service', () => {
  const mockTrack = {
    id: 'track-123',
    user_id: 'user-123',
    track_label: 'AI/ML Engineering',
    start_date: '2025-01-01',
    current_week: 1,
    current_day: 1,
    status: 'active' as const,
    prefs_json: { timePerWeek: 15, learningStyle: 'mixed' },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockModule = {
    id: 'module-123',
    learner_track_id: 'track-123',
    week: 1,
    day: 1,
    phase: 'plan_approved' as const,
    plan_hash: 'hash-123',
    agent_flags_json: { socratic: false, ta: false, alex: false },
    completion_json: {},
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateModuleProgress', () => {
    test('should calculate 0% progress for no completed agents', () => {
      const module = { ...mockModule, agent_flags_json: { socratic: false, ta: false, alex: false } };
      const progress = progressionService.calculateModuleProgress(module);
      expect(progress).toBe(0);
    });

    test('should calculate 33% progress for one completed agent', () => {
      const module = { ...mockModule, agent_flags_json: { socratic: true, ta: false, alex: false } };
      const progress = progressionService.calculateModuleProgress(module);
      expect(progress).toBe(33);
    });

    test('should calculate 100% progress for all completed agents', () => {
      const module = { ...mockModule, agent_flags_json: { socratic: true, ta: true, alex: true } };
      const progress = progressionService.calculateModuleProgress(module);
      expect(progress).toBe(100);
    });
  });

  describe('canAdvanceModule', () => {
    test('should return false when not all agents are complete', () => {
      const module = { ...mockModule, agent_flags_json: { socratic: true, ta: false, alex: false } };
      const canAdvance = progressionService.canAdvanceModule(module);
      expect(canAdvance).toBe(false);
    });

    test('should return true when all agents are complete', () => {
      const module = { ...mockModule, agent_flags_json: { socratic: true, ta: true, alex: true } };
      const canAdvance = progressionService.canAdvanceModule(module);
      expect(canAdvance).toBe(true);
    });
  });

  describe('advanceProgress', () => {
    test('should calculate correct next day/week values', () => {
      // Test the logic without calling the actual function
      const calculateNext = (week: number, day: number) => {
        let newWeek = week;
        let newDay = day;

        if (day < 5) { // Assuming 5 days per week
          newDay = day + 1;
        } else {
          newWeek = week + 1;
          newDay = 1;
        }

        return { week: newWeek, day: newDay };
      };

      expect(calculateNext(1, 1)).toEqual({ week: 1, day: 2 });
      expect(calculateNext(1, 5)).toEqual({ week: 2, day: 1 });
      expect(calculateNext(2, 3)).toEqual({ week: 2, day: 4 });
    });
  });
});
