import { deleteCustomPracticeSet } from "@/app/actions/custom-practice-sets";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Practice set ID is required" },
        { status: 400 }
      );
    }

    await deleteCustomPracticeSet(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting practice set:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
