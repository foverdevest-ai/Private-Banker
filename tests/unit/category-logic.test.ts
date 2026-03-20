import { describe, expect, it } from "vitest";
import { aggregateMonthlySpending } from "@/lib/finance/calculations";

describe("category logic", () => {
  it("falls back to Uncategorized when category is missing", () => {
    const result = aggregateMonthlySpending([
      { bookedAt: new Date("2026-03-01"), amountCents: -1000n, direction: "DEBIT", category: null },
    ]);
    expect(result[0].byCategory[0].category).toBe("Uncategorized");
  });
});
