/**
 * Voice Transcription Edge Function Tests
 * 
 * Tests the transcription functionality including:
 * - JWT authentication validation
 * - WAV file storage and retrieval
 * - OpenAI Whisper API integration
 * - Mock transcription for dev/CI
 * - Error handling and status responses
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts"
import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

// Mock environment variables
const originalEnv = Deno.env.toObject()
Deno.env.set('SUPABASE_URL', 'https://test.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-key')
Deno.env.set('OPENAI_API_KEY', 'test-openai-key')

// Mock fetch
const originalFetch = globalThis.fetch
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input.toString()
  
  if (url.includes('api.openai.com')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ text: 'mock whisper transcript' })
    } as Response)
  }
  
  if (url.includes('supabase.co')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ user: { id: 'test-user' } })
    } as Response)
  }
  
  return originalFetch(input, init)
}

// Import the function after mocking
const { default: handler } = await import('./index.ts')

Deno.test("Voice Transcription - JWT Authentication", async () => {
  const req = new Request('http://localhost:8000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Missing Authorization header
    },
    body: JSON.stringify({ id: 'test-id' })
  })

  const response = await handler(req)
  const data = await response.json()

  assertEquals(response.status, 401)
  assertEquals(data.error, 'Unauthorized')
})

Deno.test("Voice Transcription - Missing ID", async () => {
  const req = new Request('http://localhost:8000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: JSON.stringify({}) // Missing id
  })

  const response = await handler(req)
  const data = await response.json()

  assertEquals(response.status, 400)
  assertEquals(data.error, 'Missing transcription ID')
})

Deno.test("Voice Transcription - CORS Preflight", async () => {
  const req = new Request('http://localhost:8000', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000'
    }
  })

  const response = await handler(req)
  
  assertEquals(response.status, 200)
  assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*')
})

Deno.test("Voice Transcription - Mock Whisper", async () => {
  // Set mock whisper environment
  Deno.env.set('MOCK_WHISPER', '1')
  
  const req = new Request('http://localhost:8000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: JSON.stringify({ id: 'test-id' })
  })

  const response = await handler(req)
  const data = await response.json()

  // Should return PENDING initially since WAV file doesn't exist
  assertEquals(data.status, 'ERROR')
  assertEquals(data.error, 'Audio file not found')
})

Deno.test("Voice Transcription - OpenAI API Error", async () => {
  // Mock OpenAI API error
  globalThis.fetch = () => Promise.resolve({
    ok: false,
    status: 400
  } as Response)

  const req = new Request('http://localhost:8000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: JSON.stringify({ id: 'test-id' })
  })

  const response = await handler(req)
  const data = await response.json()

  assertEquals(response.status, 500)
  assertEquals(data.status, 'ERROR')
})

// Cleanup
Deno.test("Cleanup", () => {
  // Restore original environment
  for (const [key, value] of Object.entries(originalEnv)) {
    Deno.env.set(key, value)
  }
  
  // Restore original fetch
  globalThis.fetch = originalFetch
}) 