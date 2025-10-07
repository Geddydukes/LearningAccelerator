import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare,
  Sparkles,
  BookOpen,
  Target,
  Brain,
  Lightbulb,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";

interface Message {
  id: string;
  type: "user" | "guru";
  content: string;
  timestamp: Date;
  metadata?: {
    agent?: string;
    phase?: string;
    artifacts?: any;
  };
}

interface EducationSession {
  id: string;
  week: number;
  day: number;
  phase:
    | "planning"
    | "lecture"
    | "check"
    | "practice_prep"
    | "practice"
    | "reflect"
    | "completed";
  artifacts: Record<string, any>;
}

export const GuruInterface: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<EducationSession | null>(
    null
  );
  const [currentPhase, setCurrentPhase] = useState<string>("planning");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth?redirect=/guru" replace />;
  }

  // Initialize with Guru's starter message
  useEffect(() => {
    if (messages.length === 0) {
      const starterMessage: Message = {
        id: "starter",
        type: "guru",
        content: "What can Guru help you learn?",
        timestamp: new Date(),
        metadata: { agent: "guru" },
      };
      setMessages([starterMessage]);
    }
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Determine if this is a new learning session or continuation
      const isNewSession = !currentSession || currentPhase === "planning";

      if (isNewSession) {
        // Start new learning session
        await startLearningSession(userMessage.content);
      } else {
        // Continue existing session
        await continueLearningSession(userMessage.content);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error(
        "Sorry, there was an error processing your request. Please try again."
      );

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: "guru",
        content:
          "I apologize, but I encountered an error. Could you please rephrase your request?",
        timestamp: new Date(),
        metadata: { agent: "guru" },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startLearningSession = async (userInput: string) => {
    try {
      // For now, simulate the education-agent response since it's not deployed
      // TODO: Replace with actual education-agent call when deployed
      const mockSessionData = {
        phase: "lecture",
        artifacts: {
          lecture: {
            summary: `Great! I'll help you learn about ${userInput}. Let me create a personalized learning experience for you.`,
            topic: userInput,
            objectives: [
              `Understand the fundamentals of ${userInput}`,
              `Apply ${userInput} concepts in practice`,
              `Build confidence with ${userInput}`,
            ],
          },
        },
      };

      setCurrentSession({
        id: "session-1",
        week: 1,
        day: 1,
        phase: mockSessionData.phase,
        artifacts: mockSessionData.artifacts,
      });
      setCurrentPhase(mockSessionData.phase);

      // Add Guru's response
      const guruMessage: Message = {
        id: `guru-${Date.now()}`,
        type: "guru",
        content: generateGuruResponse(mockSessionData),
        timestamp: new Date(),
        metadata: {
          agent: "guru",
          phase: mockSessionData.phase,
          artifacts: mockSessionData.artifacts,
        },
      };
      setMessages((prev) => [...prev, guruMessage]);
    } catch (error) {
      console.error("Error starting learning session:", error);
      throw error;
    }
  };

  const continueLearningSession = async (userInput: string) => {
    try {
      // Determine next event based on current phase
      let nextEvent = "lecture_done";
      if (currentPhase === "lecture") nextEvent = "lecture_done";
      else if (currentPhase === "check") nextEvent = "check_done";
      else if (currentPhase === "practice_prep") nextEvent = "practice_ready";
      else if (currentPhase === "practice") nextEvent = "practice_done";
      else if (currentPhase === "reflect") nextEvent = "reflect_done";

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/education-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            event: nextEvent,
            userId: user?.id,
            week: currentSession?.week || 1,
            day: currentSession?.day || 1,
            payload: {
              userResponse: userInput,
              currentPhase: currentPhase,
            },
          }),
        }
      );

      const result = await response.json();

      if (result.success && result.data) {
        const sessionData = result.data;

        // Update session state
        if (currentSession) {
          setCurrentSession({
            ...currentSession,
            phase: sessionData.phase || currentSession.phase,
            artifacts: {
              ...currentSession.artifacts,
              ...sessionData.artifacts,
            },
          });
        }
        setCurrentPhase(sessionData.phase || currentPhase);

        // Add Guru's response
        const guruMessage: Message = {
          id: `guru-${Date.now()}`,
          type: "guru",
          content: generateGuruResponse(sessionData),
          timestamp: new Date(),
          metadata: {
            agent: "guru",
            phase: sessionData.phase,
            artifacts: sessionData.artifacts,
          },
        };
        setMessages((prev) => [...prev, guruMessage]);
      } else {
        throw new Error(result.error || "Failed to continue learning session");
      }
    } catch (error) {
      console.error("Error continuing learning session:", error);
      throw error;
    }
  };

  const generateGuruResponse = (sessionData: any): string => {
    const phase = sessionData.phase || currentPhase;
    const artifacts = sessionData.artifacts || {};

    switch (phase) {
      case "lecture":
        if (artifacts.lecture) {
          return `Great! Let's start with today's lesson. ${
            artifacts.lecture.summary ||
            "I have prepared a comprehensive lesson for you."
          } Ready to begin?`;
        }
        return "I'm preparing your lesson. Let me gather the materials and create a personalized learning experience for you.";

      case "check":
        if (artifacts.comprehensionCheck) {
          return `Now let's check your understanding. ${
            artifacts.comprehensionCheck.question ||
            "I have some questions to help verify your comprehension."
          } How would you answer?`;
        }
        return "Let's verify your understanding with some comprehension questions.";

      case "practice_prep":
        if (artifacts.modifiedPrompts) {
          return "Perfect! Now I'm preparing your practice exercises. I've customized them based on your learning progress. Ready to start practicing?";
        }
        return "I'm preparing your practice exercises tailored to your learning needs.";

      case "practice":
        if (artifacts.practice) {
          return `Excellent! Here's your practice session. ${
            artifacts.practice.description ||
            "I have exercises ready for you to apply what you've learned."
          } Let's begin!`;
        }
        return "Time for hands-on practice! I have exercises ready to help you apply what you've learned.";

      case "reflect":
        if (artifacts.reflection) {
          return `Let's reflect on today's learning. ${
            artifacts.reflection.prompt ||
            "How do you feel about your progress today?"
          } What insights did you gain?`;
        }
        return "Let's reflect on your learning journey today. What did you discover?";

      case "completed":
        return "Congratulations! You've completed today's learning session. You've made excellent progress! Would you like to continue with the next topic or review what you've learned?";

      default:
        return "I'm here to help you learn! What would you like to explore today?";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case "lecture":
        return <BookOpen className="w-4 h-4" />;
      case "check":
        return <Target className="w-4 h-4" />;
      case "practice_prep":
        return <Lightbulb className="w-4 h-4" />;
      case "practice":
        return <Brain className="w-4 h-4" />;
      case "reflect":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "lecture":
        return "bg-blue-100 text-blue-800";
      case "check":
        return "bg-green-100 text-green-800";
      case "practice_prep":
        return "bg-yellow-100 text-yellow-800";
      case "practice":
        return "bg-purple-100 text-purple-800";
      case "reflect":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-background">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Guru</h1>
          </div>
          {currentPhase && (
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(
                currentPhase
              )}`}
            >
              {getPhaseIcon(currentPhase)}
              <span className="capitalize">
                {currentPhase.replace("_", " ")}
              </span>
            </div>
          )}
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
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start gap-3 max-w-[80%] ${
                    message.type === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {message.type === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <Card
                    className={`p-3 ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        message.type === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </Card>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <Card className="p-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Guru is thinking...
                    </span>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Guru anything about learning..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
