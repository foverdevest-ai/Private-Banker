import { prisma } from "@/lib/prisma";
import { aggregateMonthlySpending } from "@/lib/finance/calculations";
import { detectSubscriptions } from "@/lib/finance/subscriptions";
import { estimateBox3Tax } from "@/lib/tax/box3";

export async function getDashboardData(userId: string) {
  const memberships = await prisma.entityMembership.findMany({
    where: { userId },
    include: {
      entity: {
        include: {
          assets: { include: { valuations: { orderBy: { effectiveDate: "desc" }, take: 1 } } },
          liabilities: { include: { valuations: { orderBy: { effectiveDate: "desc" }, take: 1 }, mortgage: true } },
          netWorthSnapshots: { orderBy: { date: "asc" }, take: 24 },
        },
      },
    },
  });

  const transactions = await prisma.transaction.findMany({
    where: { account: { userId } },
    include: { category: true },
    orderBy: { bookedAt: "desc" },
    take: 600,
  });

  const subscriptions = detectSubscriptions(
    transactions.map((tx) => ({
      merchant: tx.normalizedMerchant ?? tx.description,
      bookedAt: tx.bookedAt,
      amountCents: tx.amountCents,
      direction: tx.direction,
    })),
  );

  const spendingByMonth = aggregateMonthlySpending(
    transactions.map((tx) => ({
      bookedAt: tx.bookedAt,
      amountCents: tx.amountCents,
      direction: tx.direction,
      category: tx.category?.name,
    })),
  );

  const entities = memberships.map((m) => {
    const assets = m.entity.assets.reduce((acc, asset) => acc + (asset.valuations[0]?.valueCents ?? 0n), 0n);
    const liabilities = m.entity.liabilities.reduce((acc, liability) => acc + (liability.valuations[0]?.valueCents ?? 0n), 0n);
    return {
      id: m.entity.id,
      name: m.entity.name,
      type: m.entity.type,
      assetsCents: assets,
      liabilitiesCents: liabilities,
      netWorthCents: assets - liabilities,
      netWorthSnapshots: m.entity.netWorthSnapshots,
    };
  });

  const totalAssets = entities.reduce((acc, entity) => acc + entity.assetsCents, 0n);
  const totalLiabilities = entities.reduce((acc, entity) => acc + entity.liabilitiesCents, 0n);
  const totalNetWorth = totalAssets - totalLiabilities;

  const mortgage = await prisma.mortgage.findFirst({
    orderBy: { updatedAt: "desc" },
    include: {
      property: true,
      snapshots: { orderBy: { effectiveDate: "desc" }, take: 12 },
    },
  });

  return {
    entities,
    totalAssets,
    totalLiabilities,
    totalNetWorth,
    spendingByMonth,
    subscriptions: subscriptions.slice(0, 8),
    mortgage,
  };
}

export async function getTaxInsights(userId: string) {
  const membership = await prisma.entityMembership.findFirst({
    where: { userId, entity: { type: "PERSONAL" } },
    include: { entity: true },
  });
  if (!membership) {
    return null;
  }

  const entityId = membership.entityId;
  const snapshots = await prisma.taxInsightSnapshot.findMany({
    where: { entityId },
    orderBy: { year: "desc" },
    take: 3,
  });
  const config = await prisma.taxYearConfig.findFirst({
    orderBy: { year: "desc" },
  });

  if (!config) {
    return { snapshots: [], projection: null, config: null };
  }

  const latestSnapshot = await prisma.netWorthSnapshot.findFirst({
    where: { entityId },
    orderBy: { date: "desc" },
  });
  const projection = latestSnapshot
    ? estimateBox3Tax({
        netAssetsCents: latestSnapshot.totalAssetsCents,
        exemptionCents: config.box3ExemptionCents,
        taxRatePct: config.box3RatePct,
      })
    : null;

  return {
    snapshots,
    projection,
    config,
  };
}
