// Deno Edge Function - HTTP Helper for Orchestrator
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface HttpCallOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout_ms?: number;
  idempotency_key?: string;
}

export class OrchestratorHttp {
  private supabase: any;
  private baseUrl: string;
  private serviceJwt: string;

  constructor() {
    this.supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    this.baseUrl = Deno.env.get("EDGE_BASE_URL") || "http://localhost:54321";
    this.serviceJwt = Deno.env.get("EDGE_SERVICE_JWT") || "";
  }

  async call(endpoint: string, options: HttpCallOptions = {}) {
    const {
      method = "POST",
      headers = {},
      body,
      timeout_ms = 15000,
      idempotency_key
    } = options;

    const url = new URL(endpoint, this.baseUrl).toString();
    
    const requestHeaders: Record<string, string> = {
      "content-type": "application/json",
      "authorization": `Bearer ${this.serviceJwt}`,
      ...headers
    };

    if (idempotency_key) {
      requestHeaders["x-idempotency-key"] = idempotency_key;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout_ms);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseBody = await this.safeJson(response);

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout_ms}ms`);
      }
      
      throw error;
    }
  }

  async get(endpoint: string, options: Omit<HttpCallOptions, 'method' | 'body'> = {}) {
    return this.call(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, options: Omit<HttpCallOptions, 'method'> = {}) {
    return this.call(endpoint, { ...options, method: 'POST' });
  }

  async put(endpoint: string, options: Omit<HttpCallOptions, 'method'> = {}) {
    return this.call(endpoint, { ...options, method: 'PUT' });
  }

  async delete(endpoint: string, options: Omit<HttpCallOptions, 'method' | 'body'> = {}) {
    return this.call(endpoint, { ...options, method: 'DELETE' });
  }

  private async safeJson(response: Response) {
    try {
      return await response.json();
    } catch {
      return { text: await response.text().catch(() => "") };
    }
  }

  // Helper method to check if a response indicates success
  isSuccess(response: any): boolean {
    return response.ok && response.status >= 200 && response.status < 300;
  }

  // Helper method to extract error information
  getErrorInfo(response: any): string {
    if (response.body?.error) {
      return response.body.error;
    }
    if (response.body?.message) {
      return response.body.message;
    }
    return `HTTP ${response.status}: ${response.statusText}`;
  }
}

// Export a singleton instance
export const orchestratorHttp = new OrchestratorHttp(); 