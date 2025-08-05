import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Send, Volume2, Mic, MicOff } from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useVoiceIntegration } from '../../hooks/useVoiceIntegration';
import { AgentOrchestrator } from '../../lib/agents';
import { DatabaseService } from '../../lib/database';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ChatBubble, MessageList, TypingIndicator } from '../chat/ChatBubble';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  audioUrl?: string;
  hasTranscript?: boolean;
}

export const SocraticWorkflow: React.FC = () => {
  const { user, currentWeek } = useDatabase();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const socraticOperation = useAsyncOperation({
    showToast: false,
    onError: () => toast.error('Failed to send message')
  });

  const voice = useVoiceIntegration({
    autoPlay: false,
    voice: user?.voice_preference || 'alloy',
    onTranscriptReady: (transcript) => {
      setInputValue(transcript);
    }
  });

  // Initialize session when component mounts
  useEffect(() => {
    if (user && !sessionId) {
      initializeSession();
    }
  }, [user]);

  const initializeSession = async () => {
    if (!user) return;
    
    try {
      const session = await DatabaseService.createSocraticSession(
        user.id, 
        currentWeek?.id, 
        'Weekly Learning Discussion'
      );
      setSessionId(session.id);
      
      // Start with a topic based on CLO data
      if (currentWeek?.clo_briefing_note?.module_title) {
        const topic = currentWeek.clo_briefing_note.weekly_theme || currentWeek.clo_briefing_note.module_title;
        console.log('Starting Socratic session with topic:', topic);
        await startSocraticDialogue(session.id, topic);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      toast.error('Failed to start conversation');
    }
  };

  const startSocraticDialogue = async (sessionId: string, topic: string) => {
    if (!user) return;

    await socraticOperation.execute(async () => {
      const result = await AgentOrchestrator.callSocraticAgent(
        user.id,
        sessionId,
        `TOPIC: ${topic}`,
        [],
        currentWeek?.clo_briefing_note
      );

      if (result.success && result.data?.question) {
        const agentMessage: Message = {
          id: Date.now().toString(),
          content: result.data.question,
          sender: 'agent',
          timestamp: new Date()
        };
        setMessages([agentMessage]);
        setHasStarted(true);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to start dialogue');
      }
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || !sessionId || socraticOperation.loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    await socraticOperation.execute(async () => {
      const conversationHistory = messages.map(m => `${m.sender}: ${m.content}`);
      const response = await AgentOrchestrator.callSocraticAgent(
        user.id,
        sessionId,
        inputValue,
        conversationHistory,
        currentWeek?.clo_briefing_note
      );

      if (response.success && response.data) {
        if (response.data.question) {
          // Regular question response
          const agentMessage: Message = {
            id: Date.now().toString(),
            content: response.data.question,
            sender: 'agent',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, agentMessage]);
          
          // Auto-synthesize voice response if enabled
          if (voice.hasVoiceSupport) {
            await voice.synthesizeAndPlay(response.data.question);
          }
        } else if (response.data.topic) {
          // Session ended
          toast.success('Socratic session completed!');
          setTimeout(() => {
            navigate('/');
          }, 2000);
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

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Socratic Inquisitor
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Explore ideas through thoughtful questioning
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleBackToDashboard}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </motion.div>

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {currentWeek?.clo_briefing_note?.module_title || 'Learning Discussion'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {hasStarted ? 'Dialogue in progress' : 'Preparing to start...'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {voice.hasVoiceSupport && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceInput}
                    className={voice.isListening ? 'text-red-600' : 'text-gray-400'}
                    title="Voice input"
                  >
                    {voice.isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                )}
                {voice.audioUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={voice.isPlaying ? voice.pauseAudio : voice.playAudio}
                    className="text-gray-400"
                    title="Play/pause audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {!hasStarted && !socraticOperation.loading && (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Initializing Socratic dialogue based on your learning module...
                </p>
              </div>
            )}

            <MessageList
              messages={messages}
              onPlayAudio={voice.playAudio}
              isTyping={socraticOperation.loading}
            />
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
                disabled={socraticOperation.loading || !hasStarted}
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && !voice.transcript.trim()) || socraticOperation.loading || !hasStarted}
                size="sm"
                loading={socraticOperation.loading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Voice status */}
            {voice.isListening && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
                🎤 Listening... (speak now)
              </div>
            )}
            
            {voice.transcript && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Voice input: {voice.transcript}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};