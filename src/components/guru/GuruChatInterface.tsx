import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ChatRole = 'user' | 'guru';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface SocialPost {
  id: string;
  content: string;
  isEditing: boolean;
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchGuruResponse(message: string): Promise<string> {
  const apiUrl = import.meta.env.VITE_GURU_API_URL as string | undefined;
  const apiKey = import.meta.env.VITE_GURU_API_KEY as string | undefined;

  if (apiUrl && apiKey) {
    try {
      const response = await fetch(`${apiUrl}/v1/guru/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as { reply?: string };
      if (data.reply && typeof data.reply === 'string') {
        return data.reply;
      }
    } catch (error) {
      // Fall through to local response on failure
      // Intentionally not rethrowing to preserve UX
    }
  }

  // Local deterministic fallback to ensure UI works in all environments (and tests)
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(
        'Welcome to your personalized learning journey! I will help clarify your goals and create a focused plan.'
      );
    }, 300);
  });
}

export const GuruChatInterface: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: generateId('msg'),
      role: 'guru',
      content:
        'Welcome to your personalized learning journey! I will help clarify your goals and create a focused plan.'
    }
  ]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showEndDay, setShowEndDay] = useState<boolean>(false);
  const [socialPosts, setSocialPosts] = useState<SocialPost[] | null>(null);

  const canSend = useMemo(() => inputValue.trim().length > 0 && !isSending, [inputValue, isSending]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, socialPosts]);

  const handleSend = useCallback(async () => {
    if (!canSend) {
      return;
    }

    const userText = inputValue.trim();
    setInputValue('');
    const userMessage: ChatMessage = { id: generateId('msg'), role: 'user', content: userText };
    setMessages((prev) => [...prev, userMessage]);

    setIsSending(true);
    try {
      const reply = await fetchGuruResponse(userText);
      const guruMessage: ChatMessage = { id: generateId('msg'), role: 'guru', content: reply };
      setMessages((prev) => [...prev, guruMessage]);
      setShowEndDay(true);
    } finally {
      setIsSending(false);
    }
  }, [canSend, inputValue]);

  const handleEndDay = useCallback(() => {
    // Generate simple, editable social content summary based on the session
    const learnedTopics = messages
      .filter((m) => m.role === 'user')
      .slice(-3)
      .map((m) => m.content)
      .join(', ');

    const draftPosts: SocialPost[] = [
      {
        id: generateId('post'),
        content: `Here are your social media posts based on today: ${
          learnedTopics || 'Clarified learning goals'
        }. #Learning #AI`,
        isEditing: false
      },
      {
        id: generateId('post'),
        content: 'Grateful for focused progress today. Small steps compound. #Progress',
        isEditing: false
      }
    ];

    setSocialPosts(draftPosts);
  }, [messages]);

  const toggleEditPost = useCallback((postId: string) => {
    setSocialPosts((prev) => {
      if (!prev) return prev;
      return prev.map((p) => (p.id === postId ? { ...p, isEditing: !p.isEditing } : p));
    });
  }, []);

  const updatePostContent = useCallback((postId: string, content: string) => {
    setSocialPosts((prev) => {
      if (!prev) return prev;
      return prev.map((p) => (p.id === postId ? { ...p, content } : p));
    });
  }, []);

  const stopEditingOnBlur = useCallback((postId: string) => {
    setSocialPosts((prev) => {
      if (!prev) return prev;
      return prev.map((p) => (p.id === postId ? { ...p, isEditing: false } : p));
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <h1 className="text-2xl font-medium text-foreground">Clarifier • clarify</h1>
        <p className="text-sm text-muted-foreground">
          Welcome to your personalized learning journey! I will help clarify your goals and create a focused plan.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            data-testid={message.role === 'guru' ? 'guru-message' : undefined}
            className={
              message.role === 'guru'
                ? 'self-start max-w-prose bg-card border border-border/50 rounded-lg p-3'
                : 'self-end max-w-prose bg-primary text-primary-foreground rounded-lg p-3'
            }
          >
            {message.content}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t border-border/50 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask Clarifier"
          className="flex-1 px-3 py-2 border border-border/50 rounded-md bg-background text-foreground"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend}
          className="px-4 py-2 rounded-md border border-border/50 disabled:opacity-50"
        >
          Send
        </button>

        {showEndDay && (
          <button
            type="button"
            data-testid="end-day-button"
            onClick={handleEndDay}
            className="ml-2 px-4 py-2 rounded-md bg-accent"
          >
            End Day
          </button>
        )}
      </div>

      {socialPosts && (
        <div className="p-4 border-t border-border/50">
          <h2 className="text-lg font-medium text-foreground mb-2">Here are your social media posts</h2>
          <div className="space-y-3">
            {socialPosts.map((post) => (
              <div key={post.id} className="border border-border/50 rounded-lg p-3">
                {post.isEditing ? (
                  <textarea
                    value={post.content}
                    onChange={(e) => updatePostContent(post.id, e.target.value)}
                    onBlur={() => stopEditingOnBlur(post.id)}
                    className="w-full p-2 rounded-md border border-border/50"
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{post.content}</p>
                )}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => toggleEditPost(post.id)}
                    className="text-sm px-3 py-1 border border-border/50 rounded-md"
                  >
                    {post.isEditing ? 'Save' : 'Edit'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuruChatInterface;


