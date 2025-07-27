"use client";

import * as React from "react";
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconGripVertical,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
} from "@tabler/icons-react";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { StudyAssistantChat } from "./study-assistant-chat";

export const practiceQuestionSchema = z.object({
  id: z.string(), // Changed to string for cuid
  title: z.string(),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  tags: z.array(z.string()),
  image: z.string().optional(),
});

type QuestionData = z.infer<typeof practiceQuestionSchema>;

interface QuestionPracticeScreenProps {
  question: QuestionData;
  userId: string; // Add userId prop
  currentQuestionIndex?: number;
  totalQuestions?: number;
  allQuestions?: QuestionData[];
  stepSlug: string;
  topicSlug?: string;
  subtopicSlug?: string;
}

export function QuestionPracticeScreen({
  question,
  userId, // Add userId to destructured props
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
  const [isSubmitting, setIsSubmitting] = React.useState(false); // Add loading state
  
  // Layout state - Start with default to avoid hydration mismatch
  const [questionWidth, setQuestionWidth] = React.useState(66.67); // Default to 2/3 (66.67%)
  const [isResizing, setIsResizing] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Load saved layout preference after component mounts (client-side only)
  React.useEffect(() => {
    setIsMounted(true);
    try {
      const savedWidth = localStorage.getItem('questionPracticeWidth');
      if (savedWidth) {
        setQuestionWidth(parseFloat(savedWidth));
      }
    } catch (error) {
      console.log('Could not load layout preference');
    }
  }, []);

  // Save layout preference whenever it changes (only after mount)
  React.useEffect(() => {
    if (!isMounted) return; // Don't save during initial hydration
    
    try {
      localStorage.setItem('questionPracticeWidth', questionWidth.toString());
    } catch (error) {
      console.log('Could not save layout preference');
    }
  }, [questionWidth, isMounted]);

  // Reset states when question changes
  React.useEffect(() => {
    setSelectedAnswer("");
    setShowAnswer(false);
    setIsCorrect(null);
    setTimeSpent(0);
    setIsSubmitting(false);
  }, [question.id]);

  // Timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [question.id]); // Reset timer when question changes

  // Handle mouse resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width - 4; // Account for gap (4px = gap-1)
    const mouseX = e.clientX - containerRect.left;
    
    // Calculate percentage more accurately
    let newWidth = (mouseX / containerWidth) * 100;
    
    // Apply bounds
    newWidth = Math.max(25, Math.min(85, newWidth));
    
    setQuestionWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Preset width functions
  const setPresetWidth = (width: number) => {
    setQuestionWidth(width);
  };

  // Function to save user attempt to database
  const saveUserAttempt = async (selectedAnswer: string, isCorrect: boolean, timeSpent: number) => {
    try {
      const response = await fetch('/api/user-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          questionId: question.id,
          selectedOptions: [selectedAnswer], // Convert single answer to array format
          isCorrect,
          timeSpent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save attempt');
      }

      const result = await response.json();
      console.log('Attempt saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving attempt:', error);
      // You might want to show a toast notification here
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const correct = selectedAnswer === question.correctAnswer;
      setIsCorrect(correct);
      setShowAnswer(true);

      // Save the attempt to database
      await saveUserAttempt(selectedAnswer, correct, timeSpent);
      
    } catch (error) {
      console.error('Failed to save attempt:', error);
      // Still show the answer even if saving failed
      // You might want to show an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedAnswer("");
    setShowAnswer(false);
    setIsCorrect(null);
    setTimeSpent(0);
    setIsSubmitting(false);
  };

  const navigateToQuestion = (questionIndex: number) => {
    if (questionIndex < 0 || questionIndex >= allQuestions.length) return;

    const targetQuestion = allQuestions[questionIndex];
    if (topicSlug && subtopicSlug) {
      router.prefetch(
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
    const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F','G','H','I','J','K','L','M','N','O']; 
    
    return (
      <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
        {question.options?.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`option-${index}`} disabled={showAnswer} />
            <Label
              htmlFor={`option-${index}`}
              className={`flex-1 cursor-pointer ${showAnswer ? 'cursor-default' : ''}`}
            >
              <span className="font-semibold mr-2">
                {optionLabels[index]}
              </span>
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
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
             
                <Button asChild
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

          {/* Right - Timer and Layout Controls */}
          <div className="flex items-center gap-4">
            
            {/* Layout preset buttons */}
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPresetWidth(50)}
                title="Split equally"
              >
                <IconLayoutSidebarLeftCollapse className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPresetWidth(66.67)}
                title="More space for question"
              >
                <IconLayoutSidebarRightCollapse className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Resizable Layout */}
      <div className="container mx-auto px-4 pb-8">
        <div 
          ref={containerRef}
          className="flex gap-1 min-h-[600px]"
        >
          {/* Question Section */}
          <div 
            style={{ width: `${questionWidth}%` }}
            className={`min-w-0 ${isMounted && !isResizing ? 'transition-all duration-200' : ''}`}
          >
            <Card>
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
                  <p className="text-sm leading-relaxed">{question.question}</p>
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
                      disabled={!selectedAnswer || isSubmitting}
                      className="px-8"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Answer'}
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

          {/* Resizable Divider */}
          <div
            className={`w-1 cursor-col-resize flex items-center justify-center group relative hover:bg-border transition-colors ${
              isResizing ? 'bg-border' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            {/* Expanded hit area for easier grabbing */}
            <div className="absolute inset-y-0 -inset-x-2 cursor-col-resize" />
            <IconGripVertical className="size-4 text-muted-foreground group-hover:text-foreground transition-colors relative z-10" />
          </div>

          {/* AI Study Assistant Chat */}
          <div 
            style={{ width: `${100 - questionWidth}%` }}
            className={`min-w-0 ${isMounted && !isResizing ? 'transition-all duration-200' : ''}`}
          >
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