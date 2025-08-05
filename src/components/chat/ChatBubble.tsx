import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, FileText, Clock, User, Bot } from 'lucide-react';
import { Button } from '../ui/Button';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  audioUrl?: string;
  hasTranscript?: boolean;
}

interface ChatBubbleProps {
  message: Message;
  onPlayAudio?: (url: string) => void;
  onShowTranscript?: (id: string) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onPlayAudio,
  onShowTranscript,
  variant = 'default',
  className = ''
}) => {
  const isUser = message.sender === 'user';
  const isCompact = variant === 'compact';

  const bubbleClasses = isUser
    ? 'bg-primary-600 text-white ml-auto'
    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 mr-auto';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
    >
      <div className={`max-w-[80%] ${isCompact ? 'max-w-[90%]' : ''}`}>
        {/* Avatar and sender info */}
        {!isCompact && (
          <div className={`flex items-center mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-center space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isUser 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'bg-emerald-100 text-emerald-600'
              }`}>
                {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {isUser ? 'You' : 'Socratic'}
              </span>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`
            relative px-4 py-3 rounded-2xl shadow-sm
            ${bubbleClasses}
            ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}
          `}
        >
          {/* Message content */}
          <p className={`text-sm leading-relaxed ${isCompact ? 'text-xs' : ''}`}>
            {message.content}
          </p>

          {/* Audio and transcript controls */}
          {(message.audioUrl || message.hasTranscript) && (
            <div className={`flex items-center space-x-2 mt-3 pt-2 border-t ${
              isUser 
                ? 'border-primary-500/30' 
                : 'border-gray-200 dark:border-gray-600'
            }`}>
              {message.audioUrl && onPlayAudio && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPlayAudio(message.audioUrl!)}
                  className={`p-1 h-auto ${
                    isUser 
                      ? 'text-primary-100 hover:text-white hover:bg-primary-500' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  aria-label="Play audio message"
                >
                  <Volume2 className="w-3 h-3" />
                </Button>
              )}

              {message.hasTranscript && onShowTranscript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShowTranscript(message.id)}
                  className={`p-1 h-auto ${
                    isUser 
                      ? 'text-primary-100 hover:text-white hover:bg-primary-500' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  aria-label="Show transcript"
                >
                  <FileText className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`flex items-center mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Typing indicator component
interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex justify-start ${className}`}
    >
      <div className="max-w-[80%]">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Bot className="w-3 h-3" />
            </div>
            <div className="flex space-x-1">
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Thinking...
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Message list container
interface MessageListProps {
  messages: Message[];
  onPlayAudio?: (url: string) => void;
  onShowTranscript?: (id: string) => void;
  isTyping?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onPlayAudio,
  onShowTranscript,
  isTyping = false,
  variant = 'default',
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {messages.map((message) => (
        <ChatBubble
          key={message.id}
          message={message}
          onPlayAudio={onPlayAudio}
          onShowTranscript={onShowTranscript}
          variant={variant}
        />
      ))}
      {isTyping && <TypingIndicator />}
    </div>
  );
};