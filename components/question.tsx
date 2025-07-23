"use client";

import * as React from "react";
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { StudyAssistantChat } from "./study-assistant-chat";

export const practiceQuestionSchema = z.object({
  id: z.string(), // Changed to string for cuid
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

type QuestionData = z.infer<typeof practiceQuestionSchema>;

interface QuestionPracticeScreenProps {
  question: QuestionData;
  topicName?: string;
  subtopicName?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  allQuestions?: QuestionData[];
  stepSlug: string;
  topicSlug?: string;
  subtopicSlug?: string;
}

export function QuestionPracticeScreen({
  question,
  currentQuestionIndex = 0,
  totalQuestions = 1,
  allQuestions = [],
  stepSlug,
  topicSlug,
  subtopicSlug,
}: QuestionPracticeScreenProps) {
  const router = useRouter();
  const [selectedAnswer, setSelectedAnswer] = React.useState<string>("");
  const [showAnswer, setShowAnswer] = React.useState(false);
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);
  const [timeSpent, setTimeSpent] = React.useState(0);

  // Reset states when question changes
  React.useEffect(() => {
    setSelectedAnswer("");
    setShowAnswer(false);
    setIsCorrect(null);
    setTimeSpent(0);
  }, [question.id]);

  // Timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [question.id]); // Reset timer when question changes

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

  const navigateToQuestion = (questionIndex: number) => {
    if (questionIndex < 0 || questionIndex >= allQuestions.length) return;

    const targetQuestion = allQuestions[questionIndex];
    if (topicSlug && subtopicSlug) {
      router.push(
        `/dashboard/practice/${stepSlug}/${topicSlug}/${subtopicSlug}/question/${targetQuestion.id}`
      );
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const renderQuestionInput = () => {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with timer and navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Navigation Controls */}
          <div className="flex items-center gap-4">
            {totalQuestions > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  <IconChevronLeft className="size-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                >
                  Next
                  <IconChevronRight className="size-4 ml-1" />
                </Button>
              </>
            )}
          </div>

          {/* Center - Progress Info */}
          <div className="flex items-center gap-4">
            {totalQuestions > 1 && (
              <>
                <Badge variant="secondary" className="text-sm">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </Badge>

                {/* Progress bar */}
                <div className="w-32 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                    }}
                  ></div>
                </div>
              </>
            )}
          </div>

          {/* Right - Timer */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              Time: {formatTime(timeSpent)}
            </Badge>
            {question.timeLimit && (
              <Badge variant="secondary" className="text-sm">
                Limit: {formatTime(question.timeLimit)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Remove the separate navigation card section completely */}

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question */}
          <div className="lg:col-span-2">
            <Card>
              {/* <CardHeader>
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
              </CardHeader> */}
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
                      className={`p-4 rounded-lg ${
                        isCorrect
                          ? "bg-green-50 border-green-200 dark:bg-green-950"
                          : "bg-red-50 border-red-200 dark:bg-red-950"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <IconCheck className="size-5 text-green-600" />
                        ) : (
                          <IconX className="size-5 text-red-600" />
                        )}
                        <span
                          className={`font-semibold ${
                            isCorrect
                              ? "text-green-800 dark:text-green-200"
                              : "text-red-800 dark:text-red-200"
                          }`}
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Study Assistant Chat */}
          <div>
            <StudyAssistantChat
              question={question}
              userAnswer={selectedAnswer}
              showAnswer={showAnswer}
              isCorrect={isCorrect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
