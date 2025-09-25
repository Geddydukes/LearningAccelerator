/**
 * Stubs Index - Local Development Utilities
 * 
 * This module provides stub implementations for external services
 * when running locally without API keys. This allows developers
 * to test the complete application flow without needing real
 * LLM or TTS API access.
 */

export { LLMStub, llmStub, configureLLMStub } from './llmStub';
export { TTSStub, ttsStub, configureTTSStub, isTTSStubEnabled, enableTTSStub, disableTTSStub } from './ttsStub';

// Environment detection
export function isLocalDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
}

export function isStubModeEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_STUBS === 'true' || isLocalDevelopment();
}

// Configuration helpers
export function configureStubs(config: {
  llm?: {
    enabled?: boolean;
    delay?: number;
    errorRate?: number;
    responseVariation?: boolean;
  };
  tts?: {
    enabled?: boolean;
    delay?: number;
    errorRate?: number;
    audioFormat?: 'mp3' | 'wav' | 'ogg';
    voice?: 'male' | 'female' | 'neutral';
  };
}) {
  if (config.llm) {
    configureLLMStub(config.llm);
  }
  
  if (config.tts) {
    configureTTSStub(config.tts);
  }
}

// Default configuration for local development
export function setupDefaultStubs() {
  if (isStubModeEnabled()) {
    configureStubs({
      llm: {
        enabled: true,
        delay: 1000,
        errorRate: 0.05,
        responseVariation: true
      },
      tts: {
        enabled: true,
        delay: 2000,
        errorRate: 0.03,
        audioFormat: 'mp3',
        voice: 'neutral'
      }
    });
  }
}

// Auto-setup stubs in development
if (isLocalDevelopment()) {
  setupDefaultStubs();
}
