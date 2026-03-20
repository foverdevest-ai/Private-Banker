import { NextResponse } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { answerFinanceQuestion } from "@/lib/ai/chat-service";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit = 35, windowMs = 60_000) {
  const now = Date.now();
  const current = rateLimitMap.get(key);
  if (!current || current.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) {
    return false;
  }
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  const user = await getCurrentUserOrThrow();
  if (!rateLimit(`chat:${user.id}`)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const question = String(body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Question required" }, { status: 400 });
  }

  let conversationId = String(body.conversationId ?? "");
  if (!conversationId) {
    const conversation = await prisma.chatConversation.create({
      data: {
        userId: user.id,
        title: question.slice(0, 80),
      },
    });
    conversationId = conversation.id;
  }

  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "USER",
      content: question,
    },
  });

  const result = await answerFinanceQuestion({
    userId: user.id,
    conversationId,
    question,
  });

  return NextResponse.json({
    conversationId,
    answer: result.message.content,
    messageId: result.message.id,
    tool: result.tool,
    toolResult: result.toolResult,
  });
}
