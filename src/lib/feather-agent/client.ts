import type { FeatherRun, FeatherRunRequest, FeatherRunResponse } from './types';

export interface FeatherAgentClientOptions {
  baseUrl: string;
  anonKey: string;
  fetchImpl?: typeof fetch;
}

export class FeatherAgentClient {
  private readonly baseUrl: string;
  private readonly anonKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: FeatherAgentClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.anonKey = options.anonKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async run<T extends FeatherRun = FeatherRun>(
    functionName: string,
    request: FeatherRunRequest,
  ): Promise<FeatherRunResponse<T>> {
    const response = await this.fetchImpl(`${this.baseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.anonKey}`,
        'apikey': this.anonKey,
      },
      body: JSON.stringify(request),
    });

    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: json?.error || `Request failed with status ${response.status}`,
        data: json?.data,
      } as FeatherRunResponse<T>;
    }

    return json as FeatherRunResponse<T>;
  }
}

export function extractPhaseArtifact<T = unknown>(
  run: FeatherRun,
  phaseId: string,
  artifactKind?: string,
): T | undefined {
  const phase = run.phases.find((p) => p.id === phaseId);
  if (!phase) return undefined;
  if (!artifactKind) {
    return phase.artifacts[0]?.data as T | undefined;
  }
  const artifact = phase.artifacts.find((a) => a.kind === artifactKind);
  return artifact?.data as T | undefined;
}
