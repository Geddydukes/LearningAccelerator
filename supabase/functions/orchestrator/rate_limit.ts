// Deno Edge Function - Rate Limiting Helper for Orchestrator
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitConfig {
  capacity: number;        // Maximum tokens
  refill_rate: number;     // Tokens per second
  default_tokens?: number; // Initial tokens (defaults to capacity)
}

export class RateLimiter {
  private supabase: any;
  private defaultConfig: RateLimitConfig;

  constructor() {
    this.supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    this.defaultConfig = {
      capacity: 100,
      refill_rate: 10, // 10 tokens per second
      default_tokens: 100
    };
  }

  /**
   * Check if a rate limit key has available tokens
   * @param key Rate limit key (e.g., 'user:{uid}:agent:clo')
   * @param tokensRequired Number of tokens needed
   * @param config Optional rate limit configuration
   * @returns Promise<boolean> - true if tokens available, false if rate limited
   */
  async checkRateLimit(
    key: string, 
    tokensRequired: number = 1, 
    config?: Partial<RateLimitConfig>
  ): Promise<boolean> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      // Get current rate limit state
      const { data: rateLimit, error } = await this.supabase
        .from('rate_limits')
        .select('*')
        .eq('rl_key', key)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking rate limit:', error);
        return true; // Allow if we can't check
      }

      let currentTokens: number;
      let lastRefill: Date;

      if (!rateLimit) {
        // Initialize new rate limit
        currentTokens = finalConfig.default_tokens || finalConfig.capacity;
        lastRefill = new Date();
        
        await this.supabase
          .from('rate_limits')
          .insert({
            rl_key: key,
            tokens: currentTokens,
            last_refill: lastRefill.toISOString(),
            refill_rate: finalConfig.refill_rate,
            capacity: finalConfig.capacity
          });
      } else {
        currentTokens = rateLimit.tokens;
        lastRefill = new Date(rateLimit.last_refill);
      }

      // Calculate refill since last check
      const now = new Date();
      const timeDiff = (now.getTime() - lastRefill.getTime()) / 1000; // seconds
      const refillAmount = timeDiff * finalConfig.refill_rate;
      
      // Refill tokens (don't exceed capacity)
      currentTokens = Math.min(
        finalConfig.capacity,
        currentTokens + refillAmount
      );

      // Check if we have enough tokens
      if (currentTokens < tokensRequired) {
        // Update the rate limit state
        await this.supabase
          .from('rate_limits')
          .upsert({
            rl_key: key,
            tokens: currentTokens,
            last_refill: now.toISOString(),
            refill_rate: finalConfig.refill_rate,
            capacity: finalConfig.capacity
          });
        
        return false; // Rate limited
      }

      // Consume tokens
      currentTokens -= tokensRequired;
      
      // Update the rate limit state
      await this.supabase
        .from('rate_limits')
        .upsert({
          rl_key: key,
          tokens: currentTokens,
          last_refill: now.toISOString(),
          refill_rate: finalConfig.refill_rate,
          capacity: finalConfig.capacity
        });

      return true; // Tokens available

    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow if rate limiting fails
    }
  }

  /**
   * Get current rate limit status for a key
   * @param key Rate limit key
   * @returns Promise<RateLimitStatus | null>
   */
  async getRateLimitStatus(key: string): Promise<RateLimitStatus | null> {
    try {
      const { data: rateLimit, error } = await this.supabase
        .from('rate_limits')
        .select('*')
        .eq('rl_key', key)
        .single();

      if (error) return null;

      const now = new Date();
      const lastRefill = new Date(rateLimit.last_refill);
      const timeDiff = (now.getTime() - lastRefill.getTime()) / 1000;
      const refillAmount = timeDiff * rateLimit.refill_rate;
      const currentTokens = Math.min(
        rateLimit.capacity,
        rateLimit.tokens + refillAmount
      );

      return {
        key: rateLimit.rl_key,
        current_tokens: currentTokens,
        capacity: rateLimit.capacity,
        refill_rate: rateLimit.refill_rate,
        last_refill: rateLimit.last_refill,
        next_refill_in: Math.max(0, 1 / rateLimit.refill_rate) // seconds until next token
      };

    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return null;
    }
  }

  /**
   * Reset a rate limit key to full capacity
   * @param key Rate limit key
   * @param config Optional configuration
   */
  async resetRateLimit(key: string, config?: Partial<RateLimitConfig>): Promise<void> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      await this.supabase
        .from('rate_limits')
        .upsert({
          rl_key: key,
          tokens: finalConfig.default_tokens || finalConfig.capacity,
          last_refill: new Date().toISOString(),
          refill_rate: finalConfig.refill_rate,
          capacity: finalConfig.capacity
        });

    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }

  /**
   * Generate rate limit key for user-agent combination
   * @param userId User ID
   * @param agent Agent name
   * @returns Rate limit key
   */
  generateKey(userId: string, agent: string): string {
    return `user:${userId}:agent:${agent}`;
  }

  /**
   * Generate rate limit key for global agent
   * @param agent Agent name
   * @returns Rate limit key
   */
  generateGlobalKey(agent: string): string {
    return `global:agent:${agent}`;
  }
}

export interface RateLimitStatus {
  key: string;
  current_tokens: number;
  capacity: number;
  refill_rate: number;
  last_refill: string;
  next_refill_in: number;
}

// Export a singleton instance
export const rateLimiter = new RateLimiter(); 