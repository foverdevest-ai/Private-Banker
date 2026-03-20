import { describe, expect, it } from "vitest";
import { detectSubscriptions } from "@/lib/finance/subscriptions";

describe("subscription detection", () => {
  it("detects recurring payments by cadence and amount similarity", () => {
    const result = detectSubscriptions([
      { merchant: "Spotify", bookedAt: new Date("2026-01-02"), amountCents: -1299n, direction: "DEBIT" },
      { merchant: "Spotify", bookedAt: new Date("2026-02-02"), amountCents: -1299n, direction: "DEBIT" },
      { merchant: "Spotify", bookedAt: new Date("2026-03-02"), amountCents: -1299n, direction: "DEBIT" },
      { merchant: "Albert Heijn", bookedAt: new Date("2026-02-05"), amountCents: -7300n, direction: "DEBIT" },
    ]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].merchantName).toContain("spotify");
    expect(result[0].confidence).toBeGreaterThanOrEqual(0.8);
  });
});
