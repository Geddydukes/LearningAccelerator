/**
 * Voice Integration Hook
 * 
 * Provides comprehensive voice functionality including:
 * - Speech recognition for real-time transcription
 * - Audio recording with MediaRecorder (44kHz, 16-bit WAV)
 * - Upload to voice/transcribe endpoint with polling
 * - Text-to-speech synthesis
 * 
 * @param options - Configuration options for voice integration
 * @returns Voice integration methods and state
 */
import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocraticTTS } from './useSocraticTTS';
import toast from 'react-hot-toast';
import React from 'react';

interface VoiceIntegrationOptions {
  autoPlay?: boolean;
  voice?: string;
  onTranscriptReady?: (transcript: string) => void;
}

interface UploadResponse {
  id: string;
}

interface TranscribeResponse {
  status: 'PENDING' | 'COMPLETED' | 'ERROR' | 'TIMEOUT';
  text?: string;
  error?: string;
}

// Global speech recognition types
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const useVoiceIntegration = (options: VoiceIntegrationOptions = {}) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    generateAudio,
    playAudio,
    pauseAudio,
    isLoading: ttsLoading,
    isPlaying,
    audioUrl,
    error: ttsError
  } = useSocraticTTS('', options.voice);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
      
      if (finalTranscript && options.onTranscriptReady) {
        options.onTranscriptReady(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast.error('Speech recognition failed');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return true;
  }, [options]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current && !initializeSpeechRecognition()) {
      return;
    }

    try {
      recognitionRef.current?.start();
      setTranscript('');
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('Failed to start listening');
    }
  }, [initializeSpeechRecognition]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  /**
   * Upload WAV blob to voice/upload endpoint
   */
  const uploadWav = useCallback(async (blob: Blob): Promise<string | null> => {
    if (!user) {
      toast.error('Authentication required');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.wav');

      const response = await fetch('/api/voice/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(user as any).access_token || ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data: UploadResponse = await response.json();
      return data.id;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload audio');
      return null;
    }
  }, [user]);

  /**
   * Poll transcription status
   */
  const pollTranscription = useCallback(async (id: string): Promise<string | null> => {
    const maxAttempts = 25; // 25 seconds max
    let attempts = 0;

    return new Promise((resolve) => {
      const poll = async () => {
        try {
          const response = await fetch(`/api/voice/transcribe?id=${id}`, {
            headers: {
              'Authorization': `Bearer ${(user as any)?.access_token || ''}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Poll failed: ${response.status}`);
          }

          const data: TranscribeResponse = await response.json();

          if (data.status === 'COMPLETED' && data.text) {
            setIsPolling(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            resolve(data.text);
            return;
          }

          if (data.status === 'ERROR' || data.status === 'TIMEOUT') {
            setIsPolling(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            toast.error(data.error || 'Transcription failed');
            resolve(null);
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            setIsPolling(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            toast.error('Transcription timeout');
            resolve(null);
            return;
          }
        } catch (error) {
          console.error('Poll error:', error);
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          toast.error('Failed to check transcription status');
          resolve(null);
        }
      };

      // Start polling every 1 second
      poll();
      pollingIntervalRef.current = setInterval(poll, 1000);
    });
  }, [user]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/wav',
      });

      const chunks: Blob[] = [];
      let totalSize = 0;
      const maxSize = 3 * 1024 * 1024; // 3MB limit

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          totalSize += event.data.size;
          
          // Stop if size limit reached
          if (totalSize >= maxSize) {
            mediaRecorder.stop();
          }
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        setIsRecording(false);
        setIsUploading(true);

        try {
          // Upload the WAV file
          const uploadId = await uploadWav(blob);
          
          if (uploadId) {
            setIsPolling(true);
            
            // Poll for transcription
            const transcriptText = await pollTranscription(uploadId);
            
            if (transcriptText) {
              setTranscript(transcriptText);
              if (options.onTranscriptReady) {
                options.onTranscriptReady(transcriptText);
              }
            }
          }
        } catch (error) {
          console.error('Recording processing error:', error);
          toast.error('Failed to process recording');
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Set 30-second timeout
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 30000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  }, [uploadWav, pollTranscription, options]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Clear timeout
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    }
  }, [isRecording]);

  const synthesizeAndPlay = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      await generateAudio();
      if (options.autoPlay && audioUrl) {
        playAudio();
      }
    } catch (error) {
      console.error('TTS failed:', error);
    }
  }, [generateAudio, playAudio, audioUrl, options.autoPlay]);

  const downloadTranscript = useCallback((text: string, filename = 'transcript.txt') => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
  }, []);

  // Cleanup effect
  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // Speech Recognition
    isListening,
    transcript,
    startListening,
    stopListening,
    
    // Audio Recording
    isRecording,
    isUploading,
    isPolling,
    startRecording,
    stopRecording,
    
    // Text-to-Speech
    synthesizeAndPlay,
    isPlaying,
    ttsLoading,
    audioUrl,
    playAudio,
    pauseAudio,
    
    // Utilities
    downloadTranscript,
    hasVoiceSupport: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    error: ttsError
  };
};