import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserOrThrow();
  const params = await context.params;
  const formData = await request.formData();
  const categoryId = String(formData.get("categoryId") ?? "") || null;

  const tx = await prisma.transaction.findFirst({
    where: { id: params.id, account: { userId: user.id } },
    select: { id: true },
  });
  if (!tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  await prisma.transaction.update({
    where: { id: params.id },
    data: { categoryId },
  });

  return NextResponse.redirect(new URL("/transactions", request.url));
}
