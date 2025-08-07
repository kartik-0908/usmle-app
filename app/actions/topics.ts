"use server";
import prisma from "@/lib/db";
import { StepWithProgress } from "@/lib/types/topic";

export async function getSteps(userId: string): Promise<StepWithProgress[]> {
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
