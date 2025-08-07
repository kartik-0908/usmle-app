// app/api/practice-sets/filtered-count/route.ts
import { Difficulty } from "@/app/generated/prisma";
import { auth } from "@/app/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface FilterRequest {
  systems: string[];
  disciplines: string[];
  includeUsed: boolean;
  includeUnused: boolean;
  includeCorrect: boolean;
  includeIncorrect: boolean;
  includeMarked: boolean;
  difficulties: Difficulty[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });
    const userId = session?.user?.id || "";
    const filters: FilterRequest = await request.json();

    // Get Step 1 data
    const step1 = await prisma.step.findUnique({
      where: { stepNumber: 1, isActive: true },
    });

    if (!step1) {
      return NextResponse.json({ error: "Step 1 not found" }, { status: 404 });
    }

    // Build the where clause
    const whereClause: any = {
      isActive: true,
      questionTopics: {
        some: {
          topic: {
            stepId: step1.id,
            isActive: true,
          },
        },
      },
    };

    // Add difficulty filter
    if (filters.difficulties.length > 0) {
      whereClause.difficulty = {
        in: filters.difficulties,
      };
    }

    // Add system filter
    if (filters.systems.length > 0) {
      whereClause.OR = [
        {
          QuestionSystem: {
            some: {
              system: { in: filters.systems },
            },
          },
        },
        {
          system: { in: filters.systems },
        },
      ];
    }

    // Add discipline filter
    if (filters.disciplines.length > 0) {
      const disciplineCondition = [
        {
          QuestionDiscipline: {
            some: {
              discipline: { in: filters.disciplines },
            },
          },
        },
        {
          discipline: { in: filters.disciplines },
        },
      ];

      if (whereClause.OR) {
        whereClause.AND = [{ OR: whereClause.OR }, { OR: disciplineCondition }];
        delete whereClause.OR;
      } else {
        whereClause.OR = disciplineCondition;
      }
    }

    // Get questions with user data
    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        attempts: {
          where: { userId },
          select: { isCorrect: true },
        },
        UserQuestionState: {
          where: { userId },
          select: { isUsed: true, isMarked: true },
        },
      },
    });

    // Filter based on user-specific criteria
    const filteredQuestions = questions.filter((question) => {
      const hasAttempts = question.attempts.length > 0;
      const isUsed = question.UserQuestionState[0]?.isUsed || hasAttempts;
      const isMarked = question.UserQuestionState[0]?.isMarked || false;

      // Check used/unused filter
      if (!filters.includeUsed && isUsed) return false;
      if (!filters.includeUnused && !isUsed) return false;

      // Check marked filter
      if (filters.includeMarked && !isMarked) return false;

      // Check correct/incorrect filter (only applies to attempted questions)
      if (hasAttempts) {
        const hasCorrectAttempt = question.attempts.some(
          (attempt) => attempt.isCorrect
        );
        const hasIncorrectAttempt = question.attempts.some(
          (attempt) => !attempt.isCorrect
        );

        if (filters.includeCorrect && !hasCorrectAttempt) return false;
        if (filters.includeIncorrect && !hasIncorrectAttempt) return false;
      } else {
        // For unattempted questions, exclude if we're specifically looking for correct/incorrect
        if (filters.includeCorrect || filters.includeIncorrect) {
          // Only exclude if ONLY correct or incorrect is selected (not both)
          if (
            (filters.includeCorrect && !filters.includeIncorrect) ||
            (!filters.includeCorrect && filters.includeIncorrect)
          ) {
            return false;
          }
        }
      }

      return true;
    });

    return NextResponse.json({ count: filteredQuestions.length });
  } catch (error) {
    console.error("Error getting filtered count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
