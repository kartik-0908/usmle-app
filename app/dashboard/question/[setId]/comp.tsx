'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  Trophy, 
  Target, 
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Types
type PracticeSetStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_BLANK' | 'MULTIPLE_SELECT';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface Question {
  id: string;
  title: string;
  questionText: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  options: Option[];
  order: number;
}

interface PracticeSet {
  id: string;
  name: string;
  description?: string | null;
  totalQuestions: number;
}

interface UserPracticeSet {
  id: string;
  status: PracticeSetStatus;
  score: number | null;
  questionsAttempted: number;
  questionsCorrect: number;
}

interface PracticeSetClientProps {
  practiceSet: PracticeSet;
  userPracticeSet: UserPracticeSet;
  questions: Question[];
  userId: string;
}

const getStatusColor = (status: PracticeSetStatus) => {
  switch (status) {
    case 'NOT_STARTED':
      return 'bg-gray-100 text-gray-800';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'PAUSED':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function PracticeSetClient({
  practiceSet,
  userPracticeSet,
  questions,
  userId,
}: PracticeSetClientProps) {
  const [isStarting, setIsStarting] = useState(false);

  const handleStartPractice = async () => {
    setIsStarting(true);
    try {
      // Navigate to practice session
      window.location.href = `/dashboard/question/${practiceSet.id}/${questions[0].id}`;
    } catch (error) {
      console.error('Error starting practice:', error);
      setIsStarting(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      const response = await fetch(`/api/custom-practice-sets/${practiceSet.id}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error regenerating questions:', error);
    }
  };

  const progressPercentage = practiceSet.totalQuestions > 0 
    ? Math.round((userPracticeSet.questionsAttempted / practiceSet.totalQuestions) * 100)
    : 0;

  const scorePercentage = userPracticeSet.questionsAttempted > 0
    ? Math.round((userPracticeSet.questionsCorrect / userPracticeSet.questionsAttempted) * 100)
    : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <a href="/dashboard/practice-custom" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Practice Sets
          </a>
        </Button>
      </div>

      {/* Practice Set Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{practiceSet.name}</CardTitle>
                  {practiceSet.description && (
                    <CardDescription className="text-base mt-2">
                      {practiceSet.description}
                    </CardDescription>
                  )}
                </div>
                <Badge className={getStatusColor(userPracticeSet.status)}>
                  {userPracticeSet.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* <div className="flex flex-wrap gap-2 mb-4">
                {practiceSet.topics.map((topic, index) => (
                  <Badge key={index} variant="outline">
                    {topic}
                  </Badge>
                ))}
              </div> */}
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{practiceSet.totalQuestions}</span>
                  <span className="text-muted-foreground">Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">{userPracticeSet.questionsCorrect}</span>
                  <span className="text-muted-foreground">Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{userPracticeSet.questionsAttempted}</span>
                  <span className="text-muted-foreground">Attempted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">{scorePercentage}%</span>
                  <span className="text-muted-foreground">Score</span>
                </div>
              </div>

              {/* Progress Bar */}
              {userPracticeSet.questionsAttempted > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleStartPractice}
                disabled={isStarting}
                className="w-full"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                {userPracticeSet.status === 'NOT_STARTED' ? 'Start Practice' : 'Continue Practice'}
              </Button>
              
              {/* <Button 
                onClick={handleRegenerate}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate Questions
              </Button> */}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Practice Questions ({questions.length})
          </CardTitle>
          <CardDescription>
            Preview of questions in this practice set
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-16">#</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Question</th>
                  {/* <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th> */}
                  {/* <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Difficulty</th> */}
                  {/* <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Topics</th> */}
                  {/* <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Options</th> */}
                </tr>
              </thead>
              <tbody>
                {questions.map((question, index) => (
                  <tr key={question.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4 align-middle">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                        {question.order}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div>
                        <div className="font-medium mb-1">{question.title}</div>
                        {/* <div className="text-sm text-muted-foreground line-clamp-2">
                          {question.questionText.replace(/<[^>]*>/g, '').substring(0, 100)}
                          {question.questionText.length > 100 ? '...' : ''}
                        </div> */}
                      </div>
                    </td>
                    {/* <td className="p-4 align-middle">
                      <Badge variant="outline" className="text-xs">
                        {formatQuestionType(question.questionType)}
                      </Badge>
                    </td> */}
                    {/* <td className="p-4 align-middle">
                      <Badge className={`text-xs border ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </Badge>
                    </td> */}
                    <td className="p-4 align-middle">
                      {/* <div className="flex flex-wrap gap-1">
                        {question.topics.slice(0, 2).map((topic, topicIndex) => (
                          <Badge key={topicIndex} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {question.topics.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{question.topics.length - 2}
                          </Badge>
                        )}
                      </div> */}
                    </td>
                    {/* <td className="p-4 align-middle">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{question.options.length}</span>
                        <span className="text-muted-foreground">options</span>
                        {question.options.some(opt => opt.isCorrect) && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {questions.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Questions Generated</h3>
              <p className="text-muted-foreground mb-4">
                There are no questions available for this practice set.
              </p>
              <Button onClick={handleRegenerate} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Generate Questions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}