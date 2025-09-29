/**
 * TTS (Text-to-Speech) Stub for Local Development
 * 
 * Provides mock audio responses for TTS calls when running locally without API keys.
 * This allows developers to test the complete voice interaction flow without needing
 * real TTS API access.
 */

export interface TTSStubConfig {
  enabled: boolean;
  delay: number; // Simulate API delay in ms
  errorRate: number; // 0-1, probability of returning error
  audioFormat: 'mp3' | 'wav' | 'ogg';
  voice: 'male' | 'female' | 'neutral';
}

export interface TTSStubResponse {
  audioUrl: string;
  duration: number; // in seconds
  format: string;
  voice: string;
  text: string;
}

export class TTSStub {
  private config: TTSStubConfig;
  private audioCounter = 0;

  constructor(config: Partial<TTSStubConfig> = {}) {
    this.config = {
      enabled: true,
      delay: 2000,
      errorRate: 0.03,
      audioFormat: 'mp3',
      voice: 'neutral',
      ...config
    };
  }

  async generateSpeech(text: string, voice?: string): Promise<TTSStubResponse> {
    if (!this.config.enabled) {
      throw new Error('TTS Stub is disabled');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, this.config.delay));

    // Simulate occasional errors
    if (Math.random() < this.config.errorRate) {
      throw new Error('Simulated TTS API error');
    }

    this.audioCounter++;

    // Generate mock audio URL
    const audioUrl = this.generateMockAudioUrl(text);
    
    // Estimate duration based on text length (average speaking rate: 150 words per minute)
    const wordCount = text.split(' ').length;
    const duration = (wordCount / 150) * 60; // Convert to seconds

    return {
      audioUrl,
      duration,
      format: this.config.audioFormat,
      voice: voice || this.config.voice,
      text
    };
  }

  private generateMockAudioUrl(text: string): string {
    // Generate a mock audio URL that would work in a real implementation
    const hash = this.hashString(text);
    return `data:audio/${this.config.audioFormat};base64,${hash}`;
  }

  private hashString(str: string): string {
    // Simple hash function to generate consistent mock data
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Method to simulate different voice characteristics
  setVoice(voice: 'male' | 'female' | 'neutral') {
    this.config.voice = voice;
  }

  // Method to simulate different audio formats
  setAudioFormat(format: 'mp3' | 'wav' | 'ogg') {
    this.config.audioFormat = format;
  }

  // Method to simulate network conditions
  setNetworkConditions(conditions: 'fast' | 'slow' | 'unreliable') {
    switch (conditions) {
      case 'fast':
        this.config.delay = 500;
        this.config.errorRate = 0.01;
        break;
      case 'slow':
        this.config.delay = 4000;
        this.config.errorRate = 0.02;
        break;
      case 'unreliable':
        this.config.delay = 2000;
        this.config.errorRate = 0.1;
        break;
    }
  }

  // Method to generate different types of mock audio
  generateMockAudio(text: string, type: 'lecture' | 'question' | 'feedback' | 'instruction'): TTSStubResponse {
    const baseResponse = this.generateSpeech(text);
    
    // Modify response based on type
    switch (type) {
      case 'lecture':
        return {
          ...baseResponse,
          voice: 'male',
          duration: baseResponse.duration * 1.2 // Lectures are slower
        };
      case 'question':
        return {
          ...baseResponse,
          voice: 'female',
          duration: baseResponse.duration * 0.8 // Questions are faster
        };
      case 'feedback':
        return {
          ...baseResponse,
          voice: 'neutral',
          duration: baseResponse.duration * 1.1 // Feedback is slightly slower
        };
      case 'instruction':
        return {
          ...baseResponse,
          voice: 'male',
          duration: baseResponse.duration * 0.9 // Instructions are clear and paced
        };
      default:
        return baseResponse;
    }
  }

  // Method to simulate audio playback
  async playAudio(audioUrl: string): Promise<void> {
    console.log(`🎵 Playing mock audio: ${audioUrl}`);
    
    // Simulate audio playback time
    const duration = Math.random() * 5 + 2; // 2-7 seconds
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    
    console.log(`✅ Audio playback completed`);
  }

  // Method to get available voices
  getAvailableVoices(): string[] {
    return ['male', 'female', 'neutral'];
  }

  // Method to get available formats
  getAvailableFormats(): string[] {
    return ['mp3', 'wav', 'ogg'];
  }
}

// Export singleton instance
export const ttsStub = new TTSStub();

// Export configuration helper
export function configureTTSStub(config: Partial<TTSStubConfig>) {
  Object.assign(ttsStub.config, config);
}

// Export utility functions
export function isTTSStubEnabled(): boolean {
  return ttsStub.config.enabled;
}

export function enableTTSStub(): void {
  ttsStub.config.enabled = true;
}

export function disableTTSStub(): void {
  ttsStub.config.enabled = false;
}
