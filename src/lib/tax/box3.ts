export type Box3Input = {
  netAssetsCents: bigint;
  exemptionCents: bigint;
  taxRatePct: number;
};

export function estimateBox3Tax(input: Box3Input) {
  const taxableBase = input.netAssetsCents > input.exemptionCents ? input.netAssetsCents - input.exemptionCents : 0n;
  const tax = BigInt(Math.round(Number(taxableBase) * (input.taxRatePct / 100)));
  return {
    taxableBaseCents: taxableBase,
    estimatedTaxCents: tax,
  };
}
