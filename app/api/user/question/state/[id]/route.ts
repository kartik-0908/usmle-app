import { auth } from "@/app/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("Fetching question state for ID:", id);
    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });
    const userId = session?.user?.id || "";

    const ques = await prisma.userQuestionState.findUnique({
      where: {
        userId_questionId: {
          questionId: id || "",
          userId: userId,
        },
      },
    });
    console.log("Fetched question state:", ques);
    if(!ques){
      return Response.json({
        isMarked: false,
        isCorrect: null,
      })
    }
    

    return Response.json(
      {
        isMarked: ques.isMarked,
        isCorrect: ques.isCorrect,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching question state:", error);
    return Response.json(
      { error: "Failed to fetch question state" },
      { status: 500 }
    );
  }
}
