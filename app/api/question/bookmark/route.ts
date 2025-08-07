import { auth } from "@/app/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });
    const userId = session?.user?.id || "";
    const { qId, bookmark } = await request.json();
    const ques = await prisma.userQuestionState.findUnique({
      where: {
        userId_questionId: {
          questionId: qId,
          userId: userId,
        },
      },
    });
    if (!ques) {
      await prisma.userQuestionState.create({
        data: {
          userId: userId,
          questionId: qId,
          isMarked: bookmark,
        },
      });
      return Response.json({ success: true }, { status: 200 });
    } else {
      await prisma.userQuestionState.update({
        where: {
          userId_questionId: {
            questionId: qId,
            userId: userId,
          },
        },
        data: {
          isMarked: bookmark,
        },
      });
    }
  } catch (error) {
    console.error("Error updating bookmark state:", error);
    return Response.json(
      { error: "Failed to update bookmark state" },
      { status: 500 }
    );
  }
}
