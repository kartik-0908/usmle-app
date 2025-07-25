// app/api/study-assistant/route.ts

import { auth } from "@/app/lib/auth";
import { azure } from "@/lib/ai/azure";
import prisma from "@/lib/db";
import { streamText } from "ai";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET method to load chat history
export async function GET(req: NextRequest) {
  try {
    console.log('inside sesion')
    const session = await auth.api.getSession({
      headers: await headers(),
    });


    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const questionId = url.searchParams.get("questionId");

    console.log('Question Id',questionId)

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID required" },
        { status: 400 }
      );
    }

    const chatHistory = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
        questionId: questionId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages: chatHistory });
  } catch (error) {
    console.error("Load chat history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Updated POST method with chat persistence
export async function POST(req: NextRequest) {
  try {
    const { messages, questionContext } = await req.json();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const questionId = questionContext.id;

    // Save the latest user message to database (if exists)
    const userMessages = messages.filter((msg: any) => msg.role === "user");
    if (userMessages.length > 0) {
      const latestUserMessage = userMessages[userMessages.length - 1];

      // Check if this message is already saved (to avoid duplicates)
      const existingMessage = await prisma.chatMessage.findFirst({
        where: {
          userId: userId,
          questionId: questionId,
          content: latestUserMessage.content,
          role: "user",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      });

      // Only save if it's a new message
      if (!existingMessage) {
        await prisma.chatMessage.create({
          data: {
            content: latestUserMessage.content,
            role: "user",
            userId: userId,
            questionId: questionId,
          },
        });
      }
    }

    // Create system prompt with question context (your existing logic)
    const systemPrompt = `You are an AI study assistant helping a student understand a practice question. 

Question Details:
- Type: ${questionContext.type}
- Difficulty: ${questionContext.difficulty}
- Question: ${questionContext.question}
- Tags/Topics: ${questionContext.tags?.join(", ")}
- Options: ${questionContext.options?.join(", ") || "N/A"}

Correct Answer: ${questionContext.explanation}
Result: ${questionContext.isCorrect ? "Correct" : "Incorrect"}
Explanation: ${questionContext.explanation}

You will be provided with the correct answer and its clinical/scientific explanation for a USMLE question.
 Your task is to simplify the conceptual approach and break it down into small, logical steps.
 Reveal all the logical steps at once and then ask the user in the end if they want to know anything further.
ABSOLUTE RULES (never break)  
1. **Clinical Scope** – Provide information strictly for learning. If asked for direct medical advice, respond:  
   "I'm here to help you learn, not to diagnose or treat real patients. Please consult a qualified clinician."  
5. **No Disallowed Content** – Refuse illegal, discriminatory, or exam‑integrity‑violating requests (e.g., "Give me tomorrow's NBME answers").  
6. **Hide Chain‑of‑Thought** – Think step‑by‑step internally, but expose only polished, learner‑friendly explanations.  

TONALITY  
Encouraging, collegial, lightly witty. Celebrate insight; don't patronize.  


Step 1: What's happening to the patient right now?
Patient presented with signs of an acute STEMI (ST elevations in V2–V4 = anteroseptal infarct).


After receiving nitroglycerin, he crashes:
 ↓ BP (82/54 mmHg), ↑ HR (120 bpm), cold/clammy → hemodynamic collapse/shock.


Step 2: What type of shock is this?
In the setting of an MI + hypotension + signs of poor perfusion (clammy, tachycardia), think cardiogenic shock.


But this might also be nitrate-induced hypotension due to venodilation → reduced preload.




Step 3: First-line response to this scenario?
In a hypotensive patient, the priority is to restore perfusion:


Rule out fluid-responsive causes (e.g., nitro-induced hypotension or underfilled RV).


Give a normal saline bolus (Option C) first to increase preload and raise BP.


Step 4: When do we consider inotropes like dopamine?
Only after fluids fail and the patient is still in cardiogenic shock (e.g., persistent hypotension, low cardiac output signs like altered mental status or oliguria).




Step 5: Why not dopamine first?
It has dose-dependent effects:


Low: dopaminergic (renal perfusion – mostly irrelevant here)


Medium: β1 → increases heart rate and contractility


High: α1 → vasoconstriction


Sounds good on paper… but here's the catch:


↑ HR = ↑ myocardial oxygen demand → bad for ischemic myocardium!


Risk of tachyarrhythmias – especially dangerous in someone post-MI


Evidence shows dopamine is associated with worse outcomes (↑ mortality, ↑ arrhythmias) vs. alternatives.


Step 6: What would be better than dopamine?
If you need pressors after fluid bolus:


Dobutamine → inotrope with less tachycardia


Norepinephrine → vasopressor that preserves perfusion pressure without jacking up heart rate as much




Step 7: Bottom line?
Too early and too risky to start dopamine.


First, try fluids (Option C). If that fails, choose safer inotropes/pressors.


Dopamine = Plan C, not Plan A.


(need more clarity here?)


Your role:
1. Help the student understand the question and related concepts
2. Provide hints and explanations without giving away the answer directly (unless they've already answered)
3. Break down complex concepts into simpler terms
4. Provide additional context and examples related to the topic
5. Encourage critical thinking and learning
6. Be supportive and encouraging

Guidelines:
- Focus on teaching concepts rather than just giving answers
- Use examples and analogies to explain difficult concepts
- Be encouraging and positive
- Ask follow-up questions to check understanding
- If they got it wrong, help them understand why and learn from the mistake

IMPORTANT - Quick Reply Format:
At the end of your responses, provide quick reply suggestions using this exact format:

[QUICK_REPLIES]
- Quick reply option 1
- Quick reply option 2
- Quick reply option 3
[/QUICK_REPLIES]

Choose relevant quick replies based on the context of your response. Examples:
- For initial greetings: "Explain this question", "Give me a hint", "What concepts should I know?", "Break down the approach"
- For concept explanations: "Tell me more", "Give an example", "What's the next step?", "I need clarification"
- For hints: "Another hint please", "What should I consider?", "Is this correct?", "Move to next step"
- For follow-up questions: "Yes, that's right", "No, I'm confused", "Can you elaborate?", "What comes next?"
- For corrections: "I understand now", "Why is that wrong?", "Give another example", "Test my knowledge"

Always include 3-4 relevant quick replies that help continue the learning conversation.`;

    // Generate AI response using your existing logic
    const result = await streamText({
      model: azure("gpt-4.1"),
      system: systemPrompt,
      messages,
      maxTokens: 600,
      temperature: 0.7,
      onFinish: async (event) => {
        // Save the complete AI response when streaming finishes
        try {
          if (event.text && event.text.trim()) {
            await prisma.chatMessage.create({
              data: {
                content: event.text,
                role: "assistant",
                userId: userId,
                questionId: questionId,
              },
            });
          }
        } catch (saveError) {
          console.error("Failed to save AI response:", saveError);
          // Don't fail the response if save fails
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in study assistant API:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
