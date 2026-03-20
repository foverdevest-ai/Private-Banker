import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatEuroFromCents } from "@/lib/format";
import { calculateNetWorth } from "@/lib/finance/calculations";

export async function getNetWorthNow(userId: string) {
  const entities = await prisma.entityMembership.findMany({
    where: { userId },
    include: {
      entity: {
        include: {
          assets: {
            include: {
              valuations: {
                orderBy: { effectiveDate: "desc" },
                take: 1,
              },
            },
          },
          liabilities: {
            include: {
              valuations: {
                orderBy: { effectiveDate: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  let assets = 0n;
  let liabilities = 0n;
  for (const row of entities) {
    for (const asset of row.entity.assets) {
      assets += asset.valuations[0]?.valueCents ?? 0n;
    }
    for (const liability of row.entity.liabilities) {
      liabilities += liability.valuations[0]?.valueCents ?? 0n;
    }
  }

  const net = calculateNetWorth({
    date: new Date().toISOString(),
    assetsCents: assets,
    liabilitiesCents: liabilities,
  });

  return {
    assetsCents: assets,
    liabilitiesCents: liabilities,
    netWorthCents: net,
    formatted: {
      assets: formatEuroFromCents(assets),
      liabilities: formatEuroFromCents(liabilities),
      netWorth: formatEuroFromCents(net),
    },
  };
}

export async function getLastMonthSpending(userId: string) {
  const currentMonth = startOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(currentMonth, 1));
  const lastMonthEnd = endOfMonth(lastMonthStart);

  const txs = await prisma.transaction.findMany({
    where: {
      account: {
        userId,
      },
      direction: "DEBIT",
      bookedAt: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
    include: {
      category: true,
    },
  });

  const total = txs.reduce((acc, tx) => acc + (tx.amountCents < 0 ? -tx.amountCents : tx.amountCents), 0n);
  const byCategory = new Map<string, bigint>();
  for (const tx of txs) {
    const key = tx.category?.name ?? "Uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0n) + (tx.amountCents < 0 ? -tx.amountCents : tx.amountCents));
  }

  return {
    from: lastMonthStart,
    to: lastMonthEnd,
    totalCents: total,
    totalFormatted: formatEuroFromCents(total),
    byCategory: [...byCategory.entries()].map(([name, amount]) => ({
      name,
      amountCents: amount,
      amountFormatted: formatEuroFromCents(amount),
    })),
  };
}

export function pickChatTool(question: string) {
  const q = question.toLowerCase();
  if (q.includes("net worth") || q.includes("vermogen")) {
    return "NET_WORTH";
  }
  if (q.includes("spend") || q.includes("category") || q.includes("uitgave")) {
    return "SPENDING";
  }
  if (q.includes("mortgage") || q.includes("hypotheek") || q.includes("document")) {
    return "DOCUMENT";
  }
  return "GENERAL";
}
