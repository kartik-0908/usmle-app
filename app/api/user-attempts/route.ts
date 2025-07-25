// app/api/user-attempts/route.ts
import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for validating the request body
const createUserAttemptSchema = z.object({
  userId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOptions: z.array(z.string()),
  isCorrect: z.boolean(),
  timeSpent: z.number().int().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = createUserAttemptSchema.parse(body);
    
    // Create the user attempt in the database
    const userAttempt = await prisma.userAttempt.create({
      data: {
        userId: validatedData.userId,
        questionId: validatedData.questionId,
        selectedOptions: validatedData.selectedOptions,
        isCorrect: validatedData.isCorrect,
        timeSpent: validatedData.timeSpent,
        attemptedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        question: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
      },
    });

    // Optionally update user progress statistics
    await updateUserProgress(validatedData.userId, validatedData.questionId, validatedData.isCorrect, validatedData.timeSpent);

    return NextResponse.json({
      success: true,
      data: userAttempt,
      message: 'Attempt saved successfully',
    });

  } catch (error) {
    console.error('Error saving user attempt:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to save attempt',
      },
      { status: 500 }
    );
  }
}

// Function to update user progress statistics
async function updateUserProgress(userId: string, questionId: string, isCorrect: boolean, timeSpent: number) {
  try {
    // Get question with its topic and step relationships
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        questionTopics: {
          include: {
            topic: {
              include: {
                step: true,
              },
            },
          },
        },
      },
    });

    if (!question) return;

    // Update progress for each topic this question belongs to
    for (const questionTopic of question.questionTopics) {
      const topicId = questionTopic.topicId;
      const stepId = questionTopic.topic.stepId;

      // Update or create topic progress
      await prisma.userTopicProgress.upsert({
        where: {
          userId_topicId: {
            userId,
            topicId,
          },
        },
        update: {
          questionsAttempted: {
            increment: 1,
          },
          questionsCorrect: isCorrect
            ? {
                increment: 1,
              }
            : undefined,
          totalTimeSpent: {
            increment: timeSpent,
          },
          lastPracticedAt: new Date(),
          // Update streak logic here if needed
        },
        create: {
          userId,
          topicId,
          questionsAttempted: 1,
          questionsCorrect: isCorrect ? 1 : 0,
          totalTimeSpent: timeSpent,
          lastPracticedAt: new Date(),
          streak: isCorrect ? 1 : 0,
          bestStreak: isCorrect ? 1 : 0,
        },
      });

      // Update or create step progress
      await prisma.userStepProgress.upsert({
        where: {
          userId_stepId: {
            userId,
            stepId,
          },
        },
        update: {
          questionsAttempted: {
            increment: 1,
          },
          questionsCorrect: isCorrect
            ? {
                increment: 1,
              }
            : undefined,
          totalTimeSpent: {
            increment: timeSpent,
          },
          lastPracticedAt: new Date(),
        },
        create: {
          userId,
          stepId,
          questionsAttempted: 1,
          questionsCorrect: isCorrect ? 1 : 0,
          totalTimeSpent: timeSpent,
          lastPracticedAt: new Date(),
          streak: isCorrect ? 1 : 0,
          bestStreak: isCorrect ? 1 : 0,
          isCompleted: false,
        },
      });
    }
  } catch (error) {
    console.error('Error updating user progress:', error);
    // Don't throw here as the main attempt was already saved
  }
}

// GET endpoint to retrieve user attempts (optional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const questionId = searchParams.get('questionId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const where: any = { userId };
    if (questionId) {
      where.questionId = questionId;
    }

    const attempts = await prisma.userAttempt.findMany({
      where,
      include: {
        question: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            questionType: true,
          },
        },
      },
      orderBy: {
        attemptedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.userAttempt.count({ where });

    return NextResponse.json({
      success: true,
      data: attempts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit,
      },
    });

  } catch (error) {
    console.error('Error fetching user attempts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}