import { describe, expect, it } from "vitest";
import { aggregateMonthlySpending, calculateNetWorth, reconcileMortgageBalance } from "@/lib/finance/calculations";

describe("finance calculations", () => {
  it("calculates net worth", () => {
    const result = calculateNetWorth({
      date: "2026-03-01",
      assetsCents: 900_000_00n,
      liabilitiesCents: 380_000_00n,
    });
    expect(result).toBe(520_000_00n);
  });

  it("aggregates monthly spending and category totals", () => {
    const result = aggregateMonthlySpending([
      { bookedAt: new Date("2026-02-01"), amountCents: -1200n, direction: "DEBIT", category: "Subscriptions" },
      { bookedAt: new Date("2026-02-03"), amountCents: -4000n, direction: "DEBIT", category: "Groceries" },
      { bookedAt: new Date("2026-02-08"), amountCents: 2200n, direction: "CREDIT", category: "Income" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].month).toBe("2026-02");
    expect(result[0].totalCents).toBe(5200n);
    expect(result[0].byCategory[0].category).toBe("Groceries");
  });

  it("prefers manual override for mortgage reconciliation", () => {
    const result = reconcileMortgageBalance({
      importedBalanceCents: 390_000_00n,
      manualOverrideCents: 388_300_00n,
    });
    expect(result.balanceCents).toBe(388_300_00n);
    expect(result.source).toBe("MANUAL_OVERRIDE");
  });
});
