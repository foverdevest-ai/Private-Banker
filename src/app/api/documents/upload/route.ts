import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractMortgageFields, extractPdfText } from "@/lib/documents/extract";
import { splitIntoChunks } from "@/lib/documents/chunk";
import { createEmbedding } from "@/lib/ai/provider";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit = 20, windowMs = 60_000) {
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
  if (!rateLimit(`upload:${user.id}`, 6, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.formData();
  const file = body.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported in MVP" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extraction = await extractPdfText(buffer);

  await mkdir(env.FILE_STORAGE_PATH, { recursive: true });
  const fileName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(env.FILE_STORAGE_PATH, fileName);
  await writeFile(filePath, buffer);

  const created = await prisma.document.create({
    data: {
      userId: user.id,
      title: file.name,
      mimeType: file.type,
      filePath,
      checksum: extraction.checksum,
      totalPages: extraction.pages,
      extractedText: extraction.text.slice(0, 1_000_000),
      status: "PARSED",
      metadata: {
        bytes: file.size,
      },
    },
  });

  const fields = extractMortgageFields(extraction.text);
  const mappedFields: Array<{ fieldName: string; value: string | null }> = [
    { fieldName: "lender", value: fields.lender },
    { fieldName: "interest_rate", value: fields.interestRate },
    { fieldName: "term", value: fields.term },
    { fieldName: "monthly_payment", value: fields.monthlyPayment },
    { fieldName: "remaining_debt", value: fields.remainingDebt },
  ];

  await prisma.$transaction(async (tx) => {
    await tx.extractedField.createMany({
      data: [
        ...mappedFields.map((field) => ({
          documentId: created.id,
          fieldName: field.fieldName,
          value: field.value,
          valueKind: field.value ? ("EXACT" as const) : ("UNKNOWN" as const),
          confidence: field.value ? 0.77 : 0.1,
        })),
        ...fields.importantDates.map((date) => ({
          documentId: created.id,
          fieldName: "important_date",
          value: date,
          valueKind: "EXACT" as const,
          confidence: 0.5,
        })),
      ],
    });

    const chunks = splitIntoChunks(extraction.text);
    for (const chunk of chunks) {
      const embedding = await createEmbedding(chunk.content);
      await tx.documentChunk.create({
        data: {
          documentId: created.id,
          chunkIndex: chunk.chunkIndex,
          page: chunk.page,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          embedding,
        },
      });
    }

    await tx.document.update({
      where: { id: created.id },
      data: { status: "INDEXED" },
    });
  });

  return NextResponse.redirect(new URL("/documents", request.url));
}
