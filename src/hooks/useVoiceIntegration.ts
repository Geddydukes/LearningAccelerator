import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocraticTTS } from './useSocraticTTS';
import toast from 'react-hot-toast';

interface VoiceIntegrationOptions {
  autoPlay?: boolean;
  voice?: string;
  onTranscriptReady?: (transcript: string) => void;
}

export const useVoiceIntegration = (options: VoiceIntegrationOptions = {}) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any | null>(null);

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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        
        try {
          // Process recorded audio
          const transcript = await processRecordedAudio(blob);
          setTranscript(transcript);
          
          if (options.onTranscriptReady) {
            options.onTranscriptReady(transcript);
          }
          
          console.log('Recording processed:', transcript);
        } catch (error) {
          console.error('Failed to process audio:', error);
          toast.error('Failed to process audio recording');
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
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

  const processRecordedAudio = async (audioBlob: Blob): Promise<string> => {
    try {
      // Convert blob to base64
      const base64Audio = await blobToBase64(audioBlob);
      
      // Call voice transcription endpoint
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          audio: base64Audio,
          userId: user?.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return result.transcript;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      throw error;
    }
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const downloadTranscript = useCallback((text: string, filename = 'transcript.txt') => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    // Speech Recognition
    isListening,
    transcript,
    startListening,
    stopListening,
    
    // Audio Recording
    isRecording,
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
};// Global speech recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

