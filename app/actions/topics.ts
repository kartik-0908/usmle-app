"use server";
import prisma from "@/lib/db";
import { StepWithProgress, TopicWithProgress } from "@/lib/types/topic";
import { headers } from "next/headers";
import { auth } from "../lib/auth";

export async function getSteps(): Promise<StepWithProgress[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  console.log("Session in getStepsWithProgress:", session);
  const userId = session?.user?.id;
  try {
    // Fetch all active topics with their progress
    const steps = await prisma.step.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    return steps;
  } catch (error) {
    console.error("Error fetching topics with progress:", error);
    throw new Error("Failed to fetch topics");
  }
}

export async function getTopicsWithProgress(
  step: string,
  userId: string
): Promise<TopicWithProgress[]> {
  const timestamp = Date.now();
  console.log("starting fetching topics at", Date.now() - timestamp);
  console.log("userId fetched at", Date.now() - timestamp);
  try {
    // Fetch all active topics with their progress
    const topicsWithData = await prisma.topic.findMany({
      where: {
        isActive: true,
        step: {
          slug: step,
          isActive: true,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
        stepId: true,
        UserTopicProgress: {
          where: {
            userId: userId,
          },
          select: {
            questionsAttempted: true,
            questionsCorrect: true,
            totalTimeSpent: true,
            lastPracticedAt: true,
            streak: true,
            bestStreak: true,
            // Only select fields you actually use
          },
        },
        questionTopics: {
          where: {
            question: {
              isActive: true,
            },
          },
        },
      },
      // include: {
      //   UserTopicProgress: {
      //     where: {
      //       userId: userId,
      //     },
      //   },
      //   questionTopics: {
      //     where: {
      //       question: {
      //         isActive: true,
      //       },
      //     },
      //     include: {
      //       question: true,
      //     },
      //   },
      // },
      orderBy: {
        order: "asc",
      },
    });
    console.log("topics fetched from db", Date.now() - timestamp);
    const data = topicsWithData.map((topic) => {
      const progress = topic.UserTopicProgress[0]; // Should be only one per user
      const totalQuestions = topic.questionTopics.length; // This now only counts active questions
      const practiced = progress?.questionsAttempted || 0;
      const correct = progress?.questionsCorrect || 0;
      const accuracy = practiced > 0 ? (correct / practiced) * 100 : 0;
      const streak = progress?.streak || 0;
      const lastPracticedAt = progress?.lastPracticedAt;

      // Determine trend based on streak and recent activity
      let trend: "up" | "down" | "neutral" = "neutral";
      if (streak >= 3) {
        trend = "up";
      } else if (lastPracticedAt && isRecentlyActive(lastPracticedAt)) {
        trend = accuracy >= 70 ? "up" : "neutral";
      } else if (practiced > 0 && accuracy < 50) {
        trend = "down";
      }

      // Generate contextual notes and details
      const { note, detail } = generateProgressMessages(
        practiced,
        totalQuestions,
        accuracy,
        streak,
        lastPracticedAt
      );

      return {
        id: topic.id,
        name: topic.name,
        slug: topic.slug,
        practiced,
        total: totalQuestions,
        trend,
        note,
        detail,
        accuracy,
        lastPracticedAt,
        streak,
      };
    });
    console.log("data rearranged at", Date.now() - timestamp);
    return data;
  } catch (error) {
    console.error("Error fetching topics with progress:", error);
    throw new Error("Failed to fetch topics");
  }
}

function isRecentlyActive(lastPracticedAt: Date): boolean {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return lastPracticedAt > oneWeekAgo;
}

function generateProgressMessages(
  practiced: number,
  total: number,
  accuracy: number,
  streak: number,
  lastPracticedAt?: Date | null
): { note: string; detail: string } {
  if (practiced === 0) {
    return {
      note: "Ready to start",
      detail: "Begin your learning journey",
    };
  }

  const completionRate = (practiced / total) * 100;

  // High performance
  if (accuracy >= 80 && streak >= 5) {
    return {
      note: "Excellent performance!",
      detail: `${streak} day streak - keep it up!`,
    };
  }

  // Good streak
  if (streak >= 3) {
    return {
      note: "Great consistency",
      detail: `${streak} day streak - you're on fire!`,
    };
  }

  // High accuracy but low activity
  if (accuracy >= 75 && completionRate < 30) {
    return {
      note: "Strong accuracy",
      detail: "Try more questions to build momentum",
    };
  }

  // Low accuracy
  if (accuracy < 50 && practiced >= 10) {
    return {
      note: "Room for improvement",
      detail: "Review fundamentals and try again",
    };
  }

  // Recent activity
  if (lastPracticedAt && isRecentlyActive(lastPracticedAt)) {
    if (accuracy >= 70) {
      return {
        note: "Good progress this week",
        detail: "Maintain your momentum",
      };
    } else {
      return {
        note: "Active but struggling",
        detail: "Focus on understanding concepts",
      };
    }
  }

  // Inactive
  if (lastPracticedAt && !isRecentlyActive(lastPracticedAt)) {
    return {
      note: "Time to practice",
      detail: "Don't let your progress slip",
    };
  }

  // Default case
  if (completionRate >= 50) {
    return {
      note: "Steady progress",
      detail: "Keep up the good work",
    };
  }

  return {
    note: "Getting started",
    detail: "Build your foundation",
  };
}

// Helper function to determine status based on completion percentage
function getStatusFromCompletion(
  completed: number,
  total: number
): "Not Started" | "In Progress" | "Completed" {
  if (completed === 0) return "Not Started";
  if (completed === total) return "Completed";
  return "In Progress";
}

// Helper function to format relative time
function getRelativeTime(date: Date | null): string {
  if (!date) return "Never";

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// Helper function to get most common difficulty or average
function getDominantDifficulty(
  difficulties: string[]
): "Easy" | "Medium" | "Hard" {
  if (difficulties.length === 0) return "Medium";

  const counts = difficulties.reduce(
    (acc, diff) => {
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const dominant = Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
  return dominant as "Easy" | "Medium" | "Hard";
}

export async function getSubtopicData(topicSlug: string, userId: string) {
  // Get all subtopics for the topic
  const now = Date.now();
 
  const subtopics = await prisma.subtopic.findMany({
    where: {
      topic: {
        slug: topicSlug,
      },
      isActive: true,
    },
    include: {
      questionSubtopics: {
        include: {
          question: {
            include: {
              attempts: {
                where: {
                  userId: userId,
                },
                orderBy: {
                  attemptedAt: "desc",
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
  });

  console.log('db query finished at', Date.now()-now)

  // Transform the data for each subtopic
  const transformedData = subtopics.map((subtopic, index) => {
    const questions = subtopic.questionSubtopics.map((qs) => qs.question);
    const totalQuestions = questions.length;

    // Get unique questions that have been attempted
    const attemptedQuestions = new Set();
    const allAttempts: any[] = [];

    questions.forEach((question) => {
      if (question.attempts.length > 0) {
        attemptedQuestions.add(question.id);
        allAttempts.push(...question.attempts);
      }
    });

    const completedQuestions = attemptedQuestions.size;

    // Calculate accuracy
    let accuracy = 0;
    if (allAttempts.length > 0) {
      const correctAttempts = allAttempts.filter(
        (attempt) => attempt.isCorrect
      ).length;
      accuracy = Math.round((correctAttempts / allAttempts.length) * 100);
    }

    // Get last practiced date
    const lastPracticedDate =
      allAttempts.length > 0
        ? new Date(
            Math.max(
              ...allAttempts.map((a) => new Date(a.attemptedAt).getTime())
            )
          )
        : null;

    // Get dominant difficulty
    const difficulties = questions.map((q) => q.difficulty);
    const difficulty = getDominantDifficulty(difficulties);

    // Determine status
    const status = getStatusFromCompletion(completedQuestions, totalQuestions);

    return {
      id: index, // Create a numeric ID from the cuid
      name: subtopic.name,
      slug: subtopic.slug,
      totalQuestions,
      completedQuestions,
      difficulty,
      status,
      lastPracticed: getRelativeTime(lastPracticedDate),
      accuracy,
    };
  });

  return transformedData;
}

export async function getTopicNameFromSlug(slug: string): Promise<string> {
  const topic = await prisma.topic.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!topic) {
    throw new Error(`Topic with slug "${slug}" not found`);
  }

  return topic.name;
}

export async function getSubTopicNameFromSlug(slug: string): Promise<string> {
  const subtopic = await prisma.subtopic.findUnique({
    where: { slug },
    select: { name: true },
  });
  return subtopic ? subtopic.name : "Unknown Subtopic";
}

// Helper function to determine status from user attempts
function getQuestionStatus(
  attempts: any[]
): "Not Attempted" | "Correct" | "Incorrect" | "Flagged" {
  if (attempts.length === 0) return "Not Attempted";

  // Check if the most recent attempt was correct
  const latestAttempt = attempts[0]; // Assuming attempts are ordered by attemptedAt desc

  // If user has attempted many times (3+ times), consider it flagged
  if (attempts.length >= 3 && !latestAttempt.isCorrect) {
    return "Flagged";
  }

  return latestAttempt.isCorrect ? "Correct" : "Incorrect";
}

// Helper function to convert Difficulty enum to display string
function getDifficultyDisplay(difficulty: string): "Easy" | "Medium" | "Hard" {
  switch (difficulty) {
    case "EASY":
      return "Easy";
    case "MEDIUM":
      return "Medium";
    case "HARD":
      return "Hard";
    default:
      return "Medium";
  }
}

// Helper function to extract tags from question content (simplified approach)
function extractTags(questionText: string, title: string): string[] {
  // This is a simplified tag extraction - you might want to implement
  // a more sophisticated approach or store tags separately in your database
  const commonMedicalTerms = [
    "heart",
    "circulation",
    "anatomy",
    "physiology",
    "blood",
    "pressure",
    "valves",
    "chambers",
    "ventricle",
    "atrium",
    "artery",
    "vein",
    "respiratory",
    "lungs",
    "alveoli",
    "breathing",
    "oxygen",
    "carbon dioxide",
    "nervous",
    "brain",
    "neuron",
    "synapse",
    "muscle",
    "bone",
    "tissue",
  ];

  const text = (title + " " + questionText).toLowerCase();
  const foundTags = commonMedicalTerms.filter((term) =>
    text.includes(term.toLowerCase())
  );

  return foundTags.slice(0, 3); // Limit to 3 tags
}

export async function getQuestionsForSubtopic(subtopicId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id;
  const questions = await prisma.question.findMany({
    where: {
      questionSubtopics: {
        some: {
          subtopicId: subtopicId,
        },
      },
      isActive: true,
    },
    include: {
      attempts: {
        where: {
          userId: userId,
        },
        orderBy: {
          attemptedAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Transform the data for the table
  const transformedData = questions.map((question) => {
    const attempts = question.attempts;
    const totalAttempts = attempts.length;

    // Calculate total time spent (in seconds)
    const totalTimeSpent = attempts.reduce((total, attempt) => {
      return total + (attempt.timeSpent || 0);
    }, 0);

    // Get last attempted date
    const lastAttemptedDate =
      attempts.length > 0 ? attempts[0].attemptedAt : null;

    // Determine status
    const status = getQuestionStatus(attempts);

    // Extract tags (simplified approach)
    const tags = extractTags(question.questionText, question.title);

    return {
      id: question.id, // Create numeric ID from cuid
      title: question.title,
      type: "MCQ",
      difficulty: getDifficultyDisplay(question.difficulty),
      status,
      lastAttempted: getRelativeTime(lastAttemptedDate),
      timeSpent: totalTimeSpent,
      attempts: totalAttempts,
      tags,
    };
  });

  return transformedData;
}
