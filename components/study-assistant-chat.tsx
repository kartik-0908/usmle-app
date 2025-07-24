"use client";

import * as React from "react";
import {
  IconBulb,
  IconSend,
  IconMicrophone,
  IconKeyboard,
} from "@tabler/icons-react";
import { useChat } from "@ai-sdk/react";
import { z } from "zod";
import Markdown from "react-markdown";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import RealtimeVoiceAgent from "./voice";

// Question schema for context
export const practiceQuestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["MCQ", "True/False", "Fill in the blank", "Short Answer"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  tags: z.array(z.string()),
  image: z.string().optional(),
  timeLimit: z.number().optional(),
});

interface StudyAssistantChatProps {
  question: z.infer<typeof practiceQuestionSchema>;
  userAnswer?: string;
  showAnswer?: boolean;
  isCorrect?: boolean | null;
  className?: string;
}

// Cookie utilities
const VOICE_MODE_COOKIE = "sg-voice-mode";

const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// Function to parse quick replies from message content
const parseQuickReplies = (
  content: string
): { content: string; quickReplies: string[] } => {
  const quickReplyRegex = /\[QUICK_REPLIES\](.*?)\[\/QUICK_REPLIES\]/s;
  const match = content.match(quickReplyRegex);

  if (match) {
    const quickRepliesText = match[1];
    const quickReplies = quickRepliesText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.substring(2).trim())
      .filter((reply) => reply.length > 0);

    const cleanContent = content.replace(quickReplyRegex, "").trim();
    return { content: cleanContent, quickReplies };
  }

  return { content, quickReplies: [] };
};

// Quick Reply Buttons Component
const QuickReplyButtons: React.FC<{
  quickReplies: string[];
  onQuickReply: (reply: string) => void;
  disabled?: boolean;
}> = ({ quickReplies, onQuickReply, disabled }) => {
  if (quickReplies.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {quickReplies.map((reply, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onQuickReply(reply)}
          disabled={disabled}
          className="text-xs h-8 px-3 bg-background hover:bg-muted border border-border/50 hover:border-border transition-colors"
        >
          {reply}
        </Button>
      ))}
    </div>
  );
};

export function StudyAssistantChat({
  question,
  userAnswer,
  showAnswer,
  isCorrect,
  className,
}: StudyAssistantChatProps) {
  // Initialize voice mode from cookie, default to true
  const [isVoiceMode, setIsVoiceMode] = React.useState(true);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Refs for auto-scroll functionality
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const aiMessageRefs = React.useRef<{
    [key: string]: HTMLDivElement | null;
  }>({});
  const lastAiMessageIdRef = React.useRef<string | null>(null);

  // Load voice mode preference from cookie on component mount
  React.useEffect(() => {
    const savedVoiceMode = getCookie(VOICE_MODE_COOKIE);
    if (savedVoiceMode !== null) {
      setIsVoiceMode(savedVoiceMode === "true");
    }
    setIsInitialized(true);
  }, []);

  // Save voice mode preference to cookie whenever it changes
  React.useEffect(() => {
    if (isInitialized) {
      setCookie(VOICE_MODE_COOKIE, isVoiceMode.toString());
    }
  }, [isVoiceMode, isInitialized]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
  } = useChat({
    api: "/api/study-assistant",
    initialMessages: [
      {
        id: "initial",
        role: "assistant",
        content: `Hi! How may I help you with this question?

[QUICK_REPLIES]
- Explain this question
- Give me a hint
- What concepts should I know?
- Break down the approach
[/QUICK_REPLIES]`,
      },
    ],
    body: {
      questionContext: {
        id: question.id,
        type: question.type,
        difficulty: question.difficulty,
        question: question.question,
        options: question.options,
        tags: question.tags,
        explanation: question.explanation,
        userAnswer,
        showAnswer,
        isCorrect,
      },
    },
  });

  const scrollToAiMessage = React.useCallback((messageId: string) => {
    const messageElement = aiMessageRefs.current[messageId];
    if (messageElement) {
      // Get the scroll container
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (!scrollContainer) return;

      // Get positions
      const containerRect = scrollContainer.getBoundingClientRect();
      const messageRect = messageElement.getBoundingClientRect();

      // Calculate scroll position to show the AI message with some padding from top
      const scrollTop =
        scrollContainer.scrollTop + messageRect.top - containerRect.top - 20;

      scrollContainer.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  }, []);
  // Auto-scroll to new AI messages
  React.useEffect(() => {
    // Find the latest AI message
    const aiMessages = messages.filter((msg) => msg.role === "assistant");
    if (aiMessages.length === 0) return;

    const latestAiMessage = aiMessages[aiMessages.length - 1];

    // Check if this is a new AI message (not just an update)
    if (latestAiMessage.id !== lastAiMessageIdRef.current) {
      lastAiMessageIdRef.current = latestAiMessage.id;

      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToAiMessage(latestAiMessage.id);
      }, 100);
    }
  }, [messages, scrollToAiMessage]);

  // // Auto-scroll when component mounts and is initialized
  // React.useEffect(() => {
  //   if (isInitialized && !isVoiceMode) {
  //     const userMessages = messages.filter((msg) => msg.role === "user");
  //     if (userMessages.length > 0) {
  //       scrollToLastUserMessage();
  //     }
  //   }
  // }, [isInitialized, isVoiceMode, scrollToLastUserMessage]);

  const handleVoiceModeToggle = (checked: boolean) => {
    setIsVoiceMode(checked);
  };

  // Handle quick reply button clicks
  const handleQuickReply = (reply: string) => {
    append({
      role: "user",
      content: reply,
    });
  };

  // Don't render until we've loaded the cookie preference
  if (!isInitialized) {
    return (
      <Card className={`h-[600px] flex flex-col ${className}`}>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-[600px] flex flex-col ${className}`}>
      {/* Header with Mode Toggle */}
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Mode Toggle */}
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="voice-toggle"
              className="text-sm font-medium flex items-center gap-1"
            >
              <IconKeyboard className="size-4" />
              Text
            </Label>
            <Switch
              id="voice-toggle"
              checked={isVoiceMode}
              onCheckedChange={handleVoiceModeToggle}
            />
            <Label
              htmlFor="voice-toggle"
              className="text-sm font-medium flex items-center gap-1"
            >
              <IconMicrophone className="size-4" />
              Voice
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Chat Messages */}
        {isVoiceMode ? (
          // Voice Mode - Show RealtimeVoiceAgent
          <div className="flex-1 flex flex-col">
            <RealtimeVoiceAgent
              question={question.question || ""}
              options={question.options || []}
              explanation={question.explanation || ""}
            />
          </div>
        ) : (
          // Text Mode - Show Chat Interface
          <>
            <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
              <div className="p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <IconBulb className="size-8 mx-auto mb-2 text-blue-400" />
                      <p>Hi! I'm your AI study assistant.</p>
                      <p className="text-sm mt-1">
                        Ask me anything about this question!
                      </p>
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs">
                        <p className="font-medium mb-1">
                          Current mode: {isVoiceMode ? "Voice" : "Text"}
                        </p>
                        <p>
                          Switch between text and voice input using the toggle
                          above
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const { content, quickReplies } =
                        message.role === "assistant"
                          ? parseQuickReplies(message.content)
                          : { content: message.content, quickReplies: [] };

                      return (
                        <div
                          key={message.id}
                          ref={
                            message.role === "assistant"
                              ? (el) => {
                                  aiMessageRefs.current[message.id] = el;
                                }
                              : undefined
                          }
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-3 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap">
                              <Markdown>{content}</Markdown>
                            </div>

                            {/* Quick Reply Buttons for AI messages */}
                            {message.role === "assistant" && (
                              <QuickReplyButtons
                                quickReplies={quickReplies}
                                onQuickReply={handleQuickReply}
                                disabled={isLoading}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-muted-foreground rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex justify-center">
                      <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                        Sorry, I encountered an error. Please try again.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Text Chat Input */}
            <div className="flex-shrink-0 p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask me about this question..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="sm"
                >
                  <IconSend className="size-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
