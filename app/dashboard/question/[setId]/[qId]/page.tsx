import { auth } from "@/app/lib/auth";
import { LatestQuestionPracticeScreen } from "@/components/question2";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ setId: string; qId: string }>;
}) {
  const { setId, qId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  // Get the custom practice set with user practice set and generated questions
  const customPracticeSet = await prisma.customPracticeSet.findFirst({
    where: {
      userId: userId,
      id: setId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      totalQuestions: true,
      userPracticeSets: {
        where: {
          userId: userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          generatedQuestions: {
            include: {
              question: {
                include: {
                  options: {
                    orderBy: {
                      order: "asc",
                    },
                  },
                  questionTopics: {
                    include: {
                      topic: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  if (!customPracticeSet || !customPracticeSet.userPracticeSets[0]) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <h1 className="text-2xl font-bold">Custom Practice Set Not Found</h1>
      </div>
    );
  }

  const userPracticeSet = customPracticeSet.userPracticeSets[0];
  const generatedQuestions = userPracticeSet.generatedQuestions;

  if (generatedQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <h1 className="text-2xl font-bold">No Questions Found</h1>
      </div>
    );
  }

  // Find current question index by qId
  const currentQuestionIndex = generatedQuestions.findIndex(
    (gq) => gq.question.id === qId
  );

  if (currentQuestionIndex === -1) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <h1 className="text-2xl font-bold">Question Not Found</h1>
      </div>
    );
  }

  const currentQuestion = generatedQuestions[currentQuestionIndex];

  // Get previous and next question IDs
  const prevQuestion =
    currentQuestionIndex > 0
      ? generatedQuestions[currentQuestionIndex - 1]
      : null;
  const nextQuestion =
    currentQuestionIndex < generatedQuestions.length - 1
      ? generatedQuestions[currentQuestionIndex + 1]
      : null;

  // Find the correct answer
  const correctOption = currentQuestion.question.options.find(
    (option) => option.isCorrect
  );
  const correctAnswer = correctOption ? correctOption.text : "";

  // Format the question data according to practiceQuestionSchema
  const formattedQuestion = {
    id: currentQuestion.question.id,
    title: currentQuestion.question.title,
    question: currentQuestion.question.questionText,
    options: currentQuestion.question.options.map((option) => option.text),
    correctAnswer: correctAnswer,
    explanation: currentQuestion.question.explanation || "",
    tags: currentQuestion.question.questionTopics.map((qt) => qt.topic.name),
    image: undefined, // Add image field if you have it in your schema
  };

  return (
    <LatestQuestionPracticeScreen
      currentIndex={currentQuestionIndex} // 1-based index for display
      question={formattedQuestion}
      setId={setId}
      userId={userId}
      nextQuesId={nextQuestion?.question.id || null}
      prevQuesId={prevQuestion?.question.id || null}
      totalQuestions={generatedQuestions.length}
    />
  );
}
