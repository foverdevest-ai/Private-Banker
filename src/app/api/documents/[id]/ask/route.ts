import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { askModel } from "@/lib/ai/provider";
import { getCurrentUserOrThrow } from "@/lib/auth";

function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    aNorm += a[i] * a[i];
    bNorm += b[i] * b[i];
  }
  if (aNorm === 0 || bNorm === 0) return 0;
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserOrThrow();
  const { id } = await context.params;
  const formData = await request.formData();
  const question = String(formData.get("question") ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Question required" }, { status: 400 });
  }

  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
    include: { chunks: true },
  });
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const queryVector = Array.from({ length: 24 }, (_, index) => (question.charCodeAt(index % question.length) || 1) / 1000);
  const topChunks = document.chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const prompt = [
    "Answer with sections:",
    "1) Extracted facts",
    "2) Inferred values",
    "3) Unknown/Not found",
    "4) Citations",
    "",
    `Question: ${question}`,
    `Document: ${document.title}`,
    "Chunks:",
    ...topChunks.map((chunk) => `Chunk #${chunk.chunkIndex}: ${chunk.content.slice(0, 1200)}`),
  ].join("\n");

  const answer = await askModel("You answer mortgage document questions with explicit confidence labels.", prompt);
  return NextResponse.json({
    answer,
    citations: topChunks.map((chunk) => ({
      chunkId: chunk.id,
      chunkIndex: chunk.chunkIndex,
      score: chunk.score,
    })),
  });
}
