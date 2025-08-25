// Agent response correlation layer
// Stores last N responses in memory and localStorage for debugging and analytics

export interface AgentKey {
  agentId: string;
  intentId?: string;
  week?: number;
  day?: number;
  hash: string;
}

export interface CorrelatedResponse {
  agentId: string;
  hash: string;
  response: any;
  timestamp: number;
  correlationId: string;
  durationMs: number;
  cached: boolean;
}

class AgentCorrelationManager {
  private static instance: AgentCorrelationManager;
  private memoryStore: Map<string, CorrelatedResponse> = new Map();
  private readonly maxMemoryItems = 100;
  private readonly localStorageKey = 'agent_correlations';

  static getInstance(): AgentCorrelationManager {
    if (!AgentCorrelationManager.instance) {
      AgentCorrelationManager.instance = new AgentCorrelationManager();
    }
    return AgentCorrelationManager.instance;
  }

  /**
   * Store a response with correlation data
   */
  storeResponse(
    agentKey: AgentKey,
    response: any,
    correlationId: string,
    durationMs: number,
    cached: boolean
  ): void {
    const key = this.generateKey(agentKey);
    const correlatedResponse: CorrelatedResponse = {
      agentId: agentKey.agentId,
      hash: agentKey.hash,
      response,
      timestamp: Date.now(),
      correlationId,
      durationMs,
      cached
    };

    // Store in memory
    this.memoryStore.set(key, correlatedResponse);
    
    // Cleanup old items if we exceed max
    if (this.memoryStore.size > this.maxMemoryItems) {
      const oldestKey = this.memoryStore.keys().next().value;
      this.memoryStore.delete(oldestKey);
    }

    // Store in localStorage for persistence
    this.persistToStorage();
  }

  /**
   * Retrieve a response by agent key
   */
  getResponse(agentKey: AgentKey): CorrelatedResponse | undefined {
    const key = this.generateKey(agentKey);
    return this.memoryStore.get(key);
  }

  /**
   * Get all responses for a specific agent
   */
  getAgentResponses(agentId: string): CorrelatedResponse[] {
    return Array.from(this.memoryStore.values())
      .filter(response => response.agentId === agentId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get recent responses across all agents
   */
  getRecentResponses(limit: number = 20): CorrelatedResponse[] {
    return Array.from(this.memoryStore.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear all correlations (useful for testing)
   */
  clearAll(): void {
    this.memoryStore.clear();
    localStorage.removeItem(this.localStorageKey);
  }

  /**
   * Get correlation statistics
   */
  getStats(): {
    totalResponses: number;
    agents: Record<string, number>;
    averageDuration: number;
    cacheHitRate: number;
  } {
    const responses = Array.from(this.memoryStore.values());
    const agents: Record<string, number> = {};
    
    responses.forEach(response => {
      agents[response.agentId] = (agents[response.agentId] || 0) + 1;
    });

    const totalDuration = responses.reduce((sum, r) => sum + r.durationMs, 0);
    const cacheHits = responses.filter(r => r.cached).length;

    return {
      totalResponses: responses.length,
      agents,
      averageDuration: responses.length > 0 ? totalDuration / responses.length : 0,
      cacheHitRate: responses.length > 0 ? cacheHits / responses.length : 0
    };
  }

  private generateKey(agentKey: AgentKey): string {
    const parts = [
      agentKey.agentId,
      agentKey.intentId || 'none',
      agentKey.week?.toString() || 'none',
      agentKey.day?.toString() || 'none',
      agentKey.hash
    ];
    return parts.join('|');
  }

  private persistToStorage(): void {
    try {
      const data = Array.from(this.memoryStore.values());
      localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Failed to persist correlations to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        const data: CorrelatedResponse[] = JSON.parse(stored);
        data.forEach(item => {
          const key = this.generateKey({
            agentId: item.agentId,
            hash: item.hash
          });
          this.memoryStore.set(key, item);
        });
      }
    } catch (error) {
      console.warn('⚠️ Failed to load correlations from localStorage:', error);
    }
  }
}

// Export singleton instance
export const correlationManager = AgentCorrelationManager.getInstance();

// Convenience functions
export function storeCorrelation(
  agentKey: AgentKey,
  response: any,
  correlationId: string,
  durationMs: number,
  cached: boolean
): void {
  correlationManager.storeResponse(agentKey, response, correlationId, durationMs, cached);
}

export function getCorrelation(agentKey: AgentKey): CorrelatedResponse | undefined {
  return correlationManager.getResponse(agentKey);
}

export function getAgentCorrelations(agentId: string): CorrelatedResponse[] {
  return correlationManager.getAgentResponses(agentId);
}

export function getCorrelationStats() {
  return correlationManager.getStats();
}
