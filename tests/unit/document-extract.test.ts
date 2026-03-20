import { describe, expect, it } from "vitest";
import { extractMortgageFields } from "@/lib/documents/extract";

describe("document extraction", () => {
  it("maps mortgage fields from text", () => {
    const text = `
      Lender: ABN AMRO
      Interest rate: 3.12%
      Term: 30 years
      Monthly payment: EUR 1890
      Remaining debt: EUR 388400
      Date: 01-03-2026
    `;
    const fields = extractMortgageFields(text);

    expect(fields.lender).toContain("ABN AMRO");
    expect(fields.interestRate).toContain("3.12");
    expect(fields.monthlyPayment).toContain("1890");
    expect(fields.importantDates).toContain("01-03-2026");
  });
});
