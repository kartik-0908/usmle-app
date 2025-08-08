// app/api/practice-sets/custom/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Difficulty } from "@/app/generated/prisma";
import prisma from "@/lib/db";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";

interface CreatePracticeSetRequest {
  name: string;
  description: string;
  maxQuestions: number;
  step: string;
  filters: {
    systems: string[];
    disciplines: string[];
    includeUsed: boolean;
    includeUnused: boolean;
    includeCorrect: boolean;
    includeIncorrect: boolean;
    includeMarked: boolean;
    difficulties: Difficulty[];
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("inside custom post route");
    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });
    const userId = session?.user?.id || "";

    const body: CreatePracticeSetRequest = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Practice set name is required" },
        { status: 400 }
      );
    }

    if (!body.maxQuestions || body.maxQuestions < 1) {
      return NextResponse.json(
        { error: "Valid number of questions is required" },
        { status: 400 }
      );
    }
    const stepNumber = parseInt(body.step || "1");

    // Get Step 1 data
    const step = await prisma.step.findUnique({
      where: { stepNumber: stepNumber, isActive: true },
    });

    if (!step) {
      return NextResponse.json({ error: "Step 1 not found" }, { status: 404 });
    }

    // Build the where clause for question filtering
    const whereClause: any = {
      isActive: true,
    };

    // Add difficulty filter
    if (body.filters.difficulties.length > 0) {
      whereClause.difficulty = {
        in: body.filters.difficulties,
      };
    }

    // Add system filter
    if (body.filters.systems.length > 0) {
      whereClause.OR = [
        {
          QuestionSystem: {
            some: {
              system: { in: body.filters.systems },
            },
          },
        },
        {
          system: { in: body.filters.systems },
        },
      ];
    }

    // Add discipline filter
    if (body.filters.disciplines.length > 0) {
      const disciplineCondition = [
        {
          QuestionDiscipline: {
            some: {
              discipline: { in: body.filters.disciplines },
            },
          },
        },
        {
          discipline: { in: body.filters.disciplines },
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
    const allQuestions = await prisma.question.findMany({
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
    const filteredQuestions = allQuestions.filter((question) => {
      const hasAttempts = question.attempts.length > 0;
      const isUsed = question.UserQuestionState[0]?.isUsed || hasAttempts;
      const isMarked = question.UserQuestionState[0]?.isMarked || false;

      // Check used/unused filter
      if (!body.filters.includeUsed && isUsed) return false;
      if (!body.filters.includeUnused && !isUsed) return false;

      // Check marked filter
      if (body.filters.includeMarked && !isMarked) return false;

      // Check correct/incorrect filter (only applies to attempted questions)
      if (hasAttempts) {
        const hasCorrectAttempt = question.attempts.some(
          (attempt) => attempt.isCorrect
        );
        const hasIncorrectAttempt = question.attempts.some(
          (attempt) => !attempt.isCorrect
        );

        if (body.filters.includeCorrect && !hasCorrectAttempt) return false;
        if (body.filters.includeIncorrect && !hasIncorrectAttempt) return false;
      } else {
        // For unattempted questions, exclude if we're specifically looking for correct/incorrect only
        if (
          (body.filters.includeCorrect && !body.filters.includeIncorrect) ||
          (!body.filters.includeCorrect && body.filters.includeIncorrect)
        ) {
          return false;
        }
      }

      return true;
    });

    if (filteredQuestions.length === 0) {
      return NextResponse.json(
        {
          error: "No questions match the selected filters",
        },
        { status: 400 }
      );
    }

    // Shuffle questions and limit to maxQuestions
    const shuffledQuestions = filteredQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, body.maxQuestions);

    // Create the custom practice set
    const practiceSet = await prisma.customPracticeSet.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        totalQuestions: shuffledQuestions.length,
        userId: userId,
      },
    });

    // Create user practice set session
    const userPracticeSet = await prisma.userCustomPracticeSet.create({
      data: {
        userId: userId,
        customPracticeSetId: practiceSet.id,
        status: "NOT_STARTED",
        generatedQuestions: {
          create: shuffledQuestions.map((question, index) => ({
            questionId: question.id,
            order: index + 1,
          })),
        },
      },
    });

    return NextResponse.json({
      id: userPracticeSet.id,
      practiceSetId: practiceSet.id,
      name: practiceSet.name,
      description: practiceSet.description,
      totalQuestions: practiceSet.totalQuestions,
      status: userPracticeSet.status,
      message: `Successfully created practice set with ${shuffledQuestions.length} questions`,
    });
  } catch (error) {
    console.error("Error creating custom practice set:", error);
    return NextResponse.json(
      { error: "Failed to create practice set" },
      { status: 500 }
    );
  }
}
