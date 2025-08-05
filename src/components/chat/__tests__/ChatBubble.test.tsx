import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatBubble, MessageList, TypingIndicator } from '../ChatBubble';

const mockMessage = {
  id: '1',
  content: 'Hello, this is a test message',
  sender: 'user' as const,
  timestamp: new Date('2024-01-01T12:00:00Z'),
  audioUrl: 'https://example.com/audio.mp3',
  hasTranscript: true
};

describe('ChatBubble Component', () => {
  const mockOnPlayAudio = jest.fn();
  const mockOnShowTranscript = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user message correctly', () => {
    render(
      <ChatBubble 
        message={mockMessage}
        onPlayAudio={mockOnPlayAudio}
        onShowTranscript={mockOnShowTranscript}
      />
    );

    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('12:00 PM')).toBeInTheDocument();
  });

  it('renders agent message with different styling', () => {
    const agentMessage = { ...mockMessage, sender: 'agent' as const };
    render(
      <ChatBubble 
        message={agentMessage}
        onPlayAudio={mockOnPlayAudio}
        onShowTranscript={mockOnShowTranscript}
      />
    );

    expect(screen.getByText('Socratic')).toBeInTheDocument();
    const bubble = screen.getByText('Hello, this is a test message').closest('div');
    expect(bubble).toHaveClass('bg-white');
  });

  it('shows audio controls when audio URL provided', () => {
    render(
      <ChatBubble 
        message={mockMessage}
        onPlayAudio={mockOnPlayAudio}
        onShowTranscript={mockOnShowTranscript}
      />
    );

    const playButton = screen.getByLabelText('Play audio message');
    expect(playButton).toBeInTheDocument();
    
    fireEvent.click(playButton);
    expect(mockOnPlayAudio).toHaveBeenCalledWith('https://example.com/audio.mp3');
  });

  it('shows transcript button when transcript available', () => {
    render(
      <ChatBubble 
        message={mockMessage}
        onPlayAudio={mockOnPlayAudio}
        onShowTranscript={mockOnShowTranscript}
      />
    );

    const transcriptButton = screen.getByLabelText('Show transcript');
    expect(transcriptButton).toBeInTheDocument();
    
    fireEvent.click(transcriptButton);
    expect(mockOnShowTranscript).toHaveBeenCalledWith('1');
  });

  it('renders in compact variant', () => {
    render(
      <ChatBubble 
        message={mockMessage}
        variant="compact"
        onPlayAudio={mockOnPlayAudio}
        onShowTranscript={mockOnShowTranscript}
      />
    );

    // In compact mode, no avatar/sender info should be shown
    expect(screen.queryByText('You')).not.toBeInTheDocument();
  });
});

describe('TypingIndicator Component', () => {
  it('renders typing animation', () => {
    render(<TypingIndicator />);
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });
});

describe('MessageList Component', () => {
  const messages = [
    mockMessage,
    { ...mockMessage, id: '2', sender: 'agent' as const, content: 'Agent response' }
  ];

  it('renders all messages', () => {
    render(
      <MessageList 
        messages={messages}
        onPlayAudio={jest.fn()}
        onShowTranscript={jest.fn()}
      />
    );

    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    expect(screen.getByText('Agent response')).toBeInTheDocument();
  });

  it('shows typing indicator when enabled', () => {
    render(
      <MessageList 
        messages={messages}
        isTyping={true}
        onPlayAudio={jest.fn()}
        onShowTranscript={jest.fn()}
      />
    );

    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });
});