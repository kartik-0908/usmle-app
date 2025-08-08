// app/api/practice-sets/filter-counts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("insdie filter-counts get route");
    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });
    const userId = session?.user?.id || "";
    const { searchParams } = new URL(request.url);
    const systemsParam = searchParams.get("systems");
    const disciplinesParam = searchParams.get("disciplines");
    const stepNumber = parseInt(searchParams.get("step") || "1");

    const selectedSystems = systemsParam ? systemsParam.split(",") : [];
    const selectedDisciplines = disciplinesParam
      ? disciplinesParam.split(",")
      : [];

    // Get Step 1 data
    const step = await prisma.step.findUnique({
      where: { stepNumber: stepNumber, isActive: true },
    });

    if (!step) {
      return NextResponse.json({ error: "Step 1 not found" }, { status: 404 });
    }

    // Get all available systems and disciplines for Step 1
    const [availableSystems, availableDisciplines] = await Promise.all([
      prisma.stepSystem.findMany({
        where: { stepId: step.id, isActive: true },
        select: { system: true },
        orderBy: { order: "asc" },
      }),
      prisma.stepDiscipline.findMany({
        where: { stepId: step.id, isActive: true },
        select: { discipline: true },
        orderBy: { order: "asc" },
      }),
    ]);

    // Build where clause for questions based on selected filters
    const whereClause: any = {
      isActive: true,
    };

    // Apply system and discipline filters if any are selected
    const systemDisciplineConditions = [];

    if (selectedSystems.length > 0) {
      systemDisciplineConditions.push({
        OR: [
          {
            QuestionSystem: {
              some: {
                system: { in: selectedSystems },
              },
            },
          },
          {
            system: { in: selectedSystems },
          },
        ],
      });
    }

    if (selectedDisciplines.length > 0) {
      systemDisciplineConditions.push({
        OR: [
          {
            QuestionDiscipline: {
              some: {
                discipline: { in: selectedDisciplines },
              },
            },
          },
          {
            discipline: { in: selectedDisciplines },
          },
        ],
      });
    }

    if (systemDisciplineConditions.length > 0) {
      whereClause.AND = systemDisciplineConditions;
    }

    // Get filtered questions
    const allQuestions = await prisma.question.findMany({
      where: whereClause,
      include: {
        QuestionSystem: true,
        QuestionDiscipline: true,
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

    // Count questions by system (only for available systems)
    const systemCounts: Record<string, number> = {};
    availableSystems.forEach(({ system }) => {
      // Create a filter for this specific system
      const systemFilteredQuestions = allQuestions.filter((q) => {
        // If no disciplines are selected, include all questions for this system
        if (selectedDisciplines.length === 0) {
          return (
            q.QuestionSystem.some((qs) => qs.system === system) ||
            q.system === system
          );
        }

        // If disciplines are selected, include only questions that match both system and discipline
        const matchesSystem =
          q.QuestionSystem.some((qs) => qs.system === system) ||
          q.system === system;
        const matchesDiscipline = selectedDisciplines.some(
          (discipline) =>
            q.QuestionDiscipline.some((qd) => qd.discipline === discipline) ||
            q.discipline === discipline
        );

        return matchesSystem && matchesDiscipline;
      });

      systemCounts[system] = systemFilteredQuestions.length;
    });

    // Count questions by discipline (only for available disciplines)
    const disciplineCounts: Record<string, number> = {};
    availableDisciplines.forEach(({ discipline }) => {
      // Create a filter for this specific discipline
      const disciplineFilteredQuestions = allQuestions.filter((q) => {
        // If no systems are selected, include all questions for this discipline
        if (selectedSystems.length === 0) {
          return (
            q.QuestionDiscipline.some((qd) => qd.discipline === discipline) ||
            q.discipline === discipline
          );
        }

        // If systems are selected, include only questions that match both discipline and system
        const matchesDiscipline =
          q.QuestionDiscipline.some((qd) => qd.discipline === discipline) ||
          q.discipline === discipline;
        const matchesSystem = selectedSystems.some(
          (system) =>
            q.QuestionSystem.some((qs) => qs.system === system) ||
            q.system === system
        );

        return matchesDiscipline && matchesSystem;
      });

      disciplineCounts[discipline] = disciplineFilteredQuestions.length;
    });

    // Count questions by status and difficulty (based on filtered questions)
    let usedQuestions = 0;
    let unusedQuestions = 0;
    let correctQuestions = 0;
    let incorrectQuestions = 0;
    let markedQuestions = 0;
    let easyQuestions = 0;
    let mediumQuestions = 0;
    let hardQuestions = 0;

    allQuestions.forEach((question) => {
      const hasAttempts = question.attempts.length > 0;
      const isUsed = question.UserQuestionState[0]?.isUsed || hasAttempts;
      const isMarked = question.UserQuestionState[0]?.isMarked || false;

      // Status counts
      if (isUsed) {
        usedQuestions++;
      } else {
        unusedQuestions++;
      }

      if (isMarked) {
        markedQuestions++;
      }

      // Correctness counts (only for attempted questions)
      if (hasAttempts) {
        const hasCorrectAttempt = question.attempts.some(
          (attempt) => attempt.isCorrect
        );
        const hasIncorrectAttempt = question.attempts.some(
          (attempt) => !attempt.isCorrect
        );

        if (hasCorrectAttempt) correctQuestions++;
        if (hasIncorrectAttempt) incorrectQuestions++;
      }

      // Difficulty counts
      switch (question.difficulty) {
        case "EASY":
          easyQuestions++;
          break;
        case "MEDIUM":
          mediumQuestions++;
          break;
        case "HARD":
          hardQuestions++;
          break;
      }
    });

    const response = {
      counts: {
        systems: systemCounts,
        disciplines: disciplineCounts,
        usedQuestions,
        unusedQuestions,
        correctQuestions,
        incorrectQuestions,
        markedQuestions,
        easyQuestions,
        mediumQuestions,
        hardQuestions,
        total: allQuestions.length,
      },
      availableFilters: {
        systems: availableSystems.map((s) => s.system),
        disciplines: availableDisciplines.map((d) => d.discipline),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching filter counts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
