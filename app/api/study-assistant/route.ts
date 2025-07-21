// app/api/study-assistant/route.ts

import { azure } from "@/lib/ai/azure";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, questionContext } = await req.json();

    // Create system prompt with question context
    const systemPrompt = `You are an AI study assistant helping a student understand a practice question. 

Question Details:
- Type: ${questionContext.type}
- Difficulty: ${questionContext.difficulty}
- Question: ${questionContext.question}
- Tags/Topics: ${questionContext.tags?.join(", ")}
- Options: ${questionContext.options?.join(", ") || "N/A"}

${questionContext.showAnswer ? `
Student's Answer: ${questionContext.userAnswer || "No answer provided"}
Correct Answer: ${questionContext.explanation}
Result: ${questionContext.isCorrect ? "Correct" : "Incorrect"}
Explanation: ${questionContext.explanation}
` : ""}

Your role:
1. Help the student understand the question and related concepts
2. Provide hints and explanations without giving away the answer directly (unless they've already answered)
3. Break down complex concepts into simpler terms
4. Provide additional context and examples related to the topic
5. Encourage critical thinking and learning
6. Be supportive and encouraging

Guidelines:
- If the student hasn't answered yet, don't reveal the correct answer
- Focus on teaching concepts rather than just giving answers
- Use examples and analogies to explain difficult concepts
- Be encouraging and positive
- Ask follow-up questions to check understanding
- If they got it wrong, help them understand why and learn from the mistake`;

    const result = await streamText({
      model: azure('o1'),
      system: systemPrompt,
      messages,
      maxTokens: 500,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in study assistant API:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}