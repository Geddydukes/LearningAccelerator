/**
 * Voice Integration Hook Tests
 * 
 * Tests the voice integration functionality including:
 * - MediaRecorder recording with size/time limits
 * - Upload to voice/upload endpoint
 * - Polling for transcription status
 * - Error handling and toast notifications
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVoiceIntegration } from './useVoiceIntegration';

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn()
  }
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      access_token: 'mock-token'
    }
  })
}));

vi.mock('./useSocraticTTS', () => ({
  useSocraticTTS: () => ({
    generateAudio: vi.fn(),
    playAudio: vi.fn(),
    pauseAudio: vi.fn(),
    isLoading: false,
    isPlaying: false,
    audioUrl: null,
    error: null
  })
}));

// Mock fetch
global.fetch = vi.fn();

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  state: 'inactive',
  ondataavailable: null as ((event: any) => void) | null,
  onstop: null as (() => void) | null,
  stream: {
    getTracks: () => [{ stop: vi.fn() }]
  }
};

// Mock browser APIs
Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: vi.fn(() => Promise.resolve({
        getTracks: () => [{ stop: vi.fn() }]
      }))
    }
  },
  writable: true
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
});

Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn()
    }))
  },
  writable: true
});

describe('useVoiceIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock MediaRecorder constructor
    global.MediaRecorder = vi.fn().mockImplementation(() => mockMediaRecorder) as any;
    (global.MediaRecorder as any).isTypeSupported = vi.fn(() => true);
    
    // Mock Blob
    global.Blob = vi.fn().mockImplementation((chunks, options) => ({
      size: 1024,
      type: options?.type || 'audio/wav'
    }));
  });

  describe('startRecording', () => {
    it('should start recording with correct audio constraints', async () => {
      const { result } = renderHook(() => useVoiceIntegration());

      await act(async () => {
        await result.current.startRecording();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      expect(MediaRecorder).toHaveBeenCalledWith(
        expect.any(Object),
        { mimeType: 'audio/wav' }
      );
      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    it('should handle recording completion and upload', async () => {
      const mockUploadResponse = { id: 'test-id' };
      const mockTranscribeResponse = { 
        status: 'COMPLETED', 
        text: 'mock transcript' 
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUploadResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTranscribeResponse)
        });

      const onTranscriptReady = vi.fn();
      const { result } = renderHook(() => useVoiceIntegration({ onTranscriptReady }));

      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate recording completion
      await act(async () => {
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop();
        }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/voice/upload',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
          },
          body: expect.any(FormData)
        })
      );
    });

    it('should handle upload errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const { result } = renderHook(() => useVoiceIntegration());

      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate recording completion
      await act(async () => {
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop();
        }
      });

      const { default: toast } = await import('react-hot-toast');
      expect(toast.error).toHaveBeenCalledWith('Failed to upload audio');
    });

    it('should handle transcription timeout', async () => {
      const mockUploadResponse = { id: 'test-id' };
      const mockTranscribeResponse = { status: 'PENDING' };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUploadResponse)
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockTranscribeResponse)
        });

      const { result } = renderHook(() => useVoiceIntegration());

      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate recording completion
      await act(async () => {
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop();
        }
      });

      // Wait for timeout (25 attempts)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const { default: toast } = await import('react-hot-toast');
      expect(toast.error).toHaveBeenCalledWith('Transcription timeout');
    });

    it('should handle transcription errors', async () => {
      const mockUploadResponse = { id: 'test-id' };
      const mockTranscribeResponse = { 
        status: 'ERROR', 
        error: 'Transcription failed' 
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUploadResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTranscribeResponse)
        });

      const { result } = renderHook(() => useVoiceIntegration());

      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate recording completion
      await act(async () => {
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop();
        }
      });

      const { default: toast } = await import('react-hot-toast');
      expect(toast.error).toHaveBeenCalledWith('Transcription failed');
    });

    it('should stop recording after 30 seconds', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useVoiceIntegration());

      await act(async () => {
        await result.current.startRecording();
      });

      // Fast-forward 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(mockMediaRecorder.stop).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should stop recording when size limit is reached', async () => {
      const { result } = renderHook(() => useVoiceIntegration());

      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate data available with large size
      await act(async () => {
        if (mockMediaRecorder.ondataavailable) {
          mockMediaRecorder.ondataavailable({
            data: { size: 4 * 1024 * 1024 } // 4MB
          });
        }
      });

      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    });
  });

  describe('stopRecording', () => {
    it('should stop recording and clear timeout', async () => {
      const { result } = renderHook(() => useVoiceIntegration());

      await act(async () => {
        await result.current.startRecording();
      });

      await act(async () => {
        result.current.stopRecording();
      });

      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    });
  });

  describe('speech recognition', () => {
    it('should initialize speech recognition correctly', () => {
      const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
        continuous: false,
        interimResults: false,
        lang: '',
        start: vi.fn(),
        stop: vi.fn(),
        onstart: null,
        onresult: null,
        onerror: null,
        onend: null
      }));

      Object.defineProperty(global, 'SpeechRecognition', {
        value: mockSpeechRecognition,
        writable: true
      });

      const { result } = renderHook(() => useVoiceIntegration());

      act(() => {
        result.current.startListening();
      });

      expect(mockSpeechRecognition).toHaveBeenCalled();
    });

    it('should handle speech recognition errors', async () => {
      const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
        continuous: false,
        interimResults: false,
        lang: '',
        start: vi.fn(),
        stop: vi.fn(),
        onstart: null,
        onresult: null,
        onerror: null,
        onend: null
      }));

      Object.defineProperty(global, 'SpeechRecognition', {
        value: mockSpeechRecognition,
        writable: true
      });

      const { result } = renderHook(() => useVoiceIntegration());

      act(() => {
        result.current.startListening();
      });

      // Simulate error
      const mockRecognition = mockSpeechRecognition.mock.results[0].value;
      if (mockRecognition.onerror) {
        mockRecognition.onerror({ error: 'network' });
      }

      const { default: toast } = await import('react-hot-toast');
      expect(toast.error).toHaveBeenCalledWith('Speech recognition failed');
    });
  });

  describe('utilities', () => {
    it('should download transcript', () => {
      const { result } = renderHook(() => useVoiceIntegration());

      act(() => {
        result.current.downloadTranscript('test transcript', 'test.txt');
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should check voice support', () => {
      const { result } = renderHook(() => useVoiceIntegration());

      expect(typeof result.current.hasVoiceSupport).toBe('boolean');
    });
  });
}); 