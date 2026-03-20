import { format } from "date-fns";

const moneyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function formatEuroFromCents(cents: bigint | number): string {
  const value = typeof cents === "bigint" ? Number(cents) : cents;
  return moneyFormatter.format(value / 100);
}

export function formatDateNl(value: Date | string): string {
  return format(new Date(value), "dd-MM-yyyy");
}

export function percent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}
