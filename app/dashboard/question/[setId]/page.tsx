import { auth } from "@/app/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PracticeSetClient from "./comp";
import { getCounts } from "@/app/actions/custom-practice-sets";



export default async function Page({
  params,
}: {
  params: Promise<{
    setId: string;
  }>;
}) {
  const { setId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  // Get the custom practice set with its details
  const customPracticeSet = await prisma.customPracticeSet.findFirst({
    where: {
      userId: userId,
      id: setId,
      isActive: true,
    },
    include: {
      userPracticeSets: {
        where: {
          userId: userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
        include: {
          generatedQuestions: {
            include: {
              question: {
                include: {
                  options: {
                    orderBy: {
                      order: "asc",
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

  if (!customPracticeSet) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Custom Practice Set Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The practice set you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <a
            href="/dashboard/practice-custom"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Practice Sets
          </a>
        </div>
      </div>
    );
  }

  const userPracticeSet = customPracticeSet.userPracticeSets[0];
  console.log("User Practice Set:", userPracticeSet);

  // Use existing generated questions
  const questions = userPracticeSet.generatedQuestions.map((gq) => ({
    id: gq.question.id,
    title: gq.question.title,
    questionText: gq.question.questionText,
    difficulty: gq.question.difficulty,
    questionType: gq.question.questionType,
    options: gq.question.options,
    // topics: gq.question.questionTopics.map(qt => qt.topic.name),
    order: gq.order,
  }));
 
  const { correctCount, attemptedCount } = await getCounts(questions, userId);
  console.log("Final Counts:", { correctCount, attemptedCount });

  return (
    <PracticeSetClient
      practiceSet={{
        id: customPracticeSet.id,
        name: customPracticeSet.name,
        description: customPracticeSet.description,
        totalQuestions: customPracticeSet.totalQuestions,
        // topics: customPracticeSet.topics.map(t => t.topic.name),
      }}
      userPracticeSet={{
        id: userPracticeSet.id,
        status: userPracticeSet.status,
        score: userPracticeSet.score,
        questionsAttempted: attemptedCount,
        questionsCorrect: correctCount,
      }}
      questions={questions}
    />
  );
}
