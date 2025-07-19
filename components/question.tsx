"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconCheck,
  IconX,
  IconRefresh,
  IconHome,
  IconList,
  IconTarget,
  IconBulb,
  IconArrowLeft,
} from "@tabler/icons-react";
import { z } from "zod";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

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
  timeLimit: z.number().optional(), // in seconds
});

function createSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function QuestionPracticeScreen({
  question,
}: {
  question: z.infer<typeof practiceQuestionSchema>;
}) {
  const [selectedAnswer, setSelectedAnswer] = React.useState<string>("");
  const [showAnswer, setShowAnswer] = React.useState(false);
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);
  const [timeSpent, setTimeSpent] = React.useState(0);
  const [chatMessages, setChatMessages] = React.useState<
    Array<{ id: string; content: string; isUser: boolean }>
  >([]);
  const [chatInput, setChatInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Chat functionality
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: chatInput,
      isUser: true,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content:
          "I can help you understand this question better. What specific part would you like me to explain?",
        isUser: false,
      };
      setChatMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };


 

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowAnswer(true);
  };

  const handleReset = () => {
    setSelectedAnswer("");
    setShowAnswer(false);
    setIsCorrect(null);
    setTimeSpent(0);
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case "MCQ":
        return (
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "True/False":
        return (
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="True" id="true" />
              <Label htmlFor="true" className="cursor-pointer">
                True
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="False" id="false" />
              <Label htmlFor="false" className="cursor-pointer">
                False
              </Label>
            </div>
          </RadioGroup>
        );

      case "Fill in the blank":
        return (
          <Input
            placeholder="Enter your answer..."
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            className="max-w-md"
          />
        );

      case "Short Answer":
        return (
          <Textarea
            placeholder="Enter your answer..."
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            className="max-w-2xl"
            rows={4}
          />
        );

      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-600 bg-green-50 dark:bg-green-950";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
      case "Hard":
        return "text-red-600 bg-red-50 dark:bg-red-950";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{question.type}</Badge>
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {question.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {/* <CardTitle className="text-xl">{question.title}</CardTitle> */}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Image */}
                {question.image && (
                  <div className="flex justify-center">
                    <img
                      src={question.image}
                      alt="Question illustration"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}

                {/* Question Text */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-lg leading-relaxed">{question.question}</p>
                </div>

                {/* Answer Input */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">
                    Your Answer:
                  </Label>
                  {renderQuestionInput()}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                  {!showAnswer ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!selectedAnswer}
                      className="px-8"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="px-8"
                    >
                      <IconRefresh className="size-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                </div>

                {/* Answer Feedback */}
                {showAnswer && (
                  <div className="space-y-4">
                    <Separator />
                    <div
                      className={`p-4 rounded-lg ${isCorrect ? "bg-green-50 border-green-200 dark:bg-green-950" : "bg-red-50 border-red-200 dark:bg-red-950"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <IconCheck className="size-5 text-green-600" />
                        ) : (
                          <IconX className="size-5 text-red-600" />
                        )}
                        <span
                          className={`font-semibold ${isCorrect ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}
                        >
                          {isCorrect ? "Correct!" : "Incorrect"}
                        </span>
                      </div>
                      {!isCorrect && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Correct answer:{" "}
                          <span className="font-semibold">
                            {question.correctAnswer}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Explanation */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950">
                      <div className="flex items-center gap-2 mb-2">
                        <IconBulb className="size-5 text-blue-600" />
                        <span className="font-semibold text-blue-800 dark:text-blue-200">
                          Explanation
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Copilot Chat */}
          <div className="space-y-6">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconBulb className="size-5 text-blue-600" />
                  AI Study Assistant
                </CardTitle>
                <CardDescription>
                  Ask me anything about this question or topic
                </CardDescription>
              </CardHeader>

              {/* Chat Messages */}
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <IconBulb className="size-8 mx-auto mb-2 text-blue-400" />
                        <p>Hi! I'm your AI study assistant.</p>
                        <p className="text-sm mt-1">
                          Ask me anything about this question!
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.isUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
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
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me about this question..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isLoading}
                      size="sm"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
