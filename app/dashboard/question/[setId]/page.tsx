import { auth } from "@/app/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PracticeSetClient from "./comp";

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
          updatedAt: 'desc',
        },
        take: 1,
        include: {
          generatedQuestions: {
            include: {
              question: {
                include: {
                  options: {
                    orderBy: {
                      order: 'asc',
                    },
                  },
                },
              },
            },
            orderBy: {
              order: 'asc',
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
            The practice set you're looking for doesn't exist or you don't have access to it.
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

  // If no user practice set exists or no questions generated, generate them
  if (!userPracticeSet || userPracticeSet.generatedQuestions.length === 0) {
    // Generate questions from the selected topics
    const availableQuestions = await prisma.question.findMany({
      where: {
        isActive: true,
      },
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (availableQuestions.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              No Questions Available
            </h1>
            <p className="text-gray-600 mb-4">
              There are no questions available for the selected topics in this practice set.
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

    // Shuffle and select questions
    const shuffledQuestions = availableQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffledQuestions.slice(0, customPracticeSet.totalQuestions);

    // Create or update user practice set with generated questions
    const updatedUserPracticeSet = await prisma.$transaction(async (tx) => {
      let ups = userPracticeSet;
      
      if (!ups) {
        //@ts-ignore
        ups = await tx.userCustomPracticeSet.create({
          data: {
            userId,
            customPracticeSetId: setId,
            status: 'NOT_STARTED',
          },
        });
      }

      // Clear existing questions
      await tx.userCustomPracticeQuestion.deleteMany({
        where: {
          userCustomPracticeSetId: ups.id,
        },
      });

      // Add new questions
      await tx.userCustomPracticeQuestion.createMany({
        data: selectedQuestions.map((question, index) => ({
          userCustomPracticeSetId: ups.id,
          questionId: question.id,
          order: index + 1,
        })),
      });

      return ups;
    });

    // Format the questions for the client
    const formattedQuestions = selectedQuestions.map((question, index) => ({
      id: question.id,
      title: question.title,
      questionText: question.questionText,
      difficulty: question.difficulty,
      questionType: question.questionType,
      options: question.options,
      order: index + 1,
    }));

    return (
      <PracticeSetClient
        practiceSet={{
          id: customPracticeSet.id,
          name: customPracticeSet.name,
          description: customPracticeSet.description,
          totalQuestions: customPracticeSet.totalQuestions,
        }}
        userPracticeSet={{
          id: updatedUserPracticeSet.id,
          status: updatedUserPracticeSet.status,
          score: updatedUserPracticeSet.score,
          questionsAttempted: updatedUserPracticeSet.questionsAttempted,
          questionsCorrect: updatedUserPracticeSet.questionsCorrect,
        }}
        questions={formattedQuestions}
        userId={userId}
      />
    );
  }

  // Use existing generated questions
  const questions = userPracticeSet.generatedQuestions.map(gq => ({
    id: gq.question.id,
    title: gq.question.title,
    questionText: gq.question.questionText,
    difficulty: gq.question.difficulty,
    questionType: gq.question.questionType,
    options: gq.question.options,
    // topics: gq.question.questionTopics.map(qt => qt.topic.name),
    order: gq.order,
  }));

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
        questionsAttempted: userPracticeSet.questionsAttempted,
        questionsCorrect: userPracticeSet.questionsCorrect,
      }}
      questions={questions}
      userId={userId}
    />
  );
}