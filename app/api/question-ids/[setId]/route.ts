import { auth } from "@/app/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params;
    if (!setId) {
      return NextResponse.json({ error: "Missing setId" }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });
    const userId = session?.user?.id || "";

    // Pull ordered question IDs for this user practice set
    const rows = await prisma.userCustomPracticeSet.findMany({
      where: { userId: userId, customPracticeSetId: setId },
      select: {
        generatedQuestions: {
          select: {
            questionId: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    const data = rows
      .map((r) => r.generatedQuestions.map((q) => q.questionId))
      .flat();

    return NextResponse.json(
      {
        setId,
        count: data.length,
        questionIds: data, // array of cuids in the correct order
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/question-ids/:setId] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
