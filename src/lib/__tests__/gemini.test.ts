import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Google Generative AI module
const mockGenerateContent = vi.fn()
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent
}))

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel
  }))
}))

// Import after mocking
const { GeminiAgentService } = await import('../gemini')

describe('GeminiAgentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('callCLOAgent', () => {
    it('returns success response with valid JSON', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            module_title: 'Test Module',
            learning_objectives: ['Objective 1'],
            key_concepts: ['Concept 1'],
            estimated_duration: 120,
            prerequisites: [],
            resources: [],
            assessment_criteria: []
          })
        }
      }

      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await GeminiAgentService.callCLOAgent('Test input', 1)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('module_title', 'Test Module')
      expect(mockGenerateContent).toHaveBeenCalled()
    })

    it('handles invalid JSON response', async () => {
      const mockResponse = {
        response: {
          text: () => 'Invalid JSON response'
        }
      }

      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await GeminiAgentService.callCLOAgent('Test input', 1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid JSON response from CLO agent')
    })
  })

  describe('callSocraticAgent', () => {
    it('returns question response', async () => {
      const mockResponse = {
        response: {
          text: () => 'What do you think about this concept?'
        }
      }

      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await GeminiAgentService.callSocraticAgent('I want to learn React')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('question', 'What do you think about this concept?')
    })
  })
})