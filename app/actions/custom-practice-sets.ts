import prisma from "@/lib/db";
import { PracticeSetStatus } from "../generated/prisma";

export interface CreateCustomPracticeSetInput {
  name: string;
  description?: string;
  totalQuestions: number;
  selectedTopics: string[];
  userId: string;
}

export async function getCounts(questions: { id: string }[], userId: string) {
  // Get states for all question IDs in one go
  const states = await prisma.userQuestionState.findMany({
    where: {
      userId,
      questionId: { in: questions.map((q) => q.id) },
    },
    select: { isUsed: true, isCorrect: true },
  });

  let attemptedCount = 0;
  let correctCount = 0;

  for (const s of states) {
    if (s.isUsed) {
      attemptedCount++;
      if (s.isCorrect) correctCount++;
    }
  }

  return { attemptedCount, correctCount };
}

async function getSetLastAttempt(questions: { id: string }[], userId: string) {
  const lastAttempt = await prisma.userQuestionState.findFirst({
    where: {
      userId,
      questionId: { in: questions.map((q) => q.id) },
      isUsed: true,
    },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  return lastAttempt ? lastAttempt.updatedAt : null;
}

export async function getUserCustomPracticeSets(userId: string) {
  const practiceSets = await prisma.userCustomPracticeSet.findMany({
    where: {
      userId,
      // isActive: true,
    },
    select: {
      id: true,
      customPracticeSet: true,
      generatedQuestions: {
        select: {
          question: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy:{
      updatedAt: "desc",
    }
  });

  let data = [];

  for (const set of practiceSets) {
    if (set) {
      const { attemptedCount, correctCount } = await getCounts(
        set.generatedQuestions.map((gq) => gq.question),
        userId
      );

      const lastAttempted = await getSetLastAttempt(
        set.generatedQuestions.map((gq) => gq.question),
        userId
      );

      data.push({
        id: set.customPracticeSet.id,
        name: set.customPracticeSet.name,
        totalQuestions: set.customPracticeSet.totalQuestions,
        status:
          attemptedCount > 0
            ? "IN_PROGRESS"
            : ("NOT_STARTED" as PracticeSetStatus),
        createdAt: set.customPracticeSet.createdAt,
        lastAttempted: lastAttempted,
        bestScore: correctCount,
      });
    }
  }

  return data;
}

export async function deleteCustomPracticeSet(practiceSetId: string) {
  await prisma.$transaction(async (tx) => {
    // Get all user practice sets for this custom practice set
    const userPracticeSets = await tx.userCustomPracticeSet.findMany({
      where: {
        customPracticeSetId: practiceSetId,
      },
      select: {
        id: true,
      },
    });

    // Delete user custom practice questions
    if (userPracticeSets.length > 0) {
      await tx.userCustomPracticeQuestion.deleteMany({
        where: {
          userCustomPracticeSetId: {
            in: userPracticeSets.map((ups) => ups.id),
          },
        },
      });
    }

    // Delete user practice sets
    await tx.userCustomPracticeSet.deleteMany({
      where: {
        customPracticeSetId: practiceSetId,
      },
    });

    // Delete the practice set
    await tx.customPracticeSet.delete({
      where: {
        id: practiceSetId,
      },
    });
  });
}
