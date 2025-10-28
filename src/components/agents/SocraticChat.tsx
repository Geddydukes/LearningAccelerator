import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Volume2, VolumeX, Mic, MicOff, Download, FileText } from 'lucide-react';
import { useVoiceIntegration } from '../../hooks/useVoiceIntegration';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useSubscription } from '../../hooks/useSubscription';
import { FeatureGate } from '../dashboard/SubscriptionBadge';
import { useDatabase } from '../../hooks/useDatabase';
import { DatabaseService } from '../../lib/database';
import { AgentOrchestrator } from '../../lib/agents';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export const SocraticChat: React.FC = () => {
  const { user, currentWeek } = useDatabase();
  const { hasFeature, isPaid } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessageOperation = useAsyncOperation({
    showToast: false,
    onError: () => toast.error('Failed to send message')
  });

  const voice = useVoiceIntegration({
    autoPlay: true,
    voice: user?.voice_preference || 'alloy',
    onTranscriptReady: (transcript) => {
      setInputValue(transcript);
    }
  });

  // Initialize session
  useEffect(() => {
    if (user && !sessionId) {
      initializeSession();
    }
  }, [user]);

  const resolveWeekNumber = () => {
    if (currentWeek?.week_number) {
      return currentWeek.week_number;
    }
    const start = new Date('2024-01-01').getTime();
    return Math.max(1, Math.ceil((Date.now() - start) / (7 * 24 * 60 * 60 * 1000)));
  };

  const initializeSession = async () => {
    if (!user) return;

    try {
      const session = await DatabaseService.createSocraticSession(user.id);
      setSessionId(session.id);

      // Load existing messages
      const existingMessages = await DatabaseService.getSessionMessages(session.id);
      setMessages(existingMessages.map(msg => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'agent',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        audioUrl: msg.audio_url
      })));

      if (existingMessages.length === 0) {
        await primeInitialPrompt(session.id);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      toast.error('Failed to start conversation');
    }
  };
  const primeInitialPrompt = async (session: string) => {
    if (!user) return;

    try {
      const weekNumber = resolveWeekNumber();
      const response = await AgentOrchestrator.callSocraticAgent(
        user.id,
        'START_SESSION',
        weekNumber,
        {
          sessionId: session,
          topic: currentWeek?.clo_briefing_note?.module_title || 'Learning focus',
        },
      );

      if (response.success && response.data?.question) {
        const agentMessage: Message = {
          id: crypto.randomUUID(),
          type: 'agent',
          content: response.data.question,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, agentMessage]);

        if (voice.hasVoiceSupport) {
          await voice.synthesizeAndPlay(response.data.question);
        }
      }
    } catch (error) {
      console.error('Failed to load initial Socratic prompt:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || !sessionId || sendMessageOperation.loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    await sendMessageOperation.execute(async () => {
      const conversationHistory = [...messages, userMessage].map(m => `${m.type}: ${m.content}`);
      const weekNumber = resolveWeekNumber();
      const response = await AgentOrchestrator.callSocraticAgent(
        user.id,
        'CONTINUE_SESSION',
        weekNumber,
        {
          sessionId,
          message: userMessage.content,
          conversationHistory,
        }
      );

      if (response.success && response.data) {
        const agentMessage: Message = {
          id: Date.now().toString(),
          type: 'agent',
          content: response.data.question,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);
        
        // Auto-synthesize voice response if enabled
        if (voice.hasVoiceSupport) {
          await voice.synthesizeAndPlay(response.data.question);
        }
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  const handleDownloadTranscript = () => {
    const transcript = messages
      .map(m => `${m.type.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    voice.downloadTranscript(transcript, `socratic-session-${sessionId}.txt`);
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Socratic Dialogue
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Explore ideas through thoughtful questioning
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
            className={showTranscript ? 'text-blue-600' : 'text-gray-400'}
            title="Toggle transcript view"
          >
            <FileText className="w-4 h-4" />
          </Button>
          
          <FeatureGate 
            feature="voice_synthesis"
            fallback={
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-gray-300"
                title="Voice features require Pro subscription"
              >
                <MicOff className="w-4 h-4" />
              </Button>
            }
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceInput}
              className={voice.isListening ? 'text-red-600' : 'text-gray-400'}
              disabled={!voice.hasVoiceSupport}
              title={voice.hasVoiceSupport ? 'Voice input (Pro)' : 'Voice input not supported'}
            >
              {voice.isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
          </FeatureGate>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadTranscript}
            className="text-gray-400 hover:text-gray-600"
            title="Download transcript"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.audioUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => voice.playAudio()}
                      className="p-1 h-auto"
                      title="Play audio"
                    >
                      <Volume2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {sendMessageOperation.loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-blue-600 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Thinking of a question...
                </span>
              </div>
            </div>
          </motion.div>
        )}
        
        {voice.isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Listening...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts or ask a question..."
            className="flex-1"
            disabled={sendMessageOperation.loading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && !voice.transcript.trim()) || sendMessageOperation.loading}
            size="sm"
            loading={sendMessageOperation.loading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Voice controls */}
        {voice.hasVoiceSupport && hasFeature('voice_synthesis') && (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>
              {voice.isListening ? 'Listening...' : 'Click mic to speak'}
            </span>
            {voice.audioUrl && (
              <button
                onClick={voice.isPlaying ? voice.pauseAudio : voice.playAudio}
                className="flex items-center space-x-1 hover:text-blue-600"
              >
                {voice.isPlaying ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span>{voice.isPlaying ? 'Pause' : 'Play'} response</span>
              </button>
            )}
          </div>
        )}
        
        {/* Pro feature notice */}
        {!isPaid() && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
            💡 Upgrade to Pro for unlimited messages and voice features
          </div>
        )}
      </div>
    </div>
  );
};