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

// Optimized function to get all required data in minimal queries
async function getQuestionPageData(
  topicSlug: string,
  subtopicSlug: string,
  questionId: string
) {
  try {
    // Single query to get topic and subtopic info
    const [topicData, subtopicData] = await Promise.all([
      prisma.topic.findUnique({
        where: { slug: topicSlug, isActive: true },
        select: { id: true, name: true },
      }),
      prisma.subtopic.findUnique({
        where: { slug: subtopicSlug, isActive: true },
        select: { id: true, name: true },
      }),
    ]);

    if (!topicData || !subtopicData) {
      return null;
    }

    // Parallel execution of main question query and navigation questions
    const [currentQuestion, navigationQuestions] = await Promise.all([
      // Get the current question with full details
      prisma.question.findUnique({
        where: {
          id: questionId,
          isActive: true,
        },
        include: {
          options: {
            orderBy: { order: "asc" },
          },
          questionTopics: {
            include: { topic: { select: { name: true } } },
          },
          questionSubtopics: {
            include: { subtopic: { select: { name: true } } },
          },
        },
      }),

      // Get minimal data for navigation (only what's needed)
      prisma.question.findMany({
        where: {
          isActive: true,
          questionTopics: {
            some: { topicId: topicData.id },
          },
          questionSubtopics: {
            some: { subtopicId: subtopicData.id },
          },
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
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

// Simplified transform function
function transformQuestionData(dbQuestion: any): QuestionData {
  const { question, options, questionTopics, questionSubtopics } = dbQuestion;

  // Extract tags more efficiently
  const topicTags = questionTopics.map((qt: any) =>
    qt.topic.name.toLowerCase()
  );
  const subtopicTags = questionSubtopics.map((qs: any) =>
    qs.subtopic.name.toLowerCase()
  );
  const tags = [...topicTags, ...subtopicTags];

  // Handle options and correct answer
  const questionOptions = options.map((opt: any) => opt.text);
  const correctOption = options.find((opt: any) => opt.isCorrect);
  const correctAnswer = correctOption?.text || "";

  return {
    id: question.id,
    title: question.title,
    type: "MCQ",
    difficulty: "Medium",
    question: question.questionText,
    options: questionOptions,
    correctAnswer,
    explanation: question.explanation || "",
    tags,
    timeLimit: 120,
  };
}

// Transform navigation questions to match QuestionData interface (with minimal required fields)
function transformNavigationQuestions(questions: any[]): QuestionData[] {
  return questions.map((q) => ({
    id: q.id,
    title: q.title,
    type: "MCQ" as const,
    difficulty: "Medium" as const, // You might want to add this field to your select
    question: "", // Empty for navigation - not needed
    correctAnswer: "", // Empty for navigation - not needed
    explanation: "", // Empty for navigation - not needed
    tags: [], // Empty for navigation - not needed
    timeLimit: 120, // Default value
    // options and image are optional, so we don't need to set them
  }));
}
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";

export default async function QuestionPracticePage({
  params,
}: {
  params: Promise<{
    step: string;
    topic: string;
    subtopic: string;
    questionId: string;
  }>;
}) {
  const { step, topic, subtopic, questionId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  const userId = session?.user.id || ''

  // Single optimized query for all data
  const pageData = await getQuestionPageData(topic, subtopic, questionId);

  if (!pageData) {
    notFound();
  }

  const { topicName, subtopicName, currentQuestion, navigationQuestions } =
    pageData;

  // Transform the current question
  const question = transformQuestionData({
    question: currentQuestion,
    options: currentQuestion.options,
    questionTopics: currentQuestion.questionTopics,
    questionSubtopics: currentQuestion.questionSubtopics,
  });

  // Transform navigation questions (minimal data for navigation)
  const allQuestionsInOrder = transformNavigationQuestions(navigationQuestions);

  // Find current question index
  const currentQuestionIndex = allQuestionsInOrder.findIndex(
    (q) => q.id === question.id
  );
  const totalQuestions = allQuestionsInOrder.length;

  return (
    <QuestionPracticeScreen
      userId={userId}
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
