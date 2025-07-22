// app/dashboard/practice/[topic]/[subtopic]/question/[questionId]/page.tsx

import {
  getSubTopicNameFromSlug,
  getTopicNameFromSlug,
} from "@/app/actions/topics";
import { QuestionPracticeScreen } from "@/components/question";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";

// Type definitions to match your component expectations
type QuestionData = {
  id: number;
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

// Function to transform database question to component format
function transformQuestionData(dbQuestion: any): QuestionData {
  const { question, options, questionTopics, questionSubtopics } = dbQuestion;
  console.log(options)

  // Map database question types to component types
  const typeMapping = {
    MULTIPLE_CHOICE: "MCQ" as const,
    TRUE_FALSE: "True/False" as const,
    FILL_IN_BLANK: "Fill in the blank" as const,
    MULTIPLE_SELECT: "MCQ" as const, // Handle as MCQ for now
  };

  // Map database difficulty to component difficulty
  const difficultyMapping = {
    EASY: "Easy" as const,
    MEDIUM: "Medium" as const,
    HARD: "Hard" as const,
  };

  // Extract tags from topics and subtopics
  const topicTags = questionTopics.map((qt: any) =>
    qt.topic.name.toLowerCase()
  );
  const subtopicTags = questionSubtopics.map((qs: any) =>
    qs.subtopic.name.toLowerCase()
  );
  const tags = [...topicTags, ...subtopicTags];

  // Handle different question types
  let questionOptions: string[] | undefined;
  let correctAnswer: string;

  questionOptions = options.map((opt: any) => opt.text);
  const correctOption = options.find((opt: any) => opt.isCorrect);
  correctAnswer = correctOption?.text || "";

  return {
    id: parseInt(question.id), // Convert string ID to number to match your format
    title: question.title,
    //@ts-ignore
    type: typeMapping[question.questionType] || "MCQ",
    //@ts-ignore
    difficulty: difficultyMapping[question.difficulty],
    question: question.questionText,
    options: questionOptions,
    correctAnswer,
    explanation: question.explanation || "",
    tags,
    timeLimit: 120, // Default time limit, you might want to add this to your schema
  };
}

// Function to get question by ID
async function getQuestionById(questionId: string) {
  try {
    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
        isActive: true,
      },
      include: {
        options: {
          orderBy: {
            order: "asc",
          },
        },
        questionTopics: {
          include: {
            topic: true,
          },
        },
        questionSubtopics: {
          include: {
            subtopic: true,
          },
        },
      },
    });

    return question;
  } catch (error) {
    console.error("Error fetching question:", error);
    return null;
  }
}

// Function to get all questions for a topic/subtopic for navigation
async function getQuestionsForNavigation(
  topicSlug: string,
  subtopicSlug: string
) {
  try {
    // First get the topic and subtopic IDs
    const topic = await prisma.topic.findUnique({
      where: { slug: topicSlug, isActive: true },
    });

    const subtopic = await prisma.subtopic.findUnique({
      where: { slug: subtopicSlug, isActive: true },
    });

    if (!topic || !subtopic) {
      return [];
    }

    // Get all questions for this topic and subtopic
    const questions = await prisma.question.findMany({
      where: {
        isActive: true,
        questionTopics: {
          some: {
            topicId: topic.id,
          },
        },
        questionSubtopics: {
          some: {
            subtopicId: subtopic.id,
          },
        },
      },
      include: {
        options: {
          orderBy: {
            order: "asc",
          },
        },
        questionTopics: {
          include: {
            topic: true,
          },
        },
        questionSubtopics: {
          include: {
            subtopic: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // You might want to add an order field to your schema
      },
    });

    return questions.map((q: any) =>
      transformQuestionData({
        question: q,
        options: q.options,
        questionTopics: q.questionTopics,
        questionSubtopics: q.questionSubtopics,
      })
    );
  } catch (error) {
    console.error("Error fetching questions for navigation:", error);
    return [];
  }
}

export default async function QuestionPracticePage({
  params,
}: {
  params: Promise<{ topic: string; subtopic: string; questionId: string }>;
}) {
  const { topic, subtopic, questionId } = await params;

  // Fetch topic and subtopic names
  const topicName = await getTopicNameFromSlug(topic);
  const subtopicName = await getSubTopicNameFromSlug(subtopic);

  // Fetch the current question from database
  const dbQuestion = await getQuestionById(questionId);

  if (!dbQuestion) {
    notFound();
  }

  // Transform database question to component format
  const question = transformQuestionData({
    question: dbQuestion,
    options: dbQuestion.options,
    questionTopics: dbQuestion.questionTopics,
    questionSubtopics: dbQuestion.questionSubtopics,
  });

  // Fetch all questions for navigation
  const allQuestionsInOrder = await getQuestionsForNavigation(topic, subtopic);

  // Find current question index
  const currentQuestionIndex = allQuestionsInOrder.findIndex(
    (q: any) => q.id === question.id
  );
  const totalQuestions = allQuestionsInOrder.length;
  console.log(question);

  return (
    <QuestionPracticeScreen
      question={question}
      // topicName={topicName}
      // subtopicName={subtopicName}
      // currentQuestionIndex={currentQuestionIndex}
      // totalQuestions={totalQuestions}
      // allQuestions={allQuestionsInOrder}
    />
  );
}
