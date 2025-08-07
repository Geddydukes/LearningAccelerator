/**
 * Onboarder Agent Handler Tests
 * 
 * Tests the Onboarder agent functionality including:
 * - Placeholder injection and validation
 * - Quiz generation with Gemini API
 * - JSON parsing and validation
 * - 4-4-2 difficulty distribution validation
 * - Database storage operations
 */

import { handleOnboarderAgent } from './onboarder';

// Mock Gemini model
const mockModel = {
  generateContent: jest.fn(),
};

// Mock Supabase client
jest.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}));

describe('handleOnboarderAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject request with missing track', async () => {
      const payload = {
        cmd: 'START',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini'
      };

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should reject request with missing goals', async () => {
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        hardware: 'M4 Mac Mini'
      };

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should reject request with missing hardware', async () => {
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML'
      };

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });
  });

  describe('Placeholder Injection', () => {
    it('should inject all placeholders correctly', async () => {
      const prompt = 'Track: {{TRACK_LABEL}}, Goals: {{LEARNER_GOALS}}, Hardware: {{HARDWARE_SPECS}}';
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini',
        learningStyle: 'visual',
        experienceLevel: 'beginner'
      };

      // Mock successful response
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(createMockQuizData())
        }
      });

      await handleOnboarderAgent(mockModel, prompt, 'START', payload, 'user123');

      // Verify the prompt was called with injected placeholders
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Track: ai_ml, Goals: Learn AI/ML, Hardware: M4 Mac Mini')
      );
    });

    it('should use default values for optional placeholders', async () => {
      const prompt = 'Style: {{LEARNING_STYLE}}, Level: {{EXPERIENCE_LEVEL}}';
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini'
        // learningStyle and experienceLevel not provided
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(createMockQuizData())
        }
      });

      await handleOnboarderAgent(mockModel, prompt, 'START', payload, 'user123');

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Style: visual, Level: beginner')
      );
    });
  });

  describe('Quiz Generation', () => {
    it('should generate quiz with correct structure', async () => {
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini'
      };

      const mockQuizData = createMockQuizData();
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockQuizData)
        }
      });

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQuizData);
    });

    it('should handle JSON parsing errors', async () => {
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini'
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response'
        }
      });

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse quiz response');
    });

    it('should extract JSON from markdown code blocks', async () => {
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini'
      };

      const mockQuizData = createMockQuizData();
      const markdownResponse = `Here's your quiz:\n\n\`\`\`json\n${JSON.stringify(mockQuizData)}\n\`\`\``;
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => markdownResponse
        }
      });

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQuizData);
    });
  });

  describe('Quiz Validation', () => {
    it('should validate 4-4-2 difficulty distribution', async () => {
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini'
      };

      const validQuizData = createMockQuizData();
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(validQuizData)
        }
      });

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(true);
      expect(result.data.questions).toHaveLength(10);
      
      const difficultyCounts = result.data.questions.reduce((counts: any, question: any) => {
        counts[question.difficulty] = (counts[question.difficulty] || 0) + 1;
        return counts;
      }, {});

      expect(difficultyCounts.foundational).toBe(4);
      expect(difficultyCounts.intermediate).toBe(4);
      expect(difficultyCounts.advanced).toBe(2);
    });

    it('should reject quiz with wrong question count', async () => {
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini'
      };

      const invalidQuizData = createMockQuizData();
      invalidQuizData.questions = invalidQuizData.questions.slice(0, 8); // Only 8 questions

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(invalidQuizData)
        }
      });

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quiz must have exactly 10 questions');
    });

    it('should reject quiz with wrong difficulty distribution', async () => {
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini'
      };

      const invalidQuizData = createMockQuizData();
      // Change difficulty distribution to 5-3-2
      invalidQuizData.questions[0].difficulty = 'foundational';
      invalidQuizData.questions[4].difficulty = 'foundational';

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(invalidQuizData)
        }
      });

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quiz must have exactly 4 foundational questions');
    });

    it('should validate multiple choice question structure', async () => {
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini'
      };

      const invalidQuizData = createMockQuizData();
      // Remove options from first question
      delete invalidQuizData.questions[0].options;

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(invalidQuizData)
        }
      });

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Multiple choice questions must have 4 options');
    });
  });

  describe('Error Handling', () => {
    it('should handle Gemini API errors', async () => {
      const payload = {
        cmd: 'START',
        track: 'ai_ml',
        goals: 'Learn AI/ML',
        hardware: 'M4 Mac Mini'
      };

      mockModel.generateContent.mockRejectedValue(new Error('API Error'));

      const result = await handleOnboarderAgent(mockModel, 'test prompt', 'START', payload, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });
  });
});

/**
 * Creates mock quiz data with correct 4-4-2 distribution
 */
function createMockQuizData() {
  return {
    quiz_id: 'ai_ml_onboarding_1234567890',
    track: 'ai_ml',
    difficulty: 'adaptive',
    hardware_compatibility: 'assessed',
    questions: [
      // 4 foundational questions
      {
        id: 1,
        type: 'multiple_choice',
        difficulty: 'foundational',
        question: 'What is machine learning?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        explanation: 'Machine learning is a subset of AI',
        hardware_relevance: 'low',
        learning_style: 'visual'
      },
      {
        id: 2,
        type: 'multiple_choice',
        difficulty: 'foundational',
        question: 'What is supervised learning?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'B',
        explanation: 'Supervised learning uses labeled data',
        hardware_relevance: 'low',
        learning_style: 'visual'
      },
      {
        id: 3,
        type: 'multiple_choice',
        difficulty: 'foundational',
        question: 'What is Python used for in ML?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'C',
        explanation: 'Python is the primary language for ML',
        hardware_relevance: 'medium',
        learning_style: 'kinesthetic'
      },
      {
        id: 4,
        type: 'multiple_choice',
        difficulty: 'foundational',
        question: 'What is a neural network?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'D',
        explanation: 'Neural networks mimic brain function',
        hardware_relevance: 'medium',
        learning_style: 'visual'
      },
      // 4 intermediate questions
      {
        id: 5,
        type: 'multiple_choice',
        difficulty: 'intermediate',
        question: 'How do you handle overfitting?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        explanation: 'Regularization prevents overfitting',
        hardware_relevance: 'medium',
        learning_style: 'auditory'
      },
      {
        id: 6,
        type: 'multiple_choice',
        difficulty: 'intermediate',
        question: 'What is cross-validation?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'B',
        explanation: 'Cross-validation assesses model performance',
        hardware_relevance: 'medium',
        learning_style: 'kinesthetic'
      },
      {
        id: 7,
        type: 'multiple_choice',
        difficulty: 'intermediate',
        question: 'How do you choose hyperparameters?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'C',
        explanation: 'Grid search or random search',
        hardware_relevance: 'high',
        learning_style: 'visual'
      },
      {
        id: 8,
        type: 'multiple_choice',
        difficulty: 'intermediate',
        question: 'What is feature engineering?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'D',
        explanation: 'Creating new features from existing data',
        hardware_relevance: 'medium',
        learning_style: 'kinesthetic'
      },
      // 2 advanced questions
      {
        id: 9,
        type: 'multiple_choice',
        difficulty: 'advanced',
        question: 'How do you implement attention mechanisms?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        explanation: 'Attention focuses on relevant parts of input',
        hardware_relevance: 'high',
        learning_style: 'visual'
      },
      {
        id: 10,
        type: 'multiple_choice',
        difficulty: 'advanced',
        question: 'How do you optimize model deployment?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'B',
        explanation: 'Model compression and optimization techniques',
        hardware_relevance: 'high',
        learning_style: 'auditory'
      }
    ],
    hardware_assessment: {
      compatibility_score: 'high',
      recommendations: ['Add GPU for training'],
      fallback_options: ['Google Colab', 'AWS SageMaker']
    },
    learning_recommendations: {
      style: 'visual',
      resources: ['YouTube tutorials', 'Interactive notebooks'],
      pace: 'standard'
    }
  };
} 