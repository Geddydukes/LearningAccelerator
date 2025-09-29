// Shared Agent Clients for Orchestrator v1.1
// Provides thin wrappers for CLO/TA/Alex/Socratic with ETag support

export interface AgentResponse<T = any> {
  ok: boolean;
  data?: T;
  code?: 'TIMEOUT' | 'RATE_LIMIT' | 'BAD_SCHEMA' | 'AGENT_ERROR';
  retryAfter?: number;
  error?: string;
  etag?: string;
  freshness?: {
    last_updated: string;
    expires_at: string;
    is_stale: boolean;
  };
}

export interface CacheEntry<T = any> {
  data: T;
  etag: string;
  last_updated: string;
  expires_at: string;
}

export interface FreshnessConfig {
  max_age_hours: number;
  stale_after_hours: number;
}

// Freshness configurations for each agent
export const AGENT_FRESHNESS: Record<string, FreshnessConfig> = {
  clo: { max_age_hours: 168, stale_after_hours: 168 }, // 7 days
  alex: { max_age_hours: 336, stale_after_hours: 336 }, // 14 days
  ta: { max_age_hours: 72, stale_after_hours: 72 }, // 3 days
  socratic: { max_age_hours: 168, stale_after_hours: 168 }, // 7 days
};

export class AgentClient {
  private baseUrl: string;
  private serviceJwt: string;

  constructor() {
    this.baseUrl = Deno.env.get('EDGE_BASE_URL') || 'http://localhost:54321';
    this.serviceJwt = Deno.env.get('EDGE_SERVICE_JWT') || '';
  }

  /**
   * Check if cached data is fresh based on freshness config
   */
  private isFresh(
    lastUpdated: string,
    config: FreshnessConfig
  ): boolean {
    const lastUpdate = new Date(lastUpdated);
    const now = new Date();
    const ageHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    return ageHours < config.max_age_hours;
  }

  /**
   * Check if cached data is stale based on freshness config
   */
  private isStale(
    lastUpdated: string,
    config: FreshnessConfig
  ): boolean {
    const lastUpdate = new Date(lastUpdated);
    const now = new Date();
    const ageHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    return ageHours >= config.stale_after_hours;
  }

  /**
   * Calculate freshness information for a cache entry
   */
  private calculateFreshness(
    lastUpdated: string,
    config: FreshnessConfig
  ) {
    const lastUpdate = new Date(lastUpdated);
    const expiresAt = new Date(lastUpdate.getTime() + (config.max_age_hours * 60 * 60 * 1000));
    const isStale = this.isStale(lastUpdated, config);
    
    return {
      last_updated: lastUpdated,
      expires_at: expiresAt.toISOString(),
      is_stale: isStale,
    };
  }

  /**
   * Make a request to an agent with ETag support and retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    etag?: string,
    retries: number = 3
  ): Promise<AgentResponse<T>> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.serviceJwt}`,
      'Content-Type': 'application/json',
    };

    if (etag) {
      headers['If-None-Match'] = etag;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      // Handle 304 Not Modified (use cached data)
      if (response.status === 304) {
        return {
          ok: true,
          code: 'AGENT_ERROR',
          error: 'Not modified - use cached data',
          etag: etag,
        };
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter) : 60;
        
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, retryAfterSeconds * 1000));
          return this.makeRequest(endpoint, etag, retries - 1);
        }
        
        return {
          ok: false,
          code: 'RATE_LIMIT',
          retryAfter: retryAfterSeconds,
          error: 'Rate limited by agent',
        };
      }

      // Handle other errors
      if (!response.ok) {
        if (retries > 0 && response.status >= 500) {
          const backoffMs = Math.pow(2, 3 - retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          return this.makeRequest(endpoint, etag, retries - 1);
        }
        
        return {
          ok: false,
          code: 'AGENT_ERROR',
          error: `Agent returned ${response.status}: ${response.statusText}`,
        };
      }

      // Success response
      const data = await response.json();
      const responseEtag = response.headers.get('ETag');
      
      return {
        ok: true,
        data,
        etag: responseEtag || undefined,
      };

    } catch (error) {
      if (error.name === 'TimeoutError') {
        return {
          ok: false,
          code: 'TIMEOUT',
          error: 'Request timeout after 15 seconds',
        };
      }
      
      return {
        ok: false,
        code: 'AGENT_ERROR',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get CLO signals for a user/topic
   */
  async getCLOSignals(
    userId: string,
    topic: string,
    week?: number,
    day?: number,
    etag?: string
  ): Promise<AgentResponse> {
    const endpoint = `/functions/v1/agent-proxy/clo/signals?user_id=${userId}&topic=${encodeURIComponent(topic)}${week ? `&week=${week}` : ''}${day ? `&day=${day}` : ''}`;
    
    return this.makeRequest(endpoint, etag);
  }

  /**
   * Get TA signals for a user/topic
   */
  async getTASignals(
    userId: string,
    topic: string,
    week?: number,
    day?: number,
    etag?: string
  ): Promise<AgentResponse> {
    const endpoint = `/functions/v1/agent-proxy/ta/signals?user_id=${userId}&topic=${encodeURIComponent(topic)}${week ? `&week=${week}` : ''}${day ? `&day=${day}` : ''}`;
    
    return this.makeRequest(endpoint, etag);
  }

  /**
   * Get Alex signals for a user/topic
   */
  async getAlexSignals(
    userId: string,
    topic: string,
    etag?: string
  ): Promise<AgentResponse> {
    const endpoint = `/functions/v1/agent-proxy/alex/signals?user_id=${userId}&topic=${encodeURIComponent(topic)}`;
    
    return this.makeRequest(endpoint, etag);
  }

  /**
   * Get Socratic signals for a user/topic
   */
  async getSocraticSignals(
    userId: string,
    topic: string,
    etag?: string
  ): Promise<AgentResponse> {
    const endpoint = `/functions/v1/agent-proxy/socratic/signals?user_id=${userId}&topic=${encodeURIComponent(topic)}`;
    
    return this.makeRequest(endpoint, etag);
  }

  /**
   * Evaluate cache freshness for all agents
   */
  evaluateCacheFreshness(cacheEntry: any): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [agent, config] of Object.entries(AGENT_FRESHNESS)) {
      if (cacheEntry[agent] && cacheEntry.freshness?.[agent]?.last_updated) {
        result[agent] = this.calculateFreshness(
          cacheEntry.freshness[agent].last_updated,
          config
        );
      } else {
        result[agent] = {
          last_updated: null,
          expires_at: null,
          is_stale: true,
        };
      }
    }
    
    return result;
  }

  /**
   * Check if we should use cached data for an agent
   */
  shouldUseCache(
    agent: string,
    lastUpdated: string
  ): boolean {
    const config = AGENT_FRESHNESS[agent];
    if (!config) return false;
    
    return this.isFresh(lastUpdated, config);
  }

  /**
   * Get all agent signals in parallel with caching
   */
  async getAllSignals(
    userId: string,
    topic: string,
    week?: number,
    day?: number,
    cachedSignals?: any
  ): Promise<{
    signals: Record<string, any>;
    freshness: Record<string, any>;
    etags: Record<string, string>;
    cache_hits: number;
    cache_misses: number;
  }> {
    const signals: Record<string, any> = {};
    const freshness: Record<string, any> = {};
    const etags: Record<string, string> = {};
    let cacheHits = 0;
    let cacheMisses = 0;

    // Prepare requests for all agents
    const requests = [
      {
        agent: 'clo',
        request: () => this.getCLOSignals(userId, topic, week, day, cachedSignals?.etag?.clo),
      },
      {
        agent: 'ta',
        request: () => this.getTASignals(userId, topic, week, day, cachedSignals?.etag?.ta),
      },
      {
        agent: 'alex',
        request: () => this.getAlexSignals(userId, topic, cachedSignals?.etag?.alex),
      },
      {
        agent: 'socratic',
        request: () => this.getSocraticSignals(userId, topic, cachedSignals?.etag?.socratic),
      },
    ];

    // Execute requests in parallel
    const results = await Promise.allSettled(
      requests.map(async ({ agent, request }) => {
        const result = await request();
        return { agent, result };
      })
    );

    // Process results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { agent, result: agentResult } = result.value;
        
        if (agentResult.ok) {
          if (agentResult.code === 'AGENT_ERROR' && agentResult.error?.includes('Not modified')) {
            // Use cached data
            signals[agent] = cachedSignals?.[agent];
            freshness[agent] = this.calculateFreshness(
              cachedSignals?.freshness?.[agent]?.last_updated || new Date().toISOString(),
              AGENT_FRESHNESS[agent]
            );
            cacheHits++;
          } else {
            // Use fresh data
            signals[agent] = agentResult.data;
            freshness[agent] = this.calculateFreshness(
              new Date().toISOString(),
              AGENT_FRESHNESS[agent]
            );
            if (agentResult.etag) {
              etags[agent] = agentResult.etag;
            }
            cacheMisses++;
          }
        } else {
          // Agent failed, use cached data if available
          if (cachedSignals?.[agent]) {
            signals[agent] = cachedSignals[agent];
            freshness[agent] = this.calculateFreshness(
              cachedSignals?.freshness?.[agent]?.last_updated || new Date().toISOString(),
              AGENT_FRESHNESS[agent]
            );
            cacheHits++;
          } else {
            signals[agent] = null;
            freshness[agent] = { last_updated: null, expires_at: null, is_stale: true };
          }
        }
      } else {
        // Request failed completely
        const agent = result.reason?.agent || 'unknown';
        if (cachedSignals?.[agent]) {
          signals[agent] = cachedSignals[agent];
          freshness[agent] = this.calculateFreshness(
            cachedSignals?.freshness?.[agent]?.last_updated || new Date().toISOString(),
            AGENT_FRESHNESS[agent]
          );
          cacheHits++;
        } else {
          signals[agent] = null;
          freshness[agent] = { last_updated: null, expires_at: null, is_stale: true };
        }
      }
    }

    return {
      signals,
      freshness,
      etags,
      cache_hits: cacheHits,
      cache_misses: cacheMisses,
    };
  }
}

// Export singleton instance
export const agentClient = new AgentClient(); 