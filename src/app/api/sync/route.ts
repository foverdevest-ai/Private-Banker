import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { connectors } from "@/lib/connectors";
import { getCurrentUserOrThrow } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUserOrThrow();
  const contentType = request.headers.get("content-type") ?? "";
  let accountId = "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    accountId = body.accountId;
  } else {
    const body = await request.formData();
    accountId = String(body.get("accountId") ?? "");
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
    include: { connection: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const providerKey = account.connection?.provider ?? "MANUAL";
  const connector = connectors[providerKey];
  const result = await connector.sync(account.connection?.externalAccountId ?? account.id);

  await prisma.$transaction(async (tx) => {
    if (account.connection) {
      await tx.accountConnection.update({
        where: { id: account.connection.id },
        data: {
          lastSyncAt: new Date(),
          status: result.status.toLowerCase(),
          syncRuns: {
            create: {
              status: result.status,
              summary: result.summary,
              rawPayload: result.rawPayload as object,
              endedAt: new Date(),
            },
          },
        },
      });
    }

    for (const row of result.transactions) {
      const dedupeHash = createHash("sha256")
        .update(`${account.id}:${row.externalId}:${row.bookedAt}:${row.amountCents}`)
        .digest("hex");

      await tx.transaction.upsert({
        where: { accountId_dedupeHash: { accountId: account.id, dedupeHash } },
        update: {},
        create: {
          accountId: account.id,
          entityId: account.entityId,
          bookedAt: new Date(row.bookedAt),
          amountCents: BigInt(row.amountCents),
          currency: row.currency,
          direction: row.amountCents < 0 ? "DEBIT" : "CREDIT",
          description: row.description,
          normalizedMerchant: row.merchant.toLowerCase(),
          externalTransactionId: row.externalId,
          dedupeHash,
          source: "IMPORTED",
          rawPayload: row as unknown as object,
        },
      });
    }
  });

  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.redirect(new URL("/accounts", request.url));
}
