export type NetWorthPoint = {
  date: string;
  assetsCents: bigint;
  liabilitiesCents: bigint;
};

export function calculateNetWorth(point: NetWorthPoint) {
  return point.assetsCents - point.liabilitiesCents;
}

export function aggregateMonthlySpending(
  transactions: Array<{
    bookedAt: Date;
    amountCents: bigint;
    direction: "DEBIT" | "CREDIT";
    category?: string | null;
  }>,
) {
  const totals = new Map<string, { totalCents: bigint; byCategory: Map<string, bigint> }>();

  for (const tx of transactions) {
    if (tx.direction !== "DEBIT") {
      continue;
    }
    const month = `${tx.bookedAt.getUTCFullYear()}-${String(tx.bookedAt.getUTCMonth() + 1).padStart(2, "0")}`;
    const current =
      totals.get(month) ??
      {
        totalCents: 0n,
        byCategory: new Map<string, bigint>(),
      };
    const amount = tx.amountCents < 0 ? -tx.amountCents : tx.amountCents;
    const category = tx.category ?? "Uncategorized";

    current.totalCents += amount;
    current.byCategory.set(category, (current.byCategory.get(category) ?? 0n) + amount);
    totals.set(month, current);
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      totalCents: data.totalCents,
      byCategory: [...data.byCategory.entries()]
        .map(([category, totalCents]) => ({ category, totalCents }))
        .sort((a, b) => Number(b.totalCents - a.totalCents)),
    }));
}

export function reconcileMortgageBalance(input: {
  importedBalanceCents: bigint | null;
  manualOverrideCents: bigint | null;
}) {
  if (input.manualOverrideCents !== null) {
    return {
      balanceCents: input.manualOverrideCents,
      source: "MANUAL_OVERRIDE" as const,
    };
  }
  return {
    balanceCents: input.importedBalanceCents ?? 0n,
    source: "IMPORTED_OR_DEFAULT" as const,
  };
}
