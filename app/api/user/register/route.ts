// app/api/register/route.ts
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  age: z.number().int().min(18, "Must be at least 18").max(100, "Invalid age"),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Gender is required" }),
  }),
  medicalSchool: z
    .string()
    .min(1, "Medical school is required")
    .max(200, "Medical school name too long"),
  yearOfPassing: z
    .number()
    .int()
    .min(1950, "Invalid year")
    .max(new Date().getFullYear() + 10, "Invalid year"),
  stepExam: z.enum(["step1", "step2"], {
    errorMap: () => ({ message: "Step exam selection is required" }),
  }),
  id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validationResult = registrationSchema.safeParse({
      ...body,
      age: parseInt(body.age),
      yearOfPassing: parseInt(body.yearOfPassing),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { name, age, gender, medicalSchool, yearOfPassing, stepExam, id } =
      validationResult.data;

    // Check if user exists (they should already exist from sign up)
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found. Please sign up first." },
        { status: 404 }
      );
    }

    // Check if user has already completed registration
    if (existingUser.age && existingUser.medicalSchool) {
      return NextResponse.json(
        { error: "User registration already completed" },
        { status: 409 }
      );
    }

    // Split name into firstName and lastName
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Update existing user with additional medical student information
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        firstName,
        lastName,
        age,
        gender,
        medicalSchool,
        yearOfPassing,
        stepExam,
        updatedAt: new Date(),
      },
    });

    // Optional: Send welcome email after completing registration
    // try {
    //   await sendWelcomeEmail({
    //     name: updatedUser.name,
    //     age: updatedUser.age!,
    //     gender: updatedUser.gender!,
    //     medicalSchool: updatedUser.medicalSchool!,
    //     yearOfPassing: updatedUser.yearOfPassing!,
    //     stepExam: updatedUser.stepExam!,
    //     email: updatedUser.email,
    //   });
    // } catch (emailError) {
    //   console.error('Failed to send welcome email:', emailError);
    //   // Don't fail the registration if email fails
    // }

    // Return success response (excluding sensitive data)
    return NextResponse.json(
      {
        success: true,
        message: "Registration completed successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          age: updatedUser.age,
          gender: updatedUser.gender,
          medicalSchool: updatedUser.medicalSchool,
          yearOfPassing: updatedUser.yearOfPassing,
          stepExam: updatedUser.stepExam,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
