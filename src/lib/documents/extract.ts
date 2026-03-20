import { PDFParse } from "pdf-parse";
import { createHash } from "node:crypto";

export type MortgageFieldExtraction = {
  lender: string | null;
  interestRate: string | null;
  term: string | null;
  monthlyPayment: string | null;
  remainingDebt: string | null;
  importantDates: string[];
};

export async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  return {
    text: parsed.text,
    pages: parsed.total,
    checksum: createHash("sha256").update(buffer).digest("hex"),
  };
}

function matchValue(text: string, regex: RegExp): string | null {
  const match = text.match(regex);
  return match?.[1]?.trim() ?? null;
}

export function extractMortgageFields(text: string): MortgageFieldExtraction {
  const lender =
    matchValue(text, /(?:lender|bank|verstrekker)\s*[:\-]\s*([^\n]+)/i) ??
    matchValue(text, /(ABN AMRO|ING|Rabobank|SNS|Aegon|Nationale Nederlanden)/i);
  const interestRate = matchValue(text, /(?:interest|rente)\s*(?:rate)?\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*%)/i);
  const term = matchValue(text, /(?:term|looptijd)\s*[:\-]?\s*([0-9]+\s*(?:years?|jaar|maanden|months))/i);
  const monthlyPayment = matchValue(
    text,
    /(?:monthly payment|maand(?:last|bedrag))\s*[:\-]?\s*((?:€|EUR)?\s?[0-9\.\,]+)/i,
  );
  const remainingDebt = matchValue(
    text,
    /(?:remaining debt|openstaande schuld|remaining balance)\s*[:\-]?\s*(€?\s?[0-9\.\,]+)/i,
  );

  const datePattern = /\b([0-3]?\d[-/][01]?\d[-/](?:20\d{2}|\d{2}))\b/g;
  const dates = new Set<string>();
  for (const match of text.matchAll(datePattern)) {
    dates.add(match[1]);
  }

  return {
    lender,
    interestRate,
    term,
    monthlyPayment,
    remainingDebt,
    importantDates: [...dates].slice(0, 12),
  };
}
