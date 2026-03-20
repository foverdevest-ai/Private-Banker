type TransactionInput = {
  merchant: string;
  bookedAt: Date;
  amountCents: bigint;
  direction: "DEBIT" | "CREDIT";
};

export type SubscriptionCandidateResult = {
  merchantName: string;
  cadenceDays: number;
  averageAmountCents: bigint;
  confidence: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  rationale: string;
};

function normalizeMerchant(merchant: string): string {
  return merchant.trim().toLowerCase().replace(/\s+/g, " ");
}

function dateDiffDays(a: Date, b: Date) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function detectSubscriptions(transactions: TransactionInput[]): SubscriptionCandidateResult[] {
  const byMerchant = new Map<string, TransactionInput[]>();
  for (const tx of transactions) {
    if (tx.direction !== "DEBIT") {
      continue;
    }
    const key = normalizeMerchant(tx.merchant);
    const arr = byMerchant.get(key) ?? [];
    arr.push(tx);
    byMerchant.set(key, arr);
  }

  const results: SubscriptionCandidateResult[] = [];
  for (const [merchantName, records] of byMerchant.entries()) {
    if (records.length < 3) {
      continue;
    }

    const sorted = records.sort((a, b) => a.bookedAt.getTime() - b.bookedAt.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      intervals.push(dateDiffDays(sorted[i - 1].bookedAt, sorted[i].bookedAt));
    }

    const cadence = Math.round(intervals.reduce((acc, val) => acc + val, 0) / intervals.length);
    const avgAmount = sorted.reduce((acc, tx) => acc + (tx.amountCents < 0 ? -tx.amountCents : tx.amountCents), 0n) / BigInt(sorted.length);

    const cadenceScore = cadence >= 27 && cadence <= 33 ? 0.95 : cadence >= 6 && cadence <= 9 ? 0.8 : 0.6;
    const amountVariance =
      sorted.reduce((acc, tx) => {
        const amount = tx.amountCents < 0 ? -tx.amountCents : tx.amountCents;
        const diff = amount > avgAmount ? amount - avgAmount : avgAmount - amount;
        return acc + Number(diff);
      }, 0) / sorted.length;
    const amountScore = amountVariance < 200 ? 0.95 : amountVariance < 1000 ? 0.8 : 0.55;
    const confidence = Number((cadenceScore * 0.6 + amountScore * 0.4).toFixed(2));

    if (confidence < 0.6) {
      continue;
    }

    results.push({
      merchantName,
      cadenceDays: cadence,
      averageAmountCents: avgAmount,
      confidence,
      firstSeenAt: sorted[0].bookedAt,
      lastSeenAt: sorted[sorted.length - 1].bookedAt,
      rationale: `Cadence ${cadence} days, amount variance ${Math.round(amountVariance)} cents`,
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}
