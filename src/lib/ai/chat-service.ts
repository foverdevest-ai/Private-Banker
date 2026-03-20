import { prisma } from "@/lib/prisma";
import { askModel } from "@/lib/ai/provider";
import { getLastMonthSpending, getNetWorthNow, pickChatTool } from "@/lib/ai/tools";
import { formatDateNl } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export async function answerFinanceQuestion(params: {
  userId: string;
  conversationId: string;
  question: string;
}) {
  const { userId, conversationId, question } = params;
  const tool = pickChatTool(question);
  let toolResult: Record<string, unknown> = {};
  let citations: Array<{ label: string; transactionId?: string; documentId?: string }> = [];

  if (tool === "NET_WORTH") {
    toolResult = await getNetWorthNow(userId);
  } else if (tool === "SPENDING") {
    toolResult = await getLastMonthSpending(userId);
    const txs = await prisma.transaction.findMany({
      where: {
        account: { userId },
        direction: "DEBIT",
      },
      orderBy: { bookedAt: "desc" },
      take: 8,
    });
    citations = txs.map((tx) => ({
      label: `${formatDateNl(tx.bookedAt)} ${tx.description}`,
      transactionId: tx.id,
    }));
  } else if (tool === "DOCUMENT") {
    const docs = await prisma.document.findMany({
      where: { userId },
      include: { extractedFields: true },
      orderBy: { createdAt: "desc" },
      take: 2,
    });
    toolResult = {
      documents: docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        fields: doc.extractedFields.map((field) => ({
          name: field.fieldName,
          value: field.value,
          kind: field.valueKind,
        })),
      })),
    };
    citations = docs.map((doc) => ({
      label: doc.title,
      documentId: doc.id,
    }));
  }

  const systemPrompt = [
    "You are a private banker copilot for personal finance.",
    "Use provided tool results for numbers. Do not invent values.",
    "Label sections as: Data-driven facts, Educational explanation, Confidence.",
    "Include formulas and assumptions when data may be incomplete.",
  ].join("\n");

  const responseText = await askModel(
    systemPrompt,
    `Question: ${question}\nTool: ${tool}\nToolResult: ${JSON.stringify(toolResult, null, 2)}`,
  );

  const assistantMessage = await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content: responseText,
      toolResult: JSON.parse(JSON.stringify(toolResult)) as Prisma.InputJsonValue,
      citations: {
        create: citations,
      },
    },
    include: { citations: true },
  });

  return {
    tool,
    toolResult,
    message: assistantMessage,
  };
}
