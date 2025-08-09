// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, userId, pageUrl } = body;

    // Validate required fields
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        content: content.trim(),
        userId: userId || null,
        pageUrl: pageUrl || null,
      },
    });

    return NextResponse.json(
      {
        message: "Feedback submitted successfully",
        id: feedback.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
