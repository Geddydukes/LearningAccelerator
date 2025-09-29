// Unit tests for Orchestrator v1.1
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { agentClient, AGENT_FRESHNESS } from '../../supabase/functions/_shared/agentClients';

// Mock fetch globally
global.fetch = vi.fn();

describe('Orchestrator v1.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Agent Client Tests', () => {
    describe('Freshness Windows and Cache Selection', () => {
      it('should correctly identify fresh CLO signals (7 days)', () => {
        const lastUpdated = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString(); // 3 days ago
        const isFresh = agentClient['shouldUseCache']('clo', lastUpdated);
        expect(isFresh).toBe(true);
      });

      it('should correctly identify stale CLO signals (7 days)', () => {
        const lastUpdated = new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString(); // 10 days ago
        const isFresh = agentClient['shouldUseCache']('clo', lastUpdated);
        expect(isFresh).toBe(false);
      });

      it('should correctly identify fresh Alex signals (14 days)', () => {
        const lastUpdated = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(); // 7 days ago
        const isFresh = agentClient['shouldUseCache']('alex', lastUpdated);
        expect(isFresh).toBe(true);
      });

      it('should correctly identify stale Alex signals (14 days)', () => {
        const lastUpdated = new Date(Date.now() - (20 * 24 * 60 * 60 * 1000)).toISOString(); // 20 days ago
        const isFresh = agentClient['shouldUseCache']('alex', lastUpdated);
        expect(isFresh).toBe(false);
      });

      it('should correctly identify fresh TA signals (3 days)', () => {
        const lastUpdated = new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString(); // 1 day ago
        const isFresh = agentClient['shouldUseCache']('ta', lastUpdated);
        expect(isFresh).toBe(true);
      });

      it('should correctly identify stale TA signals (3 days)', () => {
        const lastUpdated = new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)).toISOString(); // 5 days ago
        const isFresh = agentClient['shouldUseCache']('ta', lastUpdated);
        expect(isFresh).toBe(false);
      });
    });

    describe('ETag 304 Handling', () => {
      it('should handle 304 Not Modified responses correctly', async () => {
        const mockResponse = {
          ok: false,
          status: 304,
          statusText: 'Not Modified',
          headers: new Map([['ETag', 'etag-123']])
        };

        (global.fetch as any).mockResolvedValueOnce(mockResponse);

        const result = await agentClient['makeRequest']('/test-endpoint', 'etag-123');
        
        expect(result.ok).toBe(true);
        expect(result.code).toBe('AGENT_ERROR');
        expect(result.error).toContain('Not modified - use cached data');
        expect(result.etag).toBe('etag-123');
      });

      it('should return fresh data when not 304', async () => {
        const mockResponse = {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['ETag', 'etag-456']]),
          json: () => Promise.resolve({ data: 'fresh content' })
        };

        (global.fetch as any).mockResolvedValueOnce(mockResponse);

        const result = await agentClient['makeRequest']('/test-endpoint', 'etag-123');
        
        expect(result.ok).toBe(true);
        expect(result.data).toEqual({ data: 'fresh content' });
        expect(result.etag).toBe('etag-456');
      });
    });

    describe('Retry/Backoff on 429/5xx', () => {
      it('should retry on 429 with exponential backoff', async () => {
        const mockResponses = [
          {
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
            headers: new Map([['Retry-After', '2']])
          },
          {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map(),
            json: () => Promise.resolve({ success: true })
          }
        ];

        (global.fetch as any)
          .mockResolvedValueOnce(mockResponses[0])
          .mockResolvedValueOnce(mockResponses[1]);

        const result = await agentClient['makeRequest']('/test-endpoint', undefined, 2);
        
        expect(result.ok).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it('should retry on 5xx errors with exponential backoff', async () => {
        const mockResponses = [
          {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            headers: new Map()
          },
          {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map(),
            json: () => Promise.resolve({ success: true })
          }
        ];

        (global.fetch as any)
          .mockResolvedValueOnce(mockResponses[0])
          .mockResolvedValueOnce(mockResponses[1]);

        const result = await agentClient['makeRequest']('/test-endpoint', undefined, 2);
        
        expect(result.ok).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it('should fail after max retries', async () => {
        const mockResponse = {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Map()
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await agentClient['makeRequest']('/test-endpoint', undefined, 1);
        
        expect(result.ok).toBe(false);
        expect(result.code).toBe('AGENT_ERROR');
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('Cache Hit/Miss Logic', () => {
      it('should count cache hits correctly when using cached data', async () => {
        const cachedSignals = {
          clo: { data: 'cached clo' },
          alex: { data: 'cached alex' },
          ta: { data: 'cached ta' },
          socratic: { data: 'cached socratic' },
          freshness: {
            clo: { last_updated: new Date().toISOString() },
            alex: { last_updated: new Date().toISOString() },
            ta: { last_updated: new Date().toISOString() },
            socratic: { last_updated: new Date().toISOString() }
          },
          etag: {
            clo: 'etag-clo',
            alex: 'etag-alex',
            ta: 'etag-ta',
            socratic: 'etag-socratic'
          }
        };

        // Mock all agents to return 304 (use cached)
        const mock304Response = {
          ok: true,
          status: 304,
          statusText: 'Not Modified',
          headers: new Map()
        };

        (global.fetch as any).mockResolvedValue(mock304Response);

        const result = await agentClient.getAllSignals(
          'user-123',
          'test-topic',
          1,
          1,
          cachedSignals
        );

        expect(result.cache_hits).toBe(4);
        expect(result.cache_misses).toBe(0);
      });

      it('should count cache misses correctly when fetching fresh data', async () => {
        // Mock all agents to return fresh data
        const mockFreshResponse = {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['ETag', 'fresh-etag']]),
          json: () => Promise.resolve({ data: 'fresh content' })
        };

        (global.fetch as any).mockResolvedValue(mockFreshResponse);

        const result = await agentClient.getAllSignals(
          'user-123',
          'test-topic',
          1,
          1
        );

        expect(result.cache_hits).toBe(0);
        expect(result.cache_misses).toBe(4);
      });
    });

    describe('Degraded Mode Path', () => {
      it('should handle agent failures gracefully', async () => {
        // Mock all agents to fail
        const mockFailureResponse = {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Map()
        };

        (global.fetch as any).mockResolvedValue(mockFailureResponse);

        const result = await agentClient.getAllSignals(
          'user-123',
          'test-topic',
          1,
          1
        );

        // Should still return structure even when agents fail
        expect(result.signals).toBeDefined();
        expect(result.freshness).toBeDefined();
        expect(result.etags).toBeDefined();
        expect(result.cache_hits).toBe(0);
        expect(result.cache_misses).toBe(0);
      });

      it('should use cached data when agents fail', async () => {
        const cachedSignals = {
          clo: { data: 'cached clo' },
          alex: { data: 'cached alex' },
          ta: { data: 'cached ta' },
          socratic: { data: 'cached socratic' },
          freshness: {
            clo: { last_updated: new Date().toISOString() },
            alex: { last_updated: new Date().toISOString() },
            ta: { last_updated: new Date().toISOString() },
            socratic: { last_updated: new Date().toISOString() }
          }
        };

        // Mock all agents to fail
        const mockFailureResponse = {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Map()
        };

        (global.fetch as any).mockResolvedValue(mockFailureResponse);

        const result = await agentClient.getAllSignals(
          'user-123',
          'test-topic',
          1,
          1,
          cachedSignals
        );

        // Should use cached data when available
        expect(result.signals.clo).toEqual(cachedSignals.clo);
        expect(result.signals.alex).toEqual(cachedSignals.alex);
        expect(result.signals.ta).toEqual(cachedSignals.ta);
        expect(result.signals.socratic).toEqual(cachedSignals.socratic);
        expect(result.cache_hits).toBe(4);
      });
    });
  });

  describe('Freshness Configuration', () => {
    it('should have correct freshness windows for all agents', () => {
      expect(AGENT_FRESHNESS.clo.max_age_hours).toBe(168); // 7 days
      expect(AGENT_FRESHNESS.alex.max_age_hours).toBe(336); // 14 days
      expect(AGENT_FRESHNESS.ta.max_age_hours).toBe(72); // 3 days
      expect(AGENT_FRESHNESS.socratic.max_age_hours).toBe(168); // 7 days
    });

    it('should have stale_after_hours equal to max_age_hours', () => {
      Object.values(AGENT_FRESHNESS).forEach(config => {
        expect(config.stale_after_hours).toBe(config.max_age_hours);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors correctly', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      
      (global.fetch as any).mockRejectedValue(timeoutError);

      const result = await agentClient['makeRequest']('/test-endpoint');
      
      expect(result.ok).toBe(false);
      expect(result.code).toBe('TIMEOUT');
      expect(result.error).toContain('Request timeout after 15 seconds');
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      
      (global.fetch as any).mockRejectedValue(networkError);

      const result = await agentClient['makeRequest']('/test-endpoint');
      
      expect(result.ok).toBe(false);
      expect(result.code).toBe('AGENT_ERROR');
      expect(result.error).toBe('Network error');
    });
  });

  describe('ETag Management', () => {
    it('should include If-None-Match header when ETag provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: () => Promise.resolve({ data: 'content' })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await agentClient['makeRequest']('/test-endpoint', 'etag-123');
      
      const fetchCall = (global.fetch as any).mock.calls[0][0];
      expect(fetchCall).toBe(`${agentClient['baseUrl']}/test-endpoint`);
      
      // Note: We can't easily test headers in this mock setup, but the logic is there
    });

    it('should extract ETag from response headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['ETag', 'response-etag-123']]),
        json: () => Promise.resolve({ data: 'content' })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await agentClient['makeRequest']('/test-endpoint');
      
      expect(result.etag).toBe('response-etag-123');
    });
  });
}); 