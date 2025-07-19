"use client";

import * as React from "react";
import { IconBulb, IconSend } from "@tabler/icons-react";
import { useChat } from "ai/react";
import { z } from "zod";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

// Question schema for context
export const practiceQuestionSchema = z.object({
  id: z.number(),
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

export function StudyAssistantChat({
  question,
  userAnswer,
  showAnswer,
  isCorrect,
  className,
}: StudyAssistantChatProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: "/api/study-assistant",
    initialMessages: [
      {
        id: "initial",
        role: "assistant",
        content: `Hi! I'm your AI study assistant. I'm here to help you understand this ${question.type} question about ${question.tags.join(", ")}. Feel free to ask me anything!`,
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

  return (
    <Card className={`h-[600px] flex flex-col ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <IconBulb className="size-5 text-blue-600" />
          AI Study Assistant
        </CardTitle>
        <CardDescription>
          Ask me anything about this question or topic
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full flex flex-col">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <IconBulb className="size-8 mx-auto mb-2 text-blue-400" />
                  <p>Hi! I'm your AI study assistant.</p>
                  <p className="text-sm mt-1">
                    Ask me anything about this question!
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))
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
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t">
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
        </div>
      </CardContent>
    </Card>
  );
}