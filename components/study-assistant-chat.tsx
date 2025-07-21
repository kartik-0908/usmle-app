"use client";

import * as React from "react";
import { IconBulb, IconSend, IconMicrophone, IconKeyboard } from "@tabler/icons-react";
import { useChat } from "@ai-sdk/react";
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
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import RealtimeVoiceAgent from "@/app/dashboard/openai/page";

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
  const [isVoiceMode, setIsVoiceMode] = React.useState(true);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append } =
    useChat({
      api: "/api/study-assistant",
      initialMessages: [
        {
          id: "initial",
          role: "assistant",
          content: `Hi! How may i help you`,
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
      {/* Header with Mode Toggle */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardDescription>
              Ask me anything about this {question.type.toLowerCase()} question
            </CardDescription>
          </div>
          
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
              onCheckedChange={setIsVoiceMode}
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

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full flex flex-col">
          {/* Chat Messages */}
         {!isVoiceMode &&  <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <IconBulb className="size-8 mx-auto mb-2 text-blue-400" />
                  <p>Hi! I'm your AI study assistant.</p>
                  <p className="text-sm mt-1">
                    Ask me anything about this question!
                  </p>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs">
                    <p className="font-medium mb-1">Current mode: {isVoiceMode ? 'Voice' : 'Text'}</p>
                    <p>Switch between text and voice input using the toggle above</p>
                  </div>
                </div>
              ) : (
                !isVoiceMode && messages.map((message) => (
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
          </ScrollArea>}

          {/* Conditional Input Area */}
          {isVoiceMode ? (
           <RealtimeVoiceAgent/>
          ) : (
            /* Text Chat Input */
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}