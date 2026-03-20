import { getCurrentUserOrThrow } from "@/lib/auth";
import { getTaxInsights } from "@/lib/data";
import { formatEuroFromCents } from "@/lib/format";

export default async function TaxInsightsPage() {
  const user = await getCurrentUserOrThrow();
  const data = await getTaxInsights(user.id);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-white">Tax Insights (NL educational)</h2>
      <p className="text-sm text-slate-300">Not a filing tool. Estimates only, using versioned assumptions.</p>
      <section className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Current projection</p>
        {data?.projection && data.config ? (
          <div className="mt-2 space-y-1 text-sm text-slate-200">
            <p>Taxable base: {formatEuroFromCents(data.projection.taxableBaseCents)}</p>
            <p>Estimated Box 3 tax: {formatEuroFromCents(data.projection.estimatedTaxCents)}</p>
            <p>Exemption used: {formatEuroFromCents(data.config.box3ExemptionCents)}</p>
            <p>Rate used: {data.config.box3RatePct.toFixed(2)}%</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-300">No tax config/snapshots available yet.</p>
        )}
      </section>
      <section className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Stored yearly snapshots</p>
        <div className="mt-2 space-y-2">
          {data?.snapshots.map((snap) => (
            <div key={snap.id} className="rounded-lg border border-white/10 bg-slate-950/65 p-2 text-sm text-slate-200">
              {snap.year}: Box 3 base {formatEuroFromCents(snap.estimatedBox3BaseCents)} · Tax estimate{" "}
              {formatEuroFromCents(snap.estimatedBox3TaxCents)} · Mortgage interest summary{" "}
              {formatEuroFromCents(snap.estimatedMortgageInterestCents)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
