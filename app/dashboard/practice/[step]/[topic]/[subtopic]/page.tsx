// app/dashboard/practice/[topic]/[subtopic]/question/[questionId]/page.tsx

import { QuestionPracticeScreen } from "@/components/question";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";

// Type definitions
type QuestionData = {
  id: string;
  title: string;
  type: "MCQ" | "True/False" | "Short Answer" | "Fill in the blank";
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  tags: string[];
  image?: string;
  timeLimit: number;
};

// Map database enums to component types
function mapDifficulty(difficulty: any): "Easy" | "Medium" | "Hard" {
  switch (difficulty) {
    case "EASY": return "Easy";
    case "MEDIUM": return "Medium";
    case "HARD": return "Hard";
    default: return "Medium";
  }
}

function mapQuestionType(questionType: any): "MCQ" | "True/False" | "Short Answer" | "Fill in the blank" {
  switch (questionType) {
    case "MULTIPLE_CHOICE": return "MCQ";
    case "TRUE_FALSE": return "True/False";
    case "FILL_IN_BLANK": return "Fill in the blank";
    case "MULTIPLE_SELECT": return "MCQ";
    default: return "MCQ";
  }
}

// Super optimized function to get all required data
async function getQuestionPageData(
  topicSlug: string,
  subtopicSlug: string,
  questionId: string
) {
  try {
    // Single query to get topic and subtopic info with optimized indexes
    const [topicData, subtopicData] = await Promise.all([
      prisma.topic.findFirst({
        where: { slug: topicSlug, isActive: true }, // Uses new composite index
        select: { id: true, name: true }
      }),
      prisma.subtopic.findFirst({
        where: { slug: subtopicSlug, isActive: true }, // Uses new composite index
        select: { id: true, name: true }
      })
    ]);

    if (!topicData || !subtopicData) {
      return null;
    }

    // Parallel execution with optimized queries
    const [currentQuestion, navigationQuestions] = await Promise.all([
      // Get the current question with full details
      prisma.question.findFirst({
        where: {
          id: questionId,
          isActive: true, // Uses new composite index
        },
        include: {
          options: {
            orderBy: { order: "asc" }, // Uses new composite index
          },
          questionTopics: {
            include: { topic: { select: { name: true } } },
          },
          questionSubtopics: {
            include: { subtopic: { select: { name: true } } },
          },
        },
      }),
      
      // Optimized navigation query using the new composite indexes
      prisma.question.findMany({
        where: {
          isActive: true,
          questionTopics: {
            some: { topicId: topicData.id }, // Uses new junction table index
          },
          questionSubtopics: {
            some: { subtopicId: subtopicData.id }, // Uses new junction table index
          },
        },
        select: {
          id: true,
          title: true,
          difficulty: true, // Now selecting actual difficulty
          createdAt: true,
        },
        orderBy: { createdAt: "asc" }, // Uses new composite index
      })
    ]);

    if (!currentQuestion) {
      return null;
    }

    return {
      topicName: topicData.name,
      subtopicName: subtopicData.name,
      currentQuestion,
      navigationQuestions,
    };
  } catch (error) {
    console.error("Error fetching question page data:", error);
    return null;
  }
}

// Updated transform function using actual database fields
function transformQuestionData(dbQuestion: any): QuestionData {
  const { question, options, questionTopics, questionSubtopics } = dbQuestion;

  // Extract tags more efficiently
  const topicTags = questionTopics.map((qt: any) => qt.topic.name.toLowerCase());
  const subtopicTags = questionSubtopics.map((qs: any) => qs.subtopic.name.toLowerCase());
  const tags = [...topicTags, ...subtopicTags];

  // Handle options and correct answer
  const questionOptions = options.map((opt: any) => opt.text);
  const correctOption = options.find((opt: any) => opt.isCorrect);
  const correctAnswer = correctOption?.text || "";

  return {
    id: question.id,
    title: question.title,
    type: mapQuestionType(question.questionType), // Use actual question type
    difficulty: mapDifficulty(question.difficulty), // Use actual difficulty
    question: question.questionText,
    options: questionOptions,
    correctAnswer,
    explanation: question.explanation || "",
    tags,
    timeLimit: 120,
  };
}

// Transform navigation questions using actual difficulty
function transformNavigationQuestions(questions: any[]): QuestionData[] {
  return questions.map(q => ({
    id: q.id,
    title: q.title,
    type: "MCQ" as const,
    difficulty: mapDifficulty(q.difficulty), // Use actual difficulty from DB
    question: "",
    correctAnswer: "",
    explanation: "",
    tags: [],
    timeLimit: 120,
  }));
}

export default async function QuestionPracticePage({
  params,
}: {
  params: Promise<{ step: string; topic: string; subtopic: string; questionId: string }>;
}) {
  const { step, topic, subtopic, questionId } = await params;

  // Single optimized query for all data
  const pageData = await getQuestionPageData(topic, subtopic, questionId);

  if (!pageData) {
    notFound();
  }

  const { topicName, subtopicName, currentQuestion, navigationQuestions } = pageData;

  // Transform the current question
  const question = transformQuestionData({
    question: currentQuestion,
    options: currentQuestion.options,
    questionTopics: currentQuestion.questionTopics,
    questionSubtopics: currentQuestion.questionSubtopics,
  });

  // Transform navigation questions
  const allQuestionsInOrder = transformNavigationQuestions(navigationQuestions);

  // Find current question index
  const currentQuestionIndex = allQuestionsInOrder.findIndex(
    (q) => q.id === question.id
  );
  const totalQuestions = allQuestionsInOrder.length;

  return (
    <QuestionPracticeScreen
      question={question}
      topicName={topicName}
      subtopicName={subtopicName}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={totalQuestions}
      allQuestions={allQuestionsInOrder}
      stepSlug={step}
      topicSlug={topic}
      subtopicSlug={subtopic}
    />
  );
}